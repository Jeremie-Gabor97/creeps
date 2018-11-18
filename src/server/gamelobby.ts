import { cloneDeep } from 'lodash';
import * as SocketContract from '../shared/socketContract';
import { SocketEvent } from '../shared/socketContract';
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
	starting: boolean;
	startDuration: number;
	startTimeout: NodeJS.Timer;

	constructor(lobby: Lobby, host: IPlayerState, gameLobbyId: string, options: SocketContract.ICreateGameData) {
		this.lobby = lobby;
		this.id = gameLobbyId;
		this.host = host;
		this.players = [];
		this.maxPlayersPerTeam = options.maxPlayersPerTeam;
		this.numTeams = options.numTeams;
		this.map = options.map;
		this.title = options.title;
		this.starting = false;
		this.startDuration = 1;
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

		player.socket.on(SocketEvent.SelectCreep, (data: SocketContract.ISelectCreepData) => {
			this.selectCreep(player, data.index);
		});

		player.socket.on(SocketEvent.SendChat, (data: SocketContract.ISendChatData) => {
			this.chat(player, data.message);
		});
	}

	removeSocketListeners(player: IPlayerState) {
		player.socket.removeAllListeners(SocketEvent.StartGame);
		player.socket.removeAllListeners(SocketEvent.LeaveGameLobby);
		player.socket.removeAllListeners(SocketEvent.SwitchTeam);
		player.socket.removeAllListeners(SocketEvent.SendChat);
	}

	startGame = () => {
		if (this.starting === false) {
			const teamCounts = this.getTeamCounts();
			const numPlayers = teamCounts[0];
			let evenTeams = true;

			teamCounts.forEach(count => {
				if (count !== numPlayers) {
					evenTeams = false;
				}
			});

			if (evenTeams) {
				this.starting = true;
				this.broadcastStarting();
				this.startTimeout = setTimeout(this.actuallyStartGame, this.startDuration * 1000);
			}
		}
	}

	actuallyStartGame = () => {
		this.players.forEach(player => {
			this.removeSocketListeners(player);
		});
		this.lobby.startGame(this);
	}

	addPlayer(player: IPlayerState, isHost: boolean) {
		// add the player
		const teamCounts = this.getTeamCounts();
		let teamIndex = -1;
		let teamPlayers = this.maxPlayersPerTeam;
		teamCounts.forEach((count, index) => {
			if (count < teamPlayers) {
				teamIndex = index;
				teamPlayers = count;
			}
		});
		if (teamIndex >= 0) {
			player.location = Location.GameLobby;
			player.locationId = this.id;
			player.gameLobbyState = {
				team: teamIndex,
				creep: SocketContract.Creep.Normie
			};
			this.players.push(player);
			this.attachSocketListeners(player, isHost);
			this.broadcastState();
		}
	}

	handleDisconnect = (player: IPlayerState) => {
		const isHost = player.username === this.players[0].username;
		console.log(`player ${player.username} disconnected from gameLobby`);
		if (this.starting) {
			this.ghostPlayer(player);
		}
		else {
			if (isHost) {
				this.removeHost();
			}
			else {
				this.removePlayer(player, true);
			}
		}
	}

	removeHost = () => {
		if (this.starting === false) {
			for (let i = this.players.length - 1; i >= 0; i--) {
				const curPlayer = this.players[i];
				this.removePlayer(curPlayer, false);
			}
			this.lobby.removeGameLobby(this.id);
		}
		else {
			this.ghostPlayer(this.players[0]);
		}
	}

	removePlayer(player: IPlayerState, broadcastState: boolean) {
		if (this.starting === false) {
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
		else {
			this.ghostPlayer(player);
		}
	}

	ghostPlayer(player: IPlayerState) {
		this.removeSocketListeners(player);
		const playersIndex = this.players.indexOf(player);
		if (playersIndex >= 0) {
			const playerCopy = cloneDeep(player);
			playerCopy.disconnected = true;
			playerCopy.socket = null;
			this.players[playersIndex] = playerCopy;
		}
	}

	switchPlayer(player: IPlayerState, teamNum: SocketContract.Team) {
		if (this.starting === false) {
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
	}

	selectCreep(player: IPlayerState, index: number) {
		if (this.starting) {
			if (player.gameLobbyState) {
				player.gameLobbyState.creep = index;
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
			players: {},
			host: this.players[0].username
		};
		this.players.forEach(player => {
			if (player.gameLobbyState) {
				state.players[player.username] = {
					username: player.username,
					avatarIndex: player.avatarIndex,
					team: player.gameLobbyState.team,
					creep: player.gameLobbyState.creep
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

	broadcastStarting() {
		this.players.forEach(player => {
			const data: SocketContract.IStartingGameData = {
				duration: this.startDuration
			};
			player.socket.emit(SocketEvent.StartingGame, data);
		});
	}

	chat = (sender: IPlayerState, message: string) => {
		const data: SocketContract.IReceiveChatData = {
			username: sender ? sender.username : '',
			message,
			isSystem: sender ? false : true
		};
		this.players.forEach(player => {
			player.socket.emit(SocketEvent.ReceiveChat, data);
		});
	}
}

export default GameLobby;