import TestMap, { IMapDetails } from '../shared/maps/test';
import * as SocketContract from '../shared/socketContract';
import { SocketEvent } from '../shared/socketContract';
import { dist } from '../shared/utils';
import Entity, { Projectile } from './entity';
import GameLobby from './gamelobby';
import Lobby, { IPlayerState, Location } from './lobby';

const FPS = 30;
const SEND_FPS = 15;
let projectileNum = 0;

class Game {
	id: string;
	lobby: Lobby;
	players: IPlayerState[];
	numTeams: number;
	gameLoop: NodeJS.Timer;
	sendLoop: NodeJS.Timer;
	mapDetails: IMapDetails;
	time: [number, number];

	towers: Entity[];
	minis: Entity[];
	projectiles: Projectile[];

	constructor(lobby: Lobby, gameLobby: GameLobby, gameId: string) {
		this.lobby = lobby;
		this.id = gameId;
		this.players = [];
		this.towers = [];
		this.minis = [];
		this.projectiles = [];
		this.numTeams = gameLobby.numTeams;
		gameLobby.players.forEach(player => this.addPlayer(player));
		this.initializeMap(gameLobby);
		this.initializePlayers();
		this.time = process.hrtime();
		this.gameLoop = setInterval(() => {
			const diff = process.hrtime(this.time);
			const deltaTime = (diff[0]) + (diff[1] / 1000000000);
			this.time = process.hrtime();
			this.tick(deltaTime);
		}, 1000 / FPS);
		this.sendLoop = setInterval(this.broadcastState, 1000 / SEND_FPS);
	}

	attachSocketListeners(player: IPlayerState) {
		player.socket.on(SocketEvent.ClickTarget, (data: SocketContract.IClickTargetData) => {
			this.onClickTarget(player, data);
		});
	}

	removeSocketListeners(player: IPlayerState) {
		player.socket.removeAllListeners(SocketEvent.ClickTarget);
	}

	addPlayer = (player: IPlayerState) => {
		player.location = Location.Game;
		player.locationId = this.id;

		this.players.push(player);
		this.attachSocketListeners(player);
	}

	removePlayer = (player: IPlayerState) => {
		this.removeSocketListeners(player);
		const playersIndex = this.players.indexOf(player);
		if (playersIndex >= 0) {
			console.log(`player ${player.username} left game`);
			player.gameLobbyState = null;
			this.players.splice(playersIndex, 1);
			this.lobby.addPlayer(player);
		}
	}

	handleDisconnect = (player: IPlayerState) => {
		const index = this.players.findIndex(p => p.username === player.username);
		if (index >= 0) {
			console.log(`player ${player.username} disconnected from game`);
			this.removePlayer(this.players[index]);
		}
	}

	onClickTarget = (player: IPlayerState, data: SocketContract.IClickTargetData) => {
		player.gameState.entity.targetPosition = {
			x: data.x,
			y: data.y
		};
	}

	initializeMap(gameLobby: GameLobby) {
		const mapDetails = TestMap;
		this.mapDetails = mapDetails;

		mapDetails.teamDetails.forEach((teamDetail, teamNum) => {
			teamDetail.towers.forEach(tower => {
				this.towers.push(new Entity({
					position: tower.position,
					damage: tower.damage,
					health: tower.health,
					maxHealth: tower.health,
					baseRotation: 0,
					baseRotationSpeed: 0,
					headRotation: 0,
					headRotationSpeed: 10,
					range: 80,
					fireRate: 1,
					team: teamNum,
					footprint: 16,
					armor: 0
				}));
			});
		});
	}

	initializePlayers() {
		let teamIndices: number[] = [];
		for (let i = 0; i < this.numTeams; i++) {
			teamIndices.push(0);
		}
		this.players.forEach(player => {
			const team = player.gameLobbyState.team;
			const newTeamIndex = teamIndices[team];
			teamIndices[team] += 1;
			const spawnPosition = this.mapDetails.teamDetails[team].spawns[newTeamIndex];

			player.gameState = {
				entity: new Entity({
					position: spawnPosition,
					spawnPoint: spawnPosition,
					baseRotation: 0,
					baseRotationSpeed: 3,
					headRotation: 0,
					headRotationSpeed: 6,
					health: 10,
					maxHealth: 10,
					fireRate: 1,
					range: 80,
					team,
					footprint: 0,
					damage: 1,
					armor: 0,
					moveSpeed: 30
				})
			};
		});
	}

	tick(deltaTime: number) {
		// Find targets
		this.players.forEach(player => {
			const playerEntity = player.gameState.entity;
			if (!playerEntity.targetEntity) {
				let minDistance = 2000;
				let minTarget: Entity | null = null;
				this.players.forEach(player2 => {
					if (player.username !== player2.username) {
						const playerEntity2 = player2.gameState.entity;
						if (playerEntity.team !== playerEntity2.team) {
							const distance = dist(playerEntity.position, playerEntity2.position);
							if (distance <= playerEntity.range && distance < minDistance) {
								minDistance = distance;
								minTarget = playerEntity2;
							}
						}
					}
				});
				if (minTarget) {
					playerEntity.targetEntity = minTarget;
					playerEntity.moveTowardsEntity = false;
				}
			}
			else if (!playerEntity.moveTowardsEntity) {
				const distance = dist(playerEntity.position, playerEntity.targetEntity.position);
				if (distance > playerEntity.range) {
					playerEntity.targetEntity = null;
				}
			}
		});

		// Turn towards targets
		this.players.forEach(player => {
			const playerEntity = player.gameState.entity;
			if (playerEntity.targetEntity || playerEntity.targetPosition) {
				playerEntity.turnTowardsTarget(deltaTime);
			}

			playerEntity.tickCooldowns(deltaTime);
			const shouldFire = playerEntity.shouldFire();
			if (shouldFire) {
				playerEntity.fireCooldown = 1 / playerEntity.fireRate;
				this.projectiles.push(new Projectile({
					id: 'p' + projectileNum++,
					position: playerEntity.position,
					speed: 100,
					rotation: playerEntity.headRotation,
					owner: playerEntity,
					target: playerEntity.targetEntity,
					damage: playerEntity.damage,
					team: playerEntity.team
				}));
			}
		});

		// Move projectiles and hit them
		for (let i = this.projectiles.length - 1; i >= 0; i--) {
			const projectile = this.projectiles[i];
			projectile.tick(deltaTime);
			if (projectile.position.x === projectile.target.position.x && projectile.position.y === projectile.target.position.y) {
				projectile.target.takeDamage(projectile.damage);
				this.projectiles.splice(i, 1);
			}
		}

		// Move players
		this.players.forEach(player => {
			const playerEntity = player.gameState.entity;
			playerEntity.moveTowardsTarget(deltaTime);
		});
		// update targets (only look for targets if have none, means untarget first),
		// then turn heads and bodies
		// then shoot if neccessary
		// then try to move things forward and collision

		// iterate over entities, turn towards their target position/entity (always succeeds)
		// minis don't collide, so move them towards their target
		// attempt to move creeps
		//  calculate potential new position for each creep
		//  look at new position, see if collides with any wall/tower/new creep position)
		//  if it does -> find point of intersection of me with that thing, move to that point
		//  compute this for every overlap and find closest one
		//  then move to next creep
		// 
		// tick player's fire cooldowns and fire if appropriate
		// move all projectiles, damage if appropriate
		// apply cooldown to abilities
		// tick currently active abilities/status effects and remove if necessary
		// look at health of all entities, set dead if appropriate
		// if main tower dead, trigger team won
		// update visible area for each team

		// targetPosition = null, targetEntity = null
		//   turn head towards body, don't move
		// targetPosition = null, targetEntity = X, moveTowardsTarget = false
		//   turn head towards X, don't turn body or move
		// targetPosition = null, targetEntity = X, moveTowardsTarget = true
		//   turn body towards X, move if body turned (keep within range), turn head towards X, shoot
		// targetPosition = A, targetEntity = null
		//   turn head towards A, turn body towards A, move if body turned
		// targetPosition = A, targetEntity = X
		//   turn head towards X, turn body towards A, move if body turned

		// start null, null, null
		// click on ground => targetPosition = A, targetEntity stays same, moveTowardsTarget = false
		// click on enemy => targetPosition = null, targetEntity = X, moveTowardsTarget = true
		// press escape => targetPosition = null, targetEntity stays same, moveTowardsTarget = false
		// if no targetEntity and enemy entities in range, targetEntity = closest one, moveTowardsTarget = false
		// if targetPosition != null and targetEntity out of range, set targetEntity to null, moveTowardsTarget = false
		// if targetPosition == null and targetEntity out of sight, targetEntity = null and targetPosition = lastSeenPosition
	}

	getState(): SocketContract.IGameUpdateData {
		const state: SocketContract.IGameUpdateData = {
			towers: [],
			projectiles: [],
			creeps: [],
			minis: [],
			walls: []
		};
		this.players.forEach(player => {
			const playerEntity = player.gameState.entity;
			state.creeps.push({
				position: playerEntity.position,
				bodyRotation: playerEntity.baseRotation,
				headRotation: playerEntity.headRotation,
				id: player.username,
				username: player.username,
				health: playerEntity.health,
				maxHealth: playerEntity.maxHealth
			});
		});
		this.towers.forEach((tower, index) => {
			state.towers.push({
				position: tower.position,
				rotation: tower.headRotation,
				id: index.toString(),
				team: tower.team,
				health: tower.health,
				maxHealth: tower.maxHealth
			});
		});
		this.projectiles.forEach((projectile, index) => {
			state.projectiles.push({
				position: projectile.position,
				rotation: projectile.rotation,
				id: projectile.id,
				team: projectile.team,
			});
		});
		return state;
	}

	broadcastState = () => {
		const state = this.getState();
		this.players.forEach(player => {
			player.socket.emit(SocketEvent.GameUpdate, state);
		});
	}
}

export default Game;