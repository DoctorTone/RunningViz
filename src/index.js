import $ from "jquery";
import * as THREE from "three";

import { BaseApp } from "./js/baseApp";
import { APPCONFIG } from "./js/appConfig";
import "bootstrap";

import "bootstrap/dist/css/bootstrap.min.css";
import "./css/runningStyles.css";

import runningData from "../data/testRun.gpx";
import elevationData from "../data/elevationData.json";

import { TrackPoint } from "./js/trackPoint";

class RunViz extends BaseApp {
    constructor() {
        super();
        this.cameraRotate = false;
        this.rotSpeed = Math.PI/20;
        this.rotDirection = 1;
        this.zoomingIn = false;
        this.zoomingOut = false;
        this.zoomSpeed = APPCONFIG.ZOOM_SPEED;
        this.animating = false;
        this.playbackSpeed = 1;

        //Temp variables
        this.tempVec = new THREE.Vector3();
    }

    init() {
        super.init();
    }

    addGroundPlane() {
        const groundGeom = new THREE.PlaneBufferGeometry(APPCONFIG.GROUND_WIDTH, APPCONFIG.GROUND_HEIGHT, APPCONFIG.GROUND_SEGMENTS);
        const groundMat = new THREE.MeshLambertMaterial( {color: APPCONFIG.GROUND_MATERIAL} );
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI/2;
        ground.position.y = 0;
        this.root.add(ground);
    }

    createScene() {
        // Init base createsScene
        super.createScene();
        // Create root object.
        this.root = new THREE.Object3D();
        this.scene.add(this.root);
        this.root.rotation.y = APPCONFIG.ROOT_ROTATE;

        // Add ground
        this.addGroundPlane();

        // Add avatar to scene - cube for now
        const runnerGeom = new THREE.CylinderBufferGeometry(APPCONFIG.CUBE_WIDTH, APPCONFIG.CUBE_WIDTH, APPCONFIG.CUBE_HEIGHT);
        const runnerMat = new THREE.MeshLambertMaterial( {color: 0xa0a0a0});
        const runner = new THREE.Mesh(runnerGeom, runnerMat);
        this.root.add(runner);
        runner.position.y = APPCONFIG.CUBE_HEIGHT/2;

        // Get all tracking points
        let trackPoints = runningData.gpx.trk[0].trkseg[0].trkpt;
        let currentPoint;
        let offset = new THREE.Vector3(trackPoints[0].$.lat, elevationData[0].elevation, trackPoints[0].$.lon);
        let timeOffset = new Date(trackPoints[0].time).getTime();
        let currentPosition = new THREE.Vector3();
        let UTCTime;
        let current_ms;

        let points = [];
        let numPoints = trackPoints.length - 1;

        for (let i=0; i<numPoints; ++i) {
            currentPoint = trackPoints[i];
            currentPosition.set(currentPoint.$.lat, elevationData[i].elevation, currentPoint.$.lon);
            currentPosition.sub(offset);
            currentPosition.multiplyScalar(APPCONFIG.MAP_SCALE);
            currentPosition.y /= APPCONFIG.MAP_SCALE;
            currentPosition.y *= APPCONFIG.HEIGHT_SCALE;
            UTCTime = new Date(currentPoint.time);
            current_ms = UTCTime.getTime();
            current_ms = current_ms - timeOffset;

            // Swap y/z over as long/lat
            points.push(new TrackPoint(currentPosition.x, currentPosition.y + 30, currentPosition.z, elevationData[i].distance, current_ms));
        }

        runner.position.copy(points[0].position);

        // Trails
        let sphereGeom = new THREE.SphereBufferGeometry(5);
        let sphereMat = new THREE.MeshLambertMaterial( { color: 0xff0000});
        let sphereTrail = new THREE.Mesh(sphereGeom, sphereMat);
        this.trailObject = sphereTrail;

        this.numPoints = numPoints;
        this.trackPoints = points;
        this.currentPoint = 0;
        this.runnerBody = runner;
    }

    update() {
        let delta = this.clock.getDelta() * 1000;

        if (this.cameraRotate) {
            this.root.rotation[this.rotAxis] += (this.rotSpeed * this.rotDirection * delta);
        }

        if(this.zoomingIn) {
            this.tempVec.copy(this.camera.position);
            this.tempVec.multiplyScalar(this.zoomSpeed * delta);
            this.root.position.add(this.tempVec);
            //DEBUG
            //console.log("Root = ", this.root.position);
        }

        if(this.zoomingOut) {
            this.tempVec.copy(this.camera.position);
            this.tempVec.multiplyScalar(this.zoomSpeed * delta);
            this.root.position.sub(this.tempVec);
            //DEBUG
            //console.log("Root = ", this.root.position);
        }

        if (this.animating) {
            this.elapsedTime += (delta * this.playbackSpeed);
            this.updateDisplay(this.elapsedTime);
            if (this.elapsedTime >= this.trackPoints[this.currentPoint + 1].elapsed) {
                let trail = this.trailObject.clone();
                this.root.add(trail);
                trail.position.copy(this.trackPoints[this.currentPoint].position);
                if (++this.currentPoint === (this.numPoints - 1)) {
                    this.animating = false;
                    $("#play").attr("src", "/src/images/play-button.png");
                }
                this.runnerBody.position.copy(this.trackPoints[this.currentPoint].position);
            }
        }

        super.update();
    }

    updateDisplay(time_ms) {
        let seconds = Math.round(time_ms/1000);
        let minutes = Math.floor(seconds/60);
        let hours = Math.floor(minutes/60);
        //dd = String(currentDate.getDate()).padStart(2, '0');
        
        $("#elapsedHours").html(String(hours).padStart(2, "0"));
        $("#elapsedMinutes").html(String(minutes).padStart(2, "0"));
        $("#elapsedSeconds").html(String(seconds % 60).padStart(2, "0"));
    }

    rotateCamera(status, direction) {
        switch (direction) {
            case APPCONFIG.RIGHT:
                this.rotDirection = 1;
                this.rotAxis = `y`;
                break;

            case APPCONFIG.LEFT:
                this.rotDirection = -1;
                this.rotAxis = `y`;
                break;

            case APPCONFIG.UP:
                this.rotDirection = 1;
                this.rotAxis = `x`;
                break;

            case APPCONFIG.DOWN:
                this.rotDirection = -1;
                this.rotAxis = `x`;
                break;

            default:
                break;
        };
         
        this.cameraRotate = status;
    }

    zoomIn(status) {
        this.zoomingIn = status;
    }

    zoomOut(status) {
        this.zoomingOut = status;
    }

    toggleAnimation(elem) {
        this.animating = !this.animating;
        elem.attr("src", this.animating ? "/src/images/pause-button.png" : "/src/images/play-button.png");
    }

    advancePlayback() {
        this.playbackSpeed *= 2;
        if (this.playbackSpeed > APPCONFIG.MAX_PLAYBACK) {
            this.playbackSpeed = 1;
        }
        $("#playbackSpeed").html(this.playbackSpeed);
    }
}

$( () => {
    const app = new RunViz();

    app.init();
    app.createScene();

    app.run();

    // Elements
    let rotateLeft = $("#rotateLeft");
    let rotateRight = $("#rotateRight");
    let rotateUp = $("#rotateUp");
    let rotateDown = $("#rotateDown");
    let zoomIn = $("#zoomIn");
    let zoomOut = $("#zoomOut");
    let play = $("#play");
    let fastForward = $("#fastForward");

    // Mouse interaction
    rotateLeft.on("mousedown", () => {
        app.rotateCamera(true, APPCONFIG.LEFT);
    });

    rotateLeft.on("mouseup", () => {
        app.rotateCamera(false);
    });

    rotateRight.on("mousedown", () => {
        app.rotateCamera(true, APPCONFIG.RIGHT);
    });

    rotateRight.on("mouseup", () => {
        app.rotateCamera(false);
    });

    rotateUp.on("mousedown", () => {
        app.rotateCamera(true, APPCONFIG.UP);
    });

    rotateUp.on("mouseup", () => {
        app.rotateCamera(false);
    });

    rotateDown.on("mousedown", () => {
        app.rotateCamera(true, APPCONFIG.DOWN);
    });

    rotateDown.on("mouseup", () => {
        app.rotateCamera(false);
    });

    zoomIn.on("mousedown", () => {
        app.zoomIn(true);
    });

    zoomIn.on("mouseup", () => {
        app.zoomIn(false);
    });

    zoomOut.on("mousedown", () => {
        app.zoomOut(true);
    });

    zoomOut.on("mouseup", () => {
        app.zoomOut(false);
    });

    zoomOut.on("mousedown", () => {
        app.zoomOut(true);
    });

    zoomOut.on("mouseup", () => {
        app.zoomOut(false);
    });

    // Touch interaction
    rotateLeft.on("touchstart", () => {
        app.rotateCamera(true, APPCONFIG.LEFT);
    });

    rotateLeft.on("touchend", () => {
        app.rotateCamera(false);
    });

    rotateRight.on("touchstart", () => {
        app.rotateCamera(true, APPCONFIG.RIGHT);
    });

    rotateRight.on("touchend", () => {
        app.rotateCamera(false);
    });

    rotateUp.on("touchstart", () => {
        app.rotateCamera(true, APPCONFIG.UP);
    });

    rotateUp.on("touchend", () => {
        app.rotateCamera(false);
    });

    rotateDown.on("touchstart", () => {
        app.rotateCamera(true, APPCONFIG.DOWN);
    });

    rotateDown.on("touchend", () => {
        app.rotateCamera(false);
    });

    zoomIn.on("touchstart", () => {
        app.zoomIn(true);
    });

    zoomIn.on("touchend", () => {
        app.zoomIn(false);
    });

    zoomOut.on("touchstart", () => {
        app.zoomOut(true);
    });

    zoomOut.on("touchend", () => {
        app.zoomOut(false);
    });

    $("#info").on("click", () => {
        $("#infoModal").modal();
    });

    // Playback controls
    play.on("click", () => {
        app.toggleAnimation(play);
    });

    fastForward.on("click", () => {
        app.advancePlayback();
    });
});
