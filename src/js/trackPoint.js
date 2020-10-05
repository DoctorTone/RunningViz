import { Vector3 } from "three";

class TrackPoint {
    constructor(x, y, z, time) {
        this.position = new Vector3(x, y, z);
        this.elapsed = time;
    }
}

export { TrackPoint };
