import * as SocketContract from '../shared/socketcontract';
import { SocketEvent } from '../shared/socketcontract';
import Lobby, { IPlayerState, Location } from './lobby';

class GameLobby {
	lobby: Lobby;
	id: string;
	map: string;
	host: IPlayerState;
	players: IPlayerState[];
	maxPlayersPerTeam: number;
	numTeams: number;
	title: string;

	constructor(lobby: Lobby, host: IPlayerState, gameLobbyId: string, options: SocketContract.ICreateGameData) {
		this.lobby = lobby;
		this.id = gameLobbyId;
		this.host = host;
		this.players = [];
		this.maxPlayersPerTeam = options.maxPlayersPerTeam;
		this.numTeams = options.numTeams;
		this.map = options.map;
		this.title = options.title;
		this.addPlayer(host, true);
	}

	attachSocketListeners(player: IPlayerState, isHost: boolean) {
		if (isHost) {
			player.socket.on(SocketEvent.StartGame, this.startGame);
			player.socket.on(SocketEvent.LeaveGameLobby, this.removeHost);
		}
		else {
			player.socket.on(SocketEvent.LeaveGameLobby, () => {
				this.removePlayer(player, true);
			});
		}

		player.socket.on(SocketEvent.SwitchTeam, (data: SocketContract.ISwitchTeamData) => {
			this.switchPlayer(player, data.team);
		});
	}

	removeSocketListeners(player: IPlayerState) {
		player.socket.removeAllListeners(SocketEvent.StartGame);
		player.socket.removeAllListeners(SocketEvent.LeaveGameLobby);
		player.socket.removeAllListeners(SocketEvent.SwitchTeam);
	}

	startGame = () => {
		const teamCounts = this.getTeamCounts();
		const numPlayers = teamCounts[0];
		let evenTeams = true;

		teamCounts.forEach(count => {
			if (count !== numPlayers) {
				evenTeams = false;
			}
		});

		if (evenTeams) {
			this.players.forEach(player => {
				this.removeSocketListeners(player);
			});
			this.lobby.startGame(this);
		}
	}

	addPlayer(player: IPlayerState, isHost: boolean) {
		// add the player
		const teamCounts = this.getTeamCounts();
		const team = teamCounts.findIndex(count => count < this.maxPlayersPerTeam);
		if (team >= 0) {
			player.location = Location.GameLobby;
			player.locationId = this.id;
			player.gameLobbyState = {
				team: team
			};
			this.players.push(player);
			this.attachSocketListeners(player, isHost);
			this.broadcastState();
		}
	}

	handleDisconnect = (player: IPlayerState) => {
		const isHost = player.username === this.players[0].username;
		console.log(`player ${player.username} disconnected from gameLobby`);
		if (isHost) {
			this.removeHost();
		}
		else {
			this.removePlayer(player, true);
		}
	}

	removeHost = () => {
		for (let i = this.players.length - 1; i >= 0; i--) {
			const curPlayer = this.players[i];
			this.removePlayer(curPlayer, false);
		}
		this.lobby.removeGameLobby(this.id);
	}

	removePlayer(player: IPlayerState, broadcastState: boolean) {
		this.removeSocketListeners(player);
		const playersIndex = this.players.indexOf(player);
		if (playersIndex >= 0) {
			player.gameLobbyState = null;
			this.players.splice(playersIndex, 1);
			this.lobby.addPlayer(player);
			if (broadcastState) {
				this.broadcastState();
			}
			console.log(`player ${player.username} left gameLobby`);
		}
	}

	switchPlayer(player: IPlayerState, teamNum: SocketContract.Team) {
		if (teamNum < this.numTeams && player.gameLobbyState && player.gameLobbyState.team !== teamNum) {
			// check if that team is available
			const teamCounts = this.getTeamCounts();
			if (teamCounts[teamNum] < this.maxPlayersPerTeam) {
				player.gameLobbyState.team = teamNum;
				this.broadcastState();
			}
			else {
				player.socket.emit('switchTeamFailed');
			}
		}
	}

	getTeamCounts() {
		let teamCounts: number[] = [];
		for (let i = 0; i < this.numTeams; i++) {
			teamCounts[i] = 0;
		}
		this.players.forEach(player => {
			if (player.gameLobbyState) {
				teamCounts[player.gameLobbyState.team] += 1;
			}
		});
		return teamCounts;
	}

	isFull() {
		return this.players.length >= this.maxPlayersPerTeam * this.numTeams;
	}

	getState(): SocketContract.IGameLobbyUpdateData {
		const state: SocketContract.IGameLobbyUpdateData = {
			title: this.title,
			map: this.map,
			numTeams: this.numTeams,
			maxPlayersPerTeam: this.maxPlayersPerTeam,
			players: {}
		};
		this.players.forEach(player => {
			if (player.gameLobbyState) {
				state.players[player.username] = {
					username: player.username,
					avatarIndex: player.avatarIndex,
					team: player.gameLobbyState.team
				};
			}
		});
		return state;
	}

	broadcastState() {
		const state = this.getState();
		this.players.forEach(player => {
			player.socket.emit(SocketEvent.GameLobbyUpdate, state);
		});
	}
}

export default GameLobby;