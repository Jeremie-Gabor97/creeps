import { Dictionary } from './utils';

export const NUM_AVATARS = 9;
export const AVATAR_NAMES = [
	'cyclops',
	'demon',
	'dragon',
	'fish',
	'ghost',
	'golem',
	'skeleton',
	'sun',
	'tree'
];

export const SocketEvent = {
	ConfirmUsername: 'confirmUsername',
	Login: 'login',
	LoginFailed: 'loginFailed',
	Logout: 'logout',
	// Lobby Events
	LeaveLobby: 'leaveLobby',
	CreateGame: 'createGame',
	JoinGame: 'joinGame',
	JoinFailed: 'joinFailed',
	LobbyUpdate: 'lobbyUpdate',
	ChangeAvatar: 'changeAvatar',
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

export interface ICreateGameData {
	map: string;
	numTeams: number;
	maxPlayersPerTeam: number;
	title: string;
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
	maxPlayers: number;
	playerNames: string[];
	title: string;
}

export interface ILobbyNumPlayers {
	lobby: number;
	gameLobby: number;
	game: number;
}

export interface ILobbyUpdateData {
	lobbies: ILobbyData[];
	numPlayers: ILobbyNumPlayers;
	arriving: boolean;
}

export interface IChangeAvatarData {
	index: number;
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
	avatarIndex: number;
	username: string;
	team: Team;
}

export interface IGameLobbyUpdateData {
	title: string;
	map: string;
	numTeams: number;
	maxPlayersPerTeam: number;
	players: Dictionary<IGameLobbyPlayer>;
}