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

	takeDamage(damage: number) {
		this.health = Math.max(this.health - damage, 0);
	}

	turnTowards(position: Pos, deltaTime: number) {
		const positionVectorX = position.x - this.position.x;
		// browser y-coordinate is reversed
		const positionVectorY = this.position.y - position.y;
		let targetAngle = Math.atan2(positionVectorY, positionVectorX);
		if (targetAngle < 0) {
			targetAngle += 2 * Math.PI;
		}
		const baseTurnDistance = this.baseRotationSpeed * deltaTime;
		const headTurnDistance = this.headRotationSpeed * deltaTime;
		this.baseRotation = this.getNewRotation(targetAngle, this.baseRotation, baseTurnDistance);
		this.headRotation = this.getNewRotation(targetAngle, this.headRotation, headTurnDistance);
	}

	moveTowardsTarget(deltaTime: number) {
		let targetMovePosition: Pos | null = null;
		if (this.targetPosition) {
			targetMovePosition = this.targetPosition;
		}
		else if (this.targetEntity && this.moveTowardsEntity) {
			targetMovePosition = this.targetEntity.position;
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

export default Entity;