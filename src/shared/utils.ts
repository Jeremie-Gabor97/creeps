export type Dictionary<T> = {
	[index: string]: T;
};

export type Pos = {
	x: number;
	y: number;
};

export function degrees(radians: number) {
	return radians * 180 / Math.PI;
}