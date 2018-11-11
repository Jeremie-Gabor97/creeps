import { observable } from 'mobx';
import * as SocketContract from '../shared/socketcontract';
import { Dictionary } from '../shared/utils';

class RootStore {
	lobbyStore: LobbyStore;
	gameLobbyStore: GameLobbyStore;
	gameStore: GameStore;

	@observable username: string = '';
	@observable avatarIndex: number = 0;

	constructor() {
		this.lobbyStore = new LobbyStore(this);
		this.gameLobbyStore = new GameLobbyStore(this);
		this.gameStore = new GameStore(this);
	}
}

class LobbyStore {
	rootStore: RootStore;

	@observable lobbies: SocketContract.ILobbyData[] = [];
	@observable numPlayers: SocketContract.ILobbyNumPlayers = {
		lobby: 0,
		game: 0,
		gameLobby: 0
	};

	constructor(root: RootStore) {
		this.rootStore = root;
	}
}

class GameLobbyStore {
	rootStore: RootStore;

	@observable players: Dictionary<SocketContract.IGameLobbyPlayer> = {};

	constructor(root: RootStore) {
		this.rootStore = root;
	}
}

class GameStore {
	rootStore: RootStore;

	constructor(root: RootStore) {
		this.rootStore = root;
	}
}

const rootStore = new RootStore();
export const lobbyStore = rootStore.lobbyStore;
export const gameLobbyStore = rootStore.gameLobbyStore;
export const gameStore = rootStore.gameStore;

export default rootStore;