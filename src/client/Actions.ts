import { action } from 'mobx';
import * as SocketContract from '../shared/socketContract';
import RootStore, * as Stores from './Stores';

export const confirmUsername = action((username: string) => {
	RootStore.username = username;
});

export const updateLobby = action((data: SocketContract.ILobbyUpdateData) => {
	Stores.lobbyStore.lobbies = data.lobbies;
	Stores.lobbyStore.numPlayers = data.numPlayers;
});

export const updateGameLobby = action((data: SocketContract.IGameLobbyUpdateData) => {
	Stores.gameLobbyStore.title = data.title;
	Stores.gameLobbyStore.map = data.map;
	Stores.gameLobbyStore.numTeams = data.numTeams;
	Stores.gameLobbyStore.maxPlayersPerTeam = data.maxPlayersPerTeam;
	Stores.gameLobbyStore.players = data.players;
});

export const changeAvatar = action((socket: SocketIOClient.Socket, forward: boolean) => {
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
	const data: SocketContract.IChangeAvatarData = {
		index: RootStore.avatarIndex
	};
	socket.emit(SocketContract.SocketEvent.ChangeAvatar, data);
});