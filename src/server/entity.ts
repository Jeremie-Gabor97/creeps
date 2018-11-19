import { Team } from '../shared/socketContract';
import { Dictionary, Pos } from '../shared/utils';

export interface IEntityParams {
	position: Pos;
	baseRotation: radians;
	baseRotationSpeed: number;
	headRotation: radians;
	headRotationSpeed: number;
	range: number;
	fireRate: number;
	team: Team;
	footprint: number;

	health: number;
	maxHealth: number;
	damage: number;
	armor: number;

	spawnPoint?: Pos;
	moveSpeed?: number;
}

export type radians = number;
export const MOVE_THRESHOLD = 0.01;
export const SHOOT_THRESHOLD = 0.01;
export const STOP_MOVE_THRESHOLD = 1;

// creep, mini, tower
class Entity {
	position: Pos;
	baseRotation: radians;
	baseRotationSpeed: number;
	headRotation: radians;
	headRotationSpeed: number;
	range: number;
	fireRate: number;
	fireCooldown: number;
	team: Team;
	footprint: number;
	moveSpeed: number;

	health: number;
	maxHealth: number;
	damage: number;
	armor: number;

	alive: boolean;
	spawnPoint: Pos;

	targetPosition: Pos | null;
	targetEntity: Entity | null;
	moveTowardsEntity: boolean;

	constructor(params: IEntityParams) {
		this.position = params.position || { x: 0, y: 0 };
		this.baseRotation = params.baseRotation || 0;
		this.baseRotationSpeed = params.baseRotationSpeed || 1;
		this.headRotation = params.headRotation || 0;
		this.headRotationSpeed = params.headRotationSpeed || 0;
		this.range = params.range || 10;
		this.fireRate = params.fireRate || 1;
		this.fireCooldown = 0;
		this.team = params.team;
		this.footprint = params.footprint;

		this.health = params.health;
		this.maxHealth = params.maxHealth;
		this.damage = params.damage;
		this.armor = params.armor;

		this.alive = true;

		this.targetEntity = null;
		this.targetPosition = null;
		this.moveTowardsEntity = false;

		this.spawnPoint = params.spawnPoint || { x: 0, y: 0 };
		this.moveSpeed = params.moveSpeed || 0;
	}

	shouldFire() {
		if (this.targetEntity && this.fireCooldown === 0) {
			const positionVectorX = this.targetEntity.position.x - this.position.x;
			// browser y-coordinate is reversed
			const positionVectorY = this.position.y - this.targetEntity.position.y;
			const distanceSquared = positionVectorX * positionVectorX + positionVectorY * positionVectorY;
			// target in range so can shoot
			if (distanceSquared <= this.range * this.range) {
				let targetAngle = Math.atan2(positionVectorY, positionVectorX);
				if (targetAngle < 0) {
					targetAngle += 2 * Math.PI;
				}
				// head is pointing there so can shoot
				if (Math.abs(targetAngle - this.headRotation) < SHOOT_THRESHOLD) {
					return true;
				}
			}
		}
		return false;
	}

	tickCooldowns(deltaTime: number) {
		if (this.fireCooldown > 0) {
			this.fireCooldown -= deltaTime;
			if (this.fireCooldown < 0) {
				this.fireCooldown = 0;
			}
		}
	}

	takeDamage(damage: number) {
		this.health = Math.max(this.health - damage, 0);
	}

	turnTowardsTarget(deltaTime: number) {
		let targetEntityAngle: radians | null = null;
		let targetPositionAngle: radians | null = null;
		if (this.targetEntity) {
			const positionVectorX = this.targetEntity.position.x - this.position.x;
			// browser y-coordinate is reversed
			const positionVectorY = this.position.y - this.targetEntity.position.y;
			targetEntityAngle = Math.atan2(positionVectorY, positionVectorX);
			if (targetEntityAngle < 0) {
				targetEntityAngle += 2 * Math.PI;
			}
		}
		if (this.targetPosition) {
			const positionVectorX = this.targetPosition.x - this.position.x;
			// browser y-coordinate is reversed
			const positionVectorY = this.position.y - this.targetPosition.y;
			targetPositionAngle = Math.atan2(positionVectorY, positionVectorX);
			if (targetPositionAngle < 0) {
				targetPositionAngle += 2 * Math.PI;
			}
		}

		const baseTurnDistance = this.baseRotationSpeed * deltaTime;
		const headTurnDistance = this.headRotationSpeed * deltaTime;
		if (this.targetEntity && this.moveTowardsEntity) {
			this.baseRotation = this.getNewRotation(targetEntityAngle, this.baseRotation, baseTurnDistance);
			this.headRotation = this.getNewRotation(targetEntityAngle, this.headRotation, headTurnDistance);
		}
		else if (this.targetEntity && this.targetPosition) {
			this.baseRotation = this.getNewRotation(targetPositionAngle, this.baseRotation, baseTurnDistance);
			this.headRotation = this.getNewRotation(targetEntityAngle, this.headRotation, headTurnDistance);
		}
		else if (this.targetPosition) {
			this.baseRotation = this.getNewRotation(targetPositionAngle, this.baseRotation, baseTurnDistance);
			this.headRotation = this.getNewRotation(targetPositionAngle, this.headRotation, headTurnDistance);
		}
	}

	moveTowardsTarget(deltaTime: number) {
		let targetMovePosition: Pos | null = null;
		if (this.targetEntity && this.moveTowardsEntity) {
			targetMovePosition = this.targetEntity.position;
		}
		else if (this.targetPosition) {
			targetMovePosition = this.targetPosition;
		}
		if (targetMovePosition) {
			const positionVectorX = targetMovePosition.x - this.position.x;
			// browser y-coordinate is reversed
			const positionVectorY = this.position.y - targetMovePosition.y;
			if (positionVectorX * positionVectorX + positionVectorY * positionVectorY > STOP_MOVE_THRESHOLD) {
				let targetAngle = Math.atan2(positionVectorY, positionVectorX);
				if (targetAngle < 0) {
					targetAngle += 2 * Math.PI;
				}
				// body is pointing there so can move
				if (Math.abs(targetAngle - this.baseRotation) < MOVE_THRESHOLD) {
					this.position.x += Math.cos(this.baseRotation) * deltaTime * this.moveSpeed;
					this.position.y -= Math.sin(this.baseRotation) * deltaTime * this.moveSpeed;
				}
			}
		}
	}

	getNewRotation(targetAngle: radians, currentRotation: radians, turnDistance: number) {
		let newRotation = -1;
		if (targetAngle > currentRotation) {
			let diff = targetAngle - currentRotation;
			// turn counter clockwise
			if (diff <= Math.PI) {
				if (diff <= turnDistance) {
					newRotation = targetAngle;
				}
				else {
					newRotation = currentRotation + turnDistance;
				}
			}
			// turn clockwise
			else {
				if ((2 * Math.PI - diff) <= turnDistance) {
					newRotation = targetAngle;
				}
				else {
					newRotation = currentRotation - turnDistance;
					if (newRotation < 0) {
						newRotation += 2 * Math.PI;
					}
				}
			}
		}
		else {
			let diff = currentRotation - targetAngle;
			// turn clockwise
			if (diff <= Math.PI) {
				if (diff <= turnDistance) {
					newRotation = targetAngle;
				}
				else {
					newRotation = currentRotation - turnDistance;
				}
			}
			// turn counter clockwise
			else {
				if ((2 * Math.PI - diff) <= turnDistance) {
					newRotation = targetAngle;
				}
				else {
					newRotation = currentRotation + turnDistance;
					if (newRotation >= 2 * Math.PI) {
						newRotation -= 2 * Math.PI;
					}
				}
			}
		}
		if (newRotation < 0) {
			console.log('rotation didnt work');
			console.log(newRotation);
		}
		return newRotation;
	}
}

interface IProjectileParams {
	id: string;
	position: Pos;
	rotation: radians;
	owner: Entity;
	target: Entity;
	speed: number;
	damage: number;
	team: Team;
}

export class Projectile {
	id: string;
	position: Pos;
	rotation: radians;
	owner: Entity;
	target: Entity;
	speed: number;
	damage: number;
	team: Team;

	constructor(params: IProjectileParams) {
		this.id = params.id;
		this.position = {
			x: params.position.x,
			y: params.position.y
		};
		this.rotation = params.rotation;
		this.owner = params.owner;
		this.target = params.target;
		this.speed = params.speed;
		this.damage = params.damage;
		this.team = params.team;
	}

	tick(deltaTime: number) {
		const positionVectorX = this.target.position.x - this.position.x;
		// browser y-coordinate is reversed
		const positionVectorY = this.position.y - this.target.position.y;
		const distanceSquared = positionVectorX * positionVectorX + positionVectorY * positionVectorY;
		if (Math.sqrt(distanceSquared) < this.speed * deltaTime) {
			this.position = {
				x: this.target.position.x,
				y: this.target.position.y
			};
		}
		else {
			let targetAngle = Math.atan2(positionVectorY, positionVectorX);
			if (targetAngle < 0) {
				targetAngle += 2 * Math.PI;
			}
			this.rotation = targetAngle;
			this.position.x += Math.cos(targetAngle) * deltaTime * this.speed;
			this.position.y -= Math.sin(targetAngle) * deltaTime * this.speed;
		}
	}
}

export default Entity;