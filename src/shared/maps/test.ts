import { Pos } from '../utils';

export interface ITowerDetail {
	position: Pos;
	damage: number;
	health: number;
}

export interface ITeamMapDetails {
	spawns: Pos[];
	base: Pos;
	towers: ITowerDetail[];
}

export interface IMapDetails {
	name: string;
	width: number;
	height: number;

	minNumTeams: number;
	maxNumTeams: number;

	minPlayersPerTeam: number;
	maxPlayersPerTeam: number;

	teamDetails: ITeamMapDetails[];

	// TODO: walls
	// TODO: minis
}

const testMap: IMapDetails = {
	name: 'Test Map',
	width: 800,
	height: 400,
	minNumTeams: 2,
	maxNumTeams: 4,
	minPlayersPerTeam: 1,
	maxPlayersPerTeam: 4,
	teamDetails: [
		{
			spawns: [
				{x: 30, y: 70},
				{x: 70, y: 70},
				{x: 110, y: 70},
				{x: 150, y: 70}
			],
			towers: [
				{
					position: {x: 250, y: 150},
					damage: 1,
					health: 100
				}
			],
			base: {x: 30, y: 30}
		},
		{
			spawns: [
				{x: 670, y: 70},
				{x: 710, y: 70},
				{x: 740, y: 70},
				{x: 770, y: 70}
			],
			towers: [
				{
					position: {x: 550, y: 150},
					damage: 1,
					health: 100
				}
			],
			base: {x: 770, y: 30}
		},
		{
			spawns: [
				{x: 30, y: 330},
				{x: 70, y: 330},
				{x: 110, y: 330},
				{x: 150, y: 330}
			],
			towers: [
				{
					position: {x: 250, y: 250},
					damage: 1,
					health: 100
				}
			],
			base: {x: 30, y: 370}
		},
		{
			spawns: [
				{x: 670, y: 330},
				{x: 710, y: 330},
				{x: 740, y: 330},
				{x: 770, y: 330}
			],
			towers: [
				{
					position: {x: 550, y: 250},
					damage: 1,
					health: 100
				}
			],
			base: {x: 770, y: 370}
		}
	]
};

export default testMap;