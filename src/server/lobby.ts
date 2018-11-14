import * as socketIO from 'socket.io';
import * as SocketContract from '../shared/socketContract';
import { SocketEvent } from '../shared/socketContract';
import { Dictionary } from '../shared/utils';
import Game from './game';
import GameLobby from './gamelobby';

export const enum Location {
	Lobby,
	GameLobby,
	Game
}

export interface IGameLobbyState {
	team: SocketContract.Team;
	creep: SocketContract.Creep;
}

export interface IPlayerState {
	avatarIndex: number;
	username: string;
	socket: socketIO.Socket;
	location: Location;
	locationId: string;
	gameLobbyState?: IGameLobbyState;
	disconnected: boolean;
}

class Lobby {
	broadcastStateInterval: NodeJS.Timeout;
	gameCounter: number;
	gameLobbyCounter: number;
	gameLobbies: Dictionary<GameLobby>;
	games: Dictionary<Game>;
	players: Dictionary<IPlayerState>;

	constructor() {
		// this.broadcastStateInterval = setInterval(this.broadcastState, 4000);
		this.gameCounter = 0;
		this.gameLobbyCounter = 0;
		this.gameLobbies = {};
		this.games = {};
		this.players = {};
	}

	attachSocketListeners = (player: IPlayerState, loggingIn: boolean) => {
		if (loggingIn) {
			player.socket.on('disconnect', () => {
				switch (player.location) {
					case Location.Lobby:
						this.handleDisconnect(player);
						break;
					case Location.GameLobby:
						const gameLobbyId = player.locationId;
						const gameLobby = this.gameLobbies[gameLobbyId];
						if (gameLobby) {
							gameLobby.handleDisconnect(player);
							this.handleDisconnect(player);
						}
						break;
					case Location.Game:
						const gameId = player.locationId;
						const game = this.games[gameId];
						if (game) {
							game.handleDisconnect(player);
							this.handleDisconnect(player);
						}
						break;
					default:
						console.error('player disconnected with unknown location');
				}
			});
		}
		// Now in the lobby, player can create games
		player.socket.on(SocketEvent.CreateGame, (data: SocketContract.ICreateGameData) => {
			// TODO: validate game options
			this.addGameLobby(player, data);
		});

		// Now in the lobby, player can join games
		player.socket.on(SocketEvent.JoinGame, (data: SocketContract.IJoinGameLobbyData) => {
			this.joinGame(player, data.gameLobbyId);
		});

		player.socket.on(SocketEvent.LeaveLobby, () => {
			this.removePlayer(player);
		});

		player.socket.on(SocketEvent.ChangeAvatar, (data: SocketContract.IChangeAvatarData) => {
			this.changeAvatar(player, data);
		});

		player.socket.on(SocketEvent.SendChat, (data: SocketContract.ISendChatData) => {
			this.chat(player, data.message);
		});
	}

	removeSocketListeners = (player: IPlayerState) => {
		player.socket.removeAllListeners(SocketEvent.CreateGame);
		player.socket.removeAllListeners(SocketEvent.JoinGame);
		player.socket.removeAllListeners(SocketEvent.LeaveLobby);
		player.socket.removeAllListeners(SocketEvent.ChangeAvatar);
		player.socket.removeAllListeners(SocketEvent.SendChat);
	}

	handleDisconnect = (player: IPlayerState) => {
		console.log(`player ${player.username} disconnected from lobby`);
		this.removePlayer(player);
	}

	loginPlayer = (socket: socketIO.Socket, username: string) => {
		const newPlayer = {
			avatarIndex: 0,
			username,
			socket,
			location: Location.Lobby,
			locationId: '',
			disconnected: false
		};
		this.players[username] = newPlayer;
		this.attachSocketListeners(newPlayer, true);
		newPlayer.socket.emit(SocketEvent.ConfirmUsername, username);
		newPlayer.socket.emit(SocketEvent.LobbyUpdate, this.getState(true));
		this.broadcastState();
	}

	addPlayer = (player: IPlayerState) => {
		player.location = Location.Lobby;
		player.locationId = '';
		this.attachSocketListeners(player, false);
		player.socket.emit(SocketEvent.LobbyUpdate, this.getState(true));
		this.broadcastState();
	}

	// completely remove player from server
	removePlayer(player: IPlayerState) {
		this.removeSocketListeners(player);
		this.players[player.username] = undefined;
		delete this.players[player.username];
		console.log(`player ${player.username} leaving lobby`);
		player.socket.emit(SocketEvent.Logout);
		this.broadcastState();
	}

	addGameLobby(player: IPlayerState, data: SocketContract.ICreateGameData) {
		console.log('adding game lobby');
		this.removeSocketListeners(player);
		const gameLobbyId = this.gameLobbyCounter++ + '';
		const gameLobby = new GameLobby(this, player, gameLobbyId, data);
		this.gameLobbies[gameLobbyId] = gameLobby;
		this.broadcastState();
	}

	removeGameLobby(gameId: string) {
		if (this.gameLobbies[gameId]) {
			this.gameLobbies[gameId] = null;
			delete this.gameLobbies[gameId];
			this.broadcastState();
		}
	}

	startGame(gameLobby: GameLobby) {
		const newGameId = this.gameCounter++ + '';
		this.games[newGameId] = new Game(this, gameLobby, newGameId);
		this.removeGameLobby(gameLobby.id);
	}

	joinGame = (player: IPlayerState, gameId: string) => {
		const gameLobby = this.gameLobbies[gameId];
		if (gameLobby) {
			if (gameLobby.isFull()) {
				const data: SocketContract.IJoinFailedData = {
					reason: SocketContract.JoinFailedReason.GameFull
				};
				player.socket.emit('joinFailed', data);
			}
			else if (gameLobby.starting) {
				const data: SocketContract.IJoinFailedData = {
					reason: SocketContract.JoinFailedReason.GameStarted
				};
				player.socket.emit('joinFailed', data);
			}
			else {
				this.removeSocketListeners(player);
				gameLobby.addPlayer(player, false);
				this.broadcastState();
			}
		}
		else {
			const data: SocketContract.IJoinFailedData = {
				reason: SocketContract.JoinFailedReason.NotExists
			};
			player.socket.emit('joinFailed', data);
		}
	}

	changeAvatar = (player: IPlayerState, data: SocketContract.IChangeAvatarData) => {
		if (data.index >= 0 && data.index < SocketContract.NUM_AVATARS) {
			player.avatarIndex = data.index;
		}
	}

	getNumPlayers() {
		let players = {
			lobby: 0,
			gameLobby: 0,
			game: 0
		};
		Object.keys(this.players).forEach(username => {
			const player = this.players[username];
			switch (player.location) {
				case Location.Lobby:
					players.lobby += 1;
					break;
				case Location.GameLobby:
					players.gameLobby += 1;
					break;
				case Location.Game:
					players.game += 1;
					break;
				default:
			}
		});
		return players;
	}

	getState(arriving: boolean): SocketContract.ILobbyUpdateData {
		const gameLobbies = Object.keys(this.gameLobbies).map((gameLobbyKey) => {
			const gameLobby = this.gameLobbies[gameLobbyKey];
			return {
				id: gameLobby.id,
				numPlayers: gameLobby.players.length,
				maxPlayers: gameLobby.numTeams * gameLobby.maxPlayersPerTeam,
				playerNames: gameLobby.players.map(player => player.username),
				title: gameLobby.title
			};
		});
		const state = {
			lobbies: gameLobbies,
			numPlayers: this.getNumPlayers(),
			arriving
		};
		return state;
	}

	broadcastState = () => {
		const state = this.getState(false);
		Object.keys(this.players).forEach(username => {
			const player = this.players[username];
			if (player.location === Location.Lobby) {
				player.socket.emit(SocketEvent.LobbyUpdate, state);
			}
		});
	}

	chat = (sender: IPlayerState, message: string) => {
		const data: SocketContract.IReceiveChatData = {
			username: sender ? sender.username : '',
			message,
			isSystem: sender ? false : true
		};
		Object.keys(this.players).forEach(username => {
			const player = this.players[username];
			if (player.location === Location.Lobby) {
				player.socket.emit(SocketEvent.ReceiveChat, data);
			}
		});
	}
}

export default Lobby;