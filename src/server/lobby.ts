import * as socketIO from 'socket.io';
import * as SocketContract from '../shared/socketcontract';
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
}

export interface IPlayerState {
	username: string;
	socket: socketIO.Socket;
	location: Location;
	locationId: string;
	gameLobbyState?: IGameLobbyState;
}

class Lobby {
	broadcastStateInterval: NodeJS.Timeout;
	gameCounter: number;
	gameLobbyCounter: number;
	gameLobbies: Dictionary<GameLobby>;
	games: Dictionary<Game>;
	players: Dictionary<IPlayerState>;

	constructor() {
		this.broadcastStateInterval = setInterval(this.broadcastState, 4000);
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
		player.socket.on(SocketEvent.CreateGame, () => {
			this.addGameLobby(player);
		});

		// Now in the lobby, player can join games
		player.socket.on(SocketEvent.JoinGame, (data: SocketContract.IJoinGameLobbyData) => {
			this.joinGame(player, data.gameLobbyId);
		});

		player.socket.on(SocketEvent.LeaveLobby, () => {
			this.removePlayer(player);
		});
	}

	removeSocketListeners = (player: IPlayerState) => {
		player.socket.removeAllListeners(SocketEvent.CreateGame);
		player.socket.removeAllListeners(SocketEvent.JoinGame);
		player.socket.removeAllListeners(SocketEvent.LeaveLobby);
	}

	handleDisconnect = (player: IPlayerState) => {
		console.log(`player ${player.username} disconnected from lobby`);
		this.removePlayer(player);
	}

	loginPlayer = (socket: socketIO.Socket, username: string) => {
		const newPlayer = {
			username,
			socket,
			location: Location.Lobby,
			locationId: ''
		};
		this.players[username] = newPlayer;
		this.attachSocketListeners(newPlayer, true);
		newPlayer.socket.emit('lobbyUpdate', this.getState(true));
	}

	addPlayer = (player: IPlayerState) => {
		player.location = Location.Lobby;
		this.attachSocketListeners(player, false);
		player.socket.emit('lobbyUpdate', this.getState(true));
	}

	// completely remove player from server
	removePlayer(player: IPlayerState) {
		this.removeSocketListeners(player);
		this.players[player.username] = undefined;
		delete this.players[player.username];
		console.log(`player ${player.username} leaving lobby`);
		player.socket.emit(SocketEvent.Logout);
	}

	addGameLobby(player: IPlayerState) {
		this.removeSocketListeners(player);
		const gameLobbyId = this.gameLobbyCounter++ + '';
		const gameLobby = new GameLobby(this, player, gameLobbyId);
		this.gameLobbies[gameLobbyId] = gameLobby;
	}

	removeGameLobby(gameId: string) {
		if (this.gameLobbies[gameId]) {
			this.gameLobbies[gameId] = null;
			delete this.gameLobbies[gameId];
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
			else {
				this.removeSocketListeners(player);
				gameLobby.addPlayer(player, false);
			}
		}
		else {
			const data: SocketContract.IJoinFailedData = {
				reason: SocketContract.JoinFailedReason.NotExists
			};
			player.socket.emit('joinFailed', data);
		}
	}

	getState(arriving: boolean): SocketContract.ILobbyUpdateData {
		const gameLobbies = Object.keys(this.gameLobbies).map((gameLobbyKey) => {
			const gameLobby = this.gameLobbies[gameLobbyKey];
			return {
				id: gameLobby.id,
				numPlayers: gameLobby.players.length
			};
		});
		const state = {
			lobbies: gameLobbies,
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
}

export default Lobby;