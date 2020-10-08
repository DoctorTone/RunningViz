import { Vector3 } from "three";

class TrackPoint {
    constructor(x, y, z, distance, time) {
        this.position = new Vector3(x, y, z);
        this.distance = distance;
        this.elapsed = time;
    }
}

export { TrackPoint };
