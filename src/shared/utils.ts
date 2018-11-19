export type Dictionary<T> = {
	[index: string]: T;
};

export type Pos = {
	x: number;
	y: number;
};

export function dist(pos1: Pos, pos2: Pos) {
	const xDist = pos1.x - pos2.x;
	const yDist = pos1.y - pos2.y;
	return Math.sqrt(xDist * xDist + yDist * yDist);
}

export function degrees(radians: number) {
	return radians * 180 / Math.PI;
}