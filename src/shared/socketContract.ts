import { Dictionary } from './utils';

export interface ILoginData {
	username: string;
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