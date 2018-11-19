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
	creepLabels: Dictionary<createjs.Text>;
	creepHealths: Dictionary<createjs.Shape>;
	projectileSprites: Dictionary<createjs.Bitmap>;
	miniSprites: Dictionary<createjs.Bitmap>;
	towerBodySprites: Dictionary<createjs.Bitmap>;
	towerHeadSprites: Dictionary<createjs.Bitmap>;
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
		this.creepLabels = {};
		this.creepHealths = {};
		this.miniSprites = {};
		this.towerBodySprites = {};
		this.towerHeadSprites = {};
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
		Object.keys(this.towerBodySprites).forEach(towerId => {
			if (!gameStore.towers.find(tower => tower.id === towerId)) {
				this.towersContainer.removeChild(this.towerBodySprites[towerId]);
				this.towersContainer.removeChild(this.towerHeadSprites[towerId]);
				delete this.towerBodySprites[towerId];
				delete this.towerHeadSprites[towerId];
			}
		});
		gameStore.towers.forEach(tower => {
			// tower is new
			if (!this.towerBodySprites[tower.id]) {
				const newBodySprite = new createjs.Bitmap('assets/creeps/towerBody.png');
				newBodySprite.x = tower.position.x;
				newBodySprite.y = tower.position.y;
				newBodySprite.rotation = 0;
				this.towerBodySprites[tower.id] = newBodySprite;
				this.towersContainer.addChild(newBodySprite);

				const newHeadSprite = new createjs.Bitmap('assets/creeps/towerHead.png');
				newHeadSprite.x = tower.position.x;
				newHeadSprite.y = tower.position.y;
				newHeadSprite.rotation = degrees(tower.rotation) * -1;
				this.towerHeadSprites[tower.id] = newHeadSprite;
				this.towersContainer.addChild(newHeadSprite);
			}
			// tower needs updating
			else {
				const oldBodySprite = this.towerBodySprites[tower.id];
				oldBodySprite.x = tower.position.x;
				oldBodySprite.y = tower.position.y;

				const oldHeadSprite = this.towerHeadSprites[tower.id];
				oldHeadSprite.x = tower.position.x;
				oldHeadSprite.y = tower.position.y;
				oldHeadSprite.rotation = degrees(tower.rotation) * -1;
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
				const newSprite = new createjs.Bitmap(`assets/creeps/bullet.png`);
				newSprite.x = projectile.position.x;
				newSprite.y = projectile.position.y;
				newSprite.regX = 4;
				newSprite.regY = 4;
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
				this.creepsContainer.removeChild(this.creepHealths[creepId]);
				this.creepsContainer.removeChild(this.creepLabels[creepId]);
				delete this.creepHeadSprites[creepId];
				delete this.creepBodySprites[creepId];
				delete this.creepHealths[creepId];
				delete this.creepLabels[creepId];
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

				const newLabel = new createjs.Text(`${creep.username}`);
				newLabel.x = creep.position.x;
				newLabel.y = creep.position.y - 30;
				newLabel.textAlign = 'center';
				this.creepLabels[creep.id] = newLabel;

				const newHealth = new createjs.Shape();
				newHealth.x = creep.position.x;
				newHealth.y = creep.position.y - 20;
				newHealth.graphics.beginFill('green');
				newHealth.graphics.drawRect(-16, 0, 32 * creep.health / creep.maxHealth, 4);
				newHealth.graphics.endFill();
				this.creepHealths[creep.id] = newHealth;

				this.creepsContainer.addChild(newBodySprite);
				this.creepsContainer.addChild(newHeadSprite);
				this.creepsContainer.addChild(newLabel);
				this.creepsContainer.addChild(newHealth);
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

				const oldLabel = this.creepLabels[creep.id];
				oldLabel.x = creep.position.x;
				oldLabel.y = creep.position.y - 30;

				const oldHealth = this.creepHealths[creep.id];
				oldHealth.x = creep.position.x;
				oldHealth.y = creep.position.y - 20;
				oldHealth.graphics.clear();
				oldHealth.graphics.beginFill('green');
				oldHealth.graphics.drawRect(-16, 0, 32 * creep.health / creep.maxHealth, 4);
				oldHealth.graphics.endFill();
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