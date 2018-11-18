import { autorun, IReactionDisposer } from 'mobx';
import * as SocketContract from '../shared/socketContract';
import { SocketEvent } from '../shared/socketContract';
import { degrees, Dictionary } from '../shared/utils';
import { updateGame } from './Actions';
import rootStore, { gameStore } from './Stores';

const FPS = 30;

class GameCanvas {
	canvas: HTMLCanvasElement;
	stage: createjs.Stage;
	socket: SocketIOClient.Socket;
	renderLoop: number;

	mainContainer: createjs.Container;
	mainText: createjs.Text;

	backgroundSprite: createjs.Bitmap;
	creepBodySprites: Dictionary<createjs.Bitmap>;
	creepHeadSprites: Dictionary<createjs.Bitmap>;
	projectileSprites: Dictionary<createjs.Bitmap>;
	miniSprites: Dictionary<createjs.Bitmap>;
	towerSprites: Dictionary<createjs.Bitmap>;
	wallSprites: Dictionary<createjs.Bitmap>;

	projectilesContainer: createjs.Container;
	towersContainer: createjs.Container;
	wallsContainer: createjs.Container;
	creepsContainer: createjs.Container;
	minisContainer: createjs.Container;

	projectilesDisposer: IReactionDisposer;
	towersDisposer: IReactionDisposer;
	wallsDisposer: IReactionDisposer;
	creepsDisposer: IReactionDisposer;
	minisDisposer: IReactionDisposer;

	constructor(canvas: HTMLCanvasElement, socket: SocketIOClient.Socket) {
		this.canvas = canvas;
		this.stage = new createjs.Stage(canvas);
		this.socket = socket;

		this.creepBodySprites = {};
		this.creepHeadSprites = {};
		this.miniSprites = {};
		this.towerSprites = {};
		this.projectileSprites = {};
		this.wallSprites = {};
		this.setupRenderFunctions();
		this.renderLoop = window.setInterval(this.renderTick, 1000 / FPS);
		this.attachSocketListeners();
	}

	willUnmount() {
		this.removeSocketListeners();
		this.dispose();
		window.clearInterval(this.renderLoop);
	}

	dispose() {
		this.creepsDisposer();
		this.minisDisposer();
		this.projectilesDisposer();
		this.towersDisposer();
		this.wallsDisposer();
	}

	attachSocketListeners() {
		this.socket.on(SocketEvent.GameUpdate, this.onUpdateGame);
	}

	removeSocketListeners() {
		console.log('removed listeners');
		this.socket.removeEventListener(SocketEvent.GameUpdate, this.onUpdateGame);
	}

	onUpdateGame = (data: SocketContract.IGameUpdateData) => {
		updateGame(data);
	}

	renderTick = () => {
		this.stage.update();
	}

	setupRenderFunctions() {
		this.mainContainer = new createjs.Container();
		this.mainContainer.y = 4;
		this.mainContainer.x = 100;
		const hit = new createjs.Shape();
		hit.graphics.beginFill('#000').drawRect(0, 0, 800, 400);
		this.mainContainer.hitArea = hit;
		this.mainContainer.addEventListener('click', this.onClickMain);

		this.towersContainer = new createjs.Container();
		this.minisContainer = new createjs.Container();
		this.projectilesContainer = new createjs.Container();
		this.creepsContainer = new createjs.Container();
		this.wallsContainer = new createjs.Container();

		this.mainContainer.addChild(this.wallsContainer);
		this.mainContainer.addChild(this.towersContainer);
		this.mainContainer.addChild(this.creepsContainer);
		this.mainContainer.addChild(this.minisContainer);
		this.mainContainer.addChild(this.projectilesContainer);

		this.stage.addChild(this.mainContainer);
		
		this.wallsDisposer = autorun(this.renderWalls);
		this.towersDisposer = autorun(this.renderTowers);
		this.minisDisposer = autorun(this.renderMinis);
		this.projectilesDisposer = autorun(this.renderProjectiles);
		this.creepsDisposer = autorun(this.renderCreeps);
	}

	renderWalls = () => {
		// check for walls that are now dead
		Object.keys(this.wallSprites).forEach(wallId => {
			if (!gameStore.walls.find(wall => wall.id === wallId)) {
				this.wallsContainer.removeChild(this.wallSprites[wallId]);
				delete this.wallSprites[wallId];
			}
		});
		gameStore.walls.forEach(wall => {
			// wall is new
			if (!this.wallSprites[wall.id]) {
				const newSprite = new createjs.Bitmap('');
				newSprite.x = wall.position.x;
				newSprite.y = wall.position.y;
				this.wallSprites[wall.id] = newSprite;
				this.wallsContainer.addChild(newSprite);
			}
			// wall needs updating
			else {
				const oldSprite = this.wallSprites[wall.id];
				oldSprite.x = wall.position.x;
				oldSprite.y = wall.position.y;
			}
		});
	}

	renderTowers = () => {
		// check for towers that are now dead
		Object.keys(this.towerSprites).forEach(towerId => {
			if (!gameStore.towers.find(tower => tower.id === towerId)) {
				this.towersContainer.removeChild(this.towerSprites[towerId]);
				delete this.towerSprites[towerId];
			}
		});
		gameStore.towers.forEach(tower => {
			// tower is new
			if (!this.towerSprites[tower.id]) {
				const newSprite = new createjs.Bitmap('');
				newSprite.x = tower.position.x;
				newSprite.y = tower.position.y;
				newSprite.rotation = degrees(tower.rotation) * -1;
				this.towerSprites[tower.id] = newSprite;
				this.towersContainer.addChild(newSprite);
			}
			// tower needs updating
			else {
				const oldSprite = this.towerSprites[tower.id];
				oldSprite.x = tower.position.x;
				oldSprite.y = tower.position.y;
				oldSprite.rotation = degrees(tower.rotation) * -1;
			}
		});
	}

	renderMinis = () => {
		// check for minis that are now dead
		Object.keys(this.miniSprites).forEach(miniId => {
			if (!gameStore.minis.find(mini => mini.id === miniId)) {
				this.minisContainer.removeChild(this.miniSprites[miniId]);
				delete this.miniSprites[miniId];
			}
		});
		gameStore.minis.forEach(mini => {
			// mini is new
			if (!this.miniSprites[mini.id]) {
				const newSprite = new createjs.Bitmap('');
				newSprite.x = mini.position.x;
				newSprite.y = mini.position.y;
				newSprite.rotation = degrees(mini.rotation) * -1;
				this.miniSprites[mini.id] = newSprite;
				this.minisContainer.addChild(newSprite);
			}
			// mini needs updating
			else {
				const oldSprite = this.miniSprites[mini.id];
				oldSprite.x = mini.position.x;
				oldSprite.y = mini.position.y;
				oldSprite.rotation = degrees(mini.rotation) * -1;
			}
		});
	}

	renderProjectiles = () => {
		// check for projectiles that are now dead
		Object.keys(this.projectileSprites).forEach(projectileId => {
			if (!gameStore.projectiles.find(projectile => projectile.id === projectileId)) {
				this.projectilesContainer.removeChild(this.projectileSprites[projectileId]);
				delete this.projectileSprites[projectileId];
			}
		});
		gameStore.projectiles.forEach(projectile => {
			// projectile is new
			if (!this.projectileSprites[projectile.id]) {
				const newSprite = new createjs.Bitmap('');
				newSprite.x = projectile.position.x;
				newSprite.y = projectile.position.y;
				newSprite.rotation = degrees(projectile.rotation) * -1;
				this.projectileSprites[projectile.id] = newSprite;
				this.projectilesContainer.addChild(newSprite);
			}
			// projectile needs updating
			else {
				const oldSprite = this.projectileSprites[projectile.id];
				oldSprite.x = projectile.position.x;
				oldSprite.y = projectile.position.y;
				oldSprite.rotation = degrees(projectile.rotation) * -1;
			}
		});
	}

	renderCreeps = () => {
		// check for creeps that are now dead
		Object.keys(this.creepBodySprites).forEach(creepId => {
			if (!gameStore.creeps.find(creep => creep.id === creepId)) {
				this.creepsContainer.removeChild(this.creepBodySprites[creepId]);
				this.creepsContainer.removeChild(this.creepHeadSprites[creepId]);
				delete this.creepHeadSprites[creepId];
				delete this.creepBodySprites[creepId];
			}
		});
		gameStore.creeps.forEach(creep => {
			// creep is new
			if (!this.creepBodySprites[creep.id]) {
				const newBodySprite = new createjs.Bitmap(`assets/creeps/fattieBody.png`);
				newBodySprite.x = creep.position.x;
				newBodySprite.y = creep.position.y;
				newBodySprite.regX = 16;
				newBodySprite.regY = 16;
				newBodySprite.rotation = degrees(creep.bodyRotation) * -1;
				this.creepBodySprites[creep.id] = newBodySprite;

				const newHeadSprite = new createjs.Bitmap(`assets/creeps/fattieHead.png`);
				newHeadSprite.x = creep.position.x;
				newHeadSprite.y = creep.position.y;
				newHeadSprite.regX = 16;
				newHeadSprite.regY = 16;
				newHeadSprite.rotation = degrees(creep.headRotation) * -1;
				this.creepHeadSprites[creep.id] = newHeadSprite;

				this.creepsContainer.addChild(newBodySprite);
				this.creepsContainer.addChild(newHeadSprite);
			}
			// creep needs updating
			else {
				const oldBodySprite = this.creepBodySprites[creep.id];
				oldBodySprite.x = creep.position.x;
				oldBodySprite.y = creep.position.y;
				oldBodySprite.rotation = degrees(creep.bodyRotation) * -1;

				const oldHeadSprite = this.creepHeadSprites[creep.id];
				oldHeadSprite.x = creep.position.x;
				oldHeadSprite.y = creep.position.y;
				oldHeadSprite.rotation = degrees(creep.headRotation) * -1;
			}
		});
	}

	onClickMain = (e: any) => {
		const data: SocketContract.IClickTargetData = {
			x: e.localX,
			y: e.localY
		};
		this.socket.emit(SocketEvent.ClickTarget, data);
	}
}

export default GameCanvas;