import ear from "rabbit-ear";

const assignNearestLine = (lines, pointer) => {
	if (!pointer) { return; }
	const point = [pointer.x, pointer.y];
	const points = lines.map(line => line.nearestPoint(point));
	const distances = points.map(pt => ear.math.distance2(pt, point));
	const nearest = distances.map((d, i) => ({ d, i }))
		.sort((a, b) => a.d - b.d)
		.map(el => el.i)
		.shift();
	// console.log("nearest", nearest);
	lines.forEach(el => { el.classList = ["far"]; });
	lines[nearest].classList = ["nearest"];
};

const LineBetweenPoints = (params) => {
	switch (params.length) {
		case 2: return [ear.line.fromPoints(...params)];
		default: return [];
	}
};
const RayBetweenPoints = (params) => {
	switch (params.length) {
		case 2: return [ear.ray.fromPoints(...params)];
		default: return [];
	}
};
const SegmentBetweenPoints = (params) => {
	switch (params.length) {
		case 2: return [ear.segment(...params)];
		default: return [];
	}
};
const Axiom2 = (params) => {
	switch (params.length) {
		case 2: return ear.axiom(2, { points: params });
		default: return [];
	}
};
const Axiom3 = (params, pointer) => {
	switch (params.length) {
		case 2: {
			const solutions = ear.axiom(3, { lines: params.map(pts => ear.line.fromPoints(pts)) });
			if (solutions.length === 2) { assignNearestLine(solutions, pointer); }
			return solutions;
		}
		default: return [];
	}
};
const Axiom4 = (params) => {
	switch (params.length) {
		case 2: return ear.axiom(4, { points: [params[1]], lines: [ear.line.fromPoints(params[0])] });
		default: return [];
	}
};
const Axiom5 = (params) => {
	switch (params.length) {
		// case 3: return ear.axiom(5, { points: [params[0], params[2]], lines: [ear.line.fromPoints(params[1])] });
		case 3: return ear.axiom(5, { points: [params[2], params[0]], lines: [ear.line.fromPoints(params[1])] });
		default: return [];
	}
};
const Axiom6 = (params) => {
	switch (params.length) {
		case 4: return ear.axiom(6, {
			points: [params[0], params[2]],
			lines: [ear.line.fromPoints(params[1]), ear.line.fromPoints(params[3])],
		});
		default: return [];
	}
};
const Axiom7 = (params) => {
	switch (params.length) {
		case 3: return ear.axiom(7, {
			points: [params[0]],
			lines: [ear.line.fromPoints(params[1]), ear.line.fromPoints(params[2])]
		});
		default: return [];
	}
};
const Scribble = (params) => {
	switch (params.length) {
		case 1: return [...params];
		default: return [];
	}
};
// const Zoom = (params) => {
// 	switch (params.length) {
// 		case 2: return ear.axiom(4, { points: [params[1]], lines: [ear.line.fromPoints(params[0])] });
// 		default: return [];
// 	}
// };
const MakeSolutions = ({ tool, params, pointer }) => {
	switch (tool) {
		case "inspect": return undefined;
		// case "remove": break;
		case "line": return LineBetweenPoints(params, pointer);
		case "ray": return RayBetweenPoints(params, pointer);
		case "segment": return SegmentBetweenPoints(params, pointer);
		case "point-to-point": return Axiom2(params, pointer);
		case "line-to-line": return Axiom3(params, pointer);
		case "perpendicular": return Axiom4(params, pointer);
		case "axiom-5": return Axiom5(params, pointer);
		case "axiom-6": return Axiom6(params, pointer);
		case "axiom-7": return Axiom7(params, pointer);
		case "scribble": return Scribble(params, pointer);
		// case "pleat": return LineToLine(params, pointer);
		// case "assignment": return SingleLine(params, pointer);
		// case "transform": break;
		// case "zoom": break;
		default: return [];
	}
};

export default MakeSolutions;
