import { Dictionary, Pos } from './utils';

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
export const NUM_CREEPS = 2;
export const CREEP_NAMES = [
	'Normie',
	'Fattie'
];
export const enum Creep {
	Normie,
	Fattie
}
export interface ICreep {
	name: string;
	type: Creep;
}
export const Creeps: Dictionary<ICreep> = {
	Normie: { name: 'Normie', type: Creep.Normie },
	Fattie: { name: 'Fattie', type: Creep.Fattie }
};

export const SocketEvent = {
	// Shared Events
	SendChat: 'sendChat',
	ReceiveChat: 'receiveChat',
	// Main Events
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
	StartingGame: 'startingGame',
	LeaveGameLobby: 'leaveGameLobby',
	SwitchTeam: 'switchTeam',
	GameLobbyUpdate: 'gameLobbyUpdate',
	SelectCreep: 'selectCreep',
	// GameEvents
	GameUpdate: 'gameUpdate',
	ClickTarget: 'clickTarget'
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
	GameFull,
	GameStarted
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
	creep: Creep;
}

export interface IGameLobbyUpdateData {
	title: string;
	map: string;
	numTeams: number;
	maxPlayersPerTeam: number;
	players: Dictionary<IGameLobbyPlayer>;
	host: string;
}

export interface ISelectCreepData {
	index: number;
}

export interface IStartingGameData {
	duration: number;
}

export interface ISendChatData {
	message: string;
}

export interface IReceiveChatData {
	username: string;
	message: string;
	isSystem: boolean;
}

export interface IGameCreep {
	id: string; // username can change if someone rejoins
	username: string;
	position: Pos;
	bodyRotation: number;
	headRotation: number;
	health: number;
	maxHealth: number;
}

export interface IGameMini {
	id: string;
	position: Pos;
	rotation: number;
	team: Team;
	health: number;
	maxHealth: number;
}

export interface IGameTower {
	id: string;
	position: Pos;
	rotation: number;
	team: Team;
	health: number;
	maxHealth: number;
}

export interface IGameProjectile {
	id: string;
	position: Pos;
	rotation: number;
	team: Team;
}

export interface IGameWall {
	id: string;
	position: Pos;
}

export interface IGameUpdateData {
	projectiles: IGameProjectile[];
	towers: IGameTower[];
	creeps: IGameCreep[];
	minis: IGameMini[];
	walls: IGameWall[];
}

export interface IClickTargetData {
	x: number;
	y: number;
}