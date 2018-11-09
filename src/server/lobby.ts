import * as socketIO from 'socket.io';
import * as SocketContract from '../shared/socketcontract';
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

	attachSocketListeners = (player: IPlayerState) => {
		// Now in the lobby, player can create games
		player.socket.on('createGame', () => {
			// this.removePlayer(player.socketId);
			// this.addGameLobby(player);
		});

		// Now in the lobby, player can join games
		player.socket.on('joinGame', (gameId: string) => {
			const gameLobby = this.gameLobbies[gameId];
			if (gameLobby) {
				if (gameLobby.isFull()) {
					const data: SocketContract.IJoinFailedData = {
						reason: SocketContract.JoinFailedReason.GameFull
					};
					player.socket.emit('joinFailed', data);
				}
				else {
					gameLobby.addPlayer(player, false);
				}
			}
			else {
				const data: SocketContract.IJoinFailedData = {
					reason: SocketContract.JoinFailedReason.NotExists
				};
				player.socket.emit('joinFailed', data);
			}
		});
	}

	removeSocketListeners = (player: IPlayerState) => {
		player.socket.removeAllListeners('createGame');
		player.socket.removeAllListeners('joinGame');
	}

	loginPlayer = (socket: socketIO.Socket, username: string) => {
		const newPlayer = {
			username,
			socket,
			location: Location.Lobby
		};
		this.players[username] = newPlayer;
		this.attachSocketListeners(newPlayer);
		newPlayer.socket.emit('lobbyUpdate', this.getState());
	}

	addPlayer = (player: IPlayerState) => {
		player.location = Location.Lobby;
		this.attachSocketListeners(player);
		player.socket.emit('lobbyUpdate', this.getState());
	}

	// player quit gracefully
	removePlayer(player: IPlayerState) {
		this.removeSocketListeners(player);
		this.players[player.username] = undefined;
		delete this.players[player.username];
		player.socket.emit('logout');
	}

	addGameLobby(player: IPlayerState) {
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
		this.games[newGameId] = new Game(this, gameLobby);
		this.removeGameLobby(gameLobby.id);
	}

	getState(): SocketContract.ILobbyUpdateData {
		const gameLobbies = Object.keys(this.gameLobbies).map((gameLobbyKey) => {
			const gameLobby = this.gameLobbies[gameLobbyKey];
			return {
				id: gameLobby.id,
				numPlayers: gameLobby.players.length
			};
		});
		const state = {
			lobbies: gameLobbies
		};
		return state;
	}

	broadcastState = () => {
		const state = this.getState();
		Object.keys(this.players).forEach(username => {
			const player = this.players[username];
			if (player.location === Location.Lobby) {
				player.socket.emit('lobbyUpdate', state);
			}
		});
	}
}

export default Lobby;