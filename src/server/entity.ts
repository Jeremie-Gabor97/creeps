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
}

export type radians = number;

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

	health: number;
	maxHealth: number;
	damage: number;
	armor: number;

	alive: boolean;

	targetEntity: Entity;

	constructor(params: IEntityParams) {
		this.position = params.position || { x: 0, y: 0 };
		this.baseRotation = params.baseRotation || 0;
		this.baseRotationSpeed = params.baseRotationSpeed || 1;
		this.headRotation = params.headRotation || 0;
		this.headRotationSpeed = params.headRotation || 0;
		this.range = params.range || 10;
		this.fireRate = params.fireRate || 1;
		this.team = params.team;
		this.footprint = params.footprint;

		this.health = params.health;
		this.maxHealth = params.maxHealth;
		this.damage = params.damage;
		this.armor = params.armor;

		this.alive = true;
	}

	takeDamage(damage: number) {
		this.health = Math.max(this.health - damage, 0);
	}

	turnTowards(position: Pos, deltaTime: number) {
		const positionVectorX = position.x - this.position.x;
		const positionVectorY = position.y - this.position.y;
		const targetAngle = Math.atan2(positionVectorY, positionVectorX);
		const baseTurnDistance = this.baseRotationSpeed * deltaTime;
		const headTurnDistance = this.headRotationSpeed * deltaTime;
		this.baseRotation = this.getNewRotation(targetAngle, this.baseRotation, baseTurnDistance);
		this.headRotation = this.getNewRotation(targetAngle, this.headRotation, headTurnDistance);
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
		}
		return newRotation;
	}
}

export default Entity;