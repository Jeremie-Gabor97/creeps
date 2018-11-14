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
	Stores.gameLobbyStore.host = data.host;
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

export const updateTimeLeft = action((timeLeft: number) => {
	Stores.gameLobbyStore.timeLeft = timeLeft;
});

export const startGameTimer = action((data: SocketContract.IStartingGameData) => {
	Stores.gameLobbyStore.starting = true;
	updateTimeLeft(data.duration);
	const interval = setInterval(() => {
		if (Stores.gameLobbyStore.timeLeft === 0) {
			clearInterval(interval);
		}
		else {
			updateTimeLeft(Stores.gameLobbyStore.timeLeft - 1);
		}
	}, 1000);
});

export const addLobbyChat = action((data: SocketContract.IReceiveChatData) => {
	Stores.lobbyStore.chatMessages.push(data);
});
export const addGameLobbyChat = action((data: SocketContract.IReceiveChatData) => {
	Stores.gameLobbyStore.chatMessages.push(data);
});
export const clearLobbyChat = action((data: SocketContract.IReceiveChatData) => {
	Stores.lobbyStore.chatMessages = [];
});
export const clearGameLobbyChat = action((data: SocketContract.IReceiveChatData) => {
	Stores.gameLobbyStore.chatMessages = [];
});
