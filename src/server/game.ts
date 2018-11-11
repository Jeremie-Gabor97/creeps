import * as SocketContract from '../shared/socketcontract';
import GameLobby from './gamelobby';
import Lobby, { IPlayerState, Location } from './lobby';

class Game {
	id: string;
	lobby: Lobby;
	players: IPlayerState[];

	constructor(lobby: Lobby, gameLobby: GameLobby, gameId: string) {
		this.lobby = lobby;
		this.players = [];
		this.id = gameId;
		gameLobby.players.forEach(player => this.addPlayer(player));
	}

	attachSocketListeners(player: IPlayerState) {
		player.socket.on('move', () => {
			// something
		});
	}

	removeSocketListeners(player: IPlayerState) {
		player.socket.removeAllListeners('move');
	}

	addPlayer = (player: IPlayerState) => {
		player.location = Location.Game;
		player.locationId = this.id;
		this.players.push(player);
		this.attachSocketListeners(player);
	}

	removePlayer = (player: IPlayerState) => {
		this.removeSocketListeners(player);
		const playersIndex = this.players.indexOf(player);
		if (playersIndex >= 0) {
			console.log(`player ${player.username} left game`);
			player.gameLobbyState = null;
			this.players.splice(playersIndex, 1);
			this.lobby.addPlayer(player);
		}
	}

	handleDisconnect = (player: IPlayerState) => {
		const index = this.players.findIndex(p => p.username === player.username);
		if (index >= 0) {
			console.log(`player ${player.username} disconnected from game`);
			this.removePlayer(this.players[index]);
		}
	}
}

export default Game;