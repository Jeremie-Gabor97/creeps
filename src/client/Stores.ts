import { observable } from 'mobx';
import * as SocketContract from '../shared/socketContract';
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
	@observable chatMessages: SocketContract.IReceiveChatData[] = [];

	constructor(root: RootStore) {
		this.rootStore = root;
	}
}

class GameLobbyStore {
	rootStore: RootStore;

	@observable title: string = '';
	@observable map: string = '';
	@observable numTeams: number = 2;
	@observable maxPlayersPerTeam: number = 4;
	@observable players: Dictionary<SocketContract.IGameLobbyPlayer> = {};
	@observable starting: boolean = false;
	@observable timeLeft: number = 30;
	@observable host: string = '';
	@observable chatMessages: SocketContract.IReceiveChatData[] = [];

	constructor(root: RootStore) {
		this.rootStore = root;
	}
}

class GameStore {
	rootStore: RootStore;

	@observable projectiles: SocketContract.IGameProjectile[] = [];
	@observable towers: SocketContract.IGameTower[] = [];
	@observable minis: SocketContract.IGameMini[] = [];
	@observable creeps: SocketContract.IGameCreep[] = [];
	@observable walls: SocketContract.IGameWall[] = [];

	constructor(root: RootStore) {
		this.rootStore = root;
	}
}

const rootStore = new RootStore();
export const lobbyStore = rootStore.lobbyStore;
export const gameLobbyStore = rootStore.gameLobbyStore;
export const gameStore = rootStore.gameStore;

export default rootStore;