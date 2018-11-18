import * as SocketContract from '../shared/socketContract';
import { SocketEvent } from '../shared/socketContract';
import Entity from './entity';
import GameLobby from './gamelobby';
import Lobby, { IPlayerState, Location } from './lobby';

const FPS = 30;
const SEND_FPS = 15;

class Game {
	id: string;
	lobby: Lobby;
	players: IPlayerState[];
	gameLoop: NodeJS.Timer;
	sendLoop: NodeJS.Timer;

	constructor(lobby: Lobby, gameLobby: GameLobby, gameId: string) {
		this.lobby = lobby;
		this.players = [];
		this.id = gameId;
		gameLobby.players.forEach(player => this.addPlayer(player));
		this.gameLoop = setInterval(this.tick, 1000 / FPS);
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
		player.gameState = {
			entity: new Entity({
				position: {
					x: 100 + 100 * player.gameLobbyState.team,
					y: 100
				},
				baseRotation: 0,
				baseRotationSpeed: 0,
				headRotation: 0,
				headRotationSpeed: 0,
				health: 0,
				maxHealth: 0,
				fireRate: 0,
				range: 0,
				team: player.gameLobbyState.team,
				footprint: 0,
				damage: 0,
				armor: 0
			})
		};
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
		player.gameState.entity.position = {
			x: data.x,
			y: data.y
		};
	}

	tick() {
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
			const gameData = player.gameState;
			state.creeps.push({
				position: gameData.entity.position,
				bodyRotation: 0,
				headRotation: 0,
				id: player.username,
				username: player.username,
				health: 0,
				maxHealth: 0
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