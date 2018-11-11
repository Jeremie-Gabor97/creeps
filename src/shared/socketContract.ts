import { Dictionary } from './utils';

export const SocketEvent = {
	Login: 'login',
	LoginFailed: 'loginFailed',
	Logout: 'logout',
	// Lobby Events
	LeaveLobby: 'leaveLobby',
	CreateGame: 'createGame',
	JoinGame: 'joinGame',
	JoinFailed: 'joinFailed',
	LobbyUpdate: 'lobbyUpdate',
	// GameLobby Events
	StartGame: 'startGame',
	LeaveGameLobby: 'leaveGameLobby',
	SwitchTeam: 'switchTeam',
	GameLobbyUpdate: 'gameLobbyUpdate'
};

export enum LoginFailedReason {
	UsernameInUse,
	UsernameTooLong,
	UsernameInvalid
}
export interface ILoginFailedData {
	reason: LoginFailedReason;
}

export interface ILoginData {
	username: string;
}

export interface IJoinGameLobbyData {
	gameLobbyId: string;
}

export enum JoinFailedReason {
	NotExists,
	GameFull
}

export interface IJoinFailedData {
	reason: JoinFailedReason;
}

export interface ILobbyData {
	id: string;
	numPlayers: number;
}

export interface ILobbyUpdateData {
	lobbies: ILobbyData[];
	arriving: boolean;
}

export const enum Team {
	Blue,
	Red,
	Green,
	Yellow
}

export interface ISwitchTeamData {
	team: Team;
}

export interface IGameLobbyPlayer {
	team: Team;
}

export interface IGameLobbyUpdateData {
	players: Dictionary<IGameLobbyPlayer>;
}