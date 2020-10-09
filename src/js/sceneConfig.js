// General parameters to help with setting up scene

const SceneConfig = {
    clearColour: 0x91b4eb,
    ambientLightColour: 0x383838,
    pointLightColour: 0xffffff,
    LightPos: {
        x: 15,
        y: 25,
        z: 35
    },
    CameraPos: {
        x: 0,
        y: 480,
        z: 1350
    },
    LookAtPos: {
        x: 0,
        y: 0,
        z: 0
    },
    NEAR_PLANE: 0.1,
    FAR_PLANE: 10000,
    FOV: 45,
    BACKGROUND: 0x3f4245
};

export { SceneConfig };