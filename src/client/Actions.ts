import { action } from 'mobx';
import * as SocketContract from '../shared/socketcontract';
import RootStore, * as Stores from './stores';

export const confirmUsername = action((username: string) => {
	RootStore.username = username;
});

export const updateLobby = action((data: SocketContract.ILobbyUpdateData) => {
	Stores.lobbyStore.lobbies = data.lobbies;
	Stores.lobbyStore.numPlayers = data.numPlayers;
});

export const updateGameLobby = action((data: SocketContract.IGameLobbyUpdateData) => {
	Stores.gameLobbyStore.players = data.players;
});

export const changeAvatar = action((forward: boolean) => {
	if (forward) {
		RootStore.avatarIndex += 1;
		if (RootStore.avatarIndex >= SocketContract.NUM_AVATARS) {
			RootStore.avatarIndex = 0;
		}
	}
	else {
		RootStore.avatarIndex -= 1;
		if (RootStore.avatarIndex < 0) {
			RootStore.avatarIndex = SocketContract.NUM_AVATARS - 1;
		}
	}
});