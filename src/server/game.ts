import * as SocketContract from '../shared/socketcontract';
import GameLobby from './gamelobby';
import Lobby, { IPlayerState } from './lobby';

class Game {
	lobby: Lobby;

	constructor(lobby: Lobby, gameLobby: GameLobby) {
		this.lobby = lobby;
	}
}

export default Game;