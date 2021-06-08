import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import Boid from './boid'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Loop } from './loop.js';

// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// // Objects
// const geometry = new THREE.TorusGeometry( .7, .2, 16, 100 );

// // Materials

// const material = new THREE.MeshBasicMaterial()
// material.color = new THREE.Color(0xff0000)

// // Mesh
// const sphere = new THREE.Mesh(geometry,material)
// scene.add(sphere)

// Flock
const flock = [];
var geometry = new THREE.PlaneGeometry(1, 1, 1);
var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// for (let i = 0; i < 70; i++) {
//     // let geometry = new THREE.IcosahedronGeometry( Math.random()*1.5 );
//     let boid = new Boid(geometry, material);
//     flock.push(boid);
//     scene.add(boid.mesh);
// }

// Land
var loader = new THREE.TextureLoader();
var texture = loader.load("img/texture/ground2.jpg");
texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
texture.offset.set(0, 0);
texture.repeat.set(15, 15);
const loaderrr = new GLTFLoader();
loaderrr.load(
    // resource URL
    '/assets/birch_tree.glb',
    // called when the resource is loaded
    function (gltf) {
        gltf.scene.children[0].scale.add(new THREE.Vector3(200, 200, 200));
        gltf.scene.children[0].position.add(new THREE.Vector3(0, -600, -20));
        scene.add(gltf.scene);

        gltf.animations; // Array<THREE.AnimationClip>
        gltf.scene; // THREE.Group
        gltf.scenes; // Array<THREE.Group>
        gltf.cameras; // Array<THREE.Camera>
        gltf.asset; // Object

    },
    // called while loading is progressing
    function (xhr) {

        // console.log((xhr.loaded / xhr.total * 100) + '% loaded');

    },
    // called when loading has errors
    function (error) {

        console.log('An error happened');

    }
);
geometry = new THREE.PlaneGeometry(10000, 10000);
material = new THREE.MeshBasicMaterial({
    map: texture
})
var plane = new THREE.Mesh(geometry, material);
plane.rotateX(-1.57);
plane.position.set(0, -600, -20);
var plane_gui = gui.addFolder("Plane");
plane_gui.add(plane.rotation, 'x').min(-2*Math.PI).max(2*Math.PI).step(0.01);

scene.add(plane);
geometry = new THREE.BoxGeometry(424, 1531, 435);
material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
cube.position.set(0, -600, -20);
cube.visible = false;
cube.geometry.computeBoundingBox();
const cube_center_x = (cube.geometry.boundingBox.max.x + cube.geometry.boundingBox.min.x)/2
const cube_center_y = (cube.geometry.boundingBox.max.y + cube.geometry.boundingBox.min.y)/2
const cube_center_z = (cube.geometry.boundingBox.max.z + cube.geometry.boundingBox.min.z)/2
const tree_coordinate = {
    center_x: cube_center_x,
    center_y: cube_center_y,
    center_z: cube_center_z,
    max_x: cube.geometry.boundingBox.max.x,
    max_y: cube.geometry.boundingBox.max.y,
    max_z: cube.geometry.boundingBox.max.z,
    radius_x: (cube.geometry.boundingBox.max.x-cube.geometry.boundingBox.min.x)/2,
    radius_y: (cube.geometry.boundingBox.max.y-cube.geometry.boundingBox.min.y)/2,
    radius_z: (cube.geometry.boundingBox.max.z-cube.geometry.boundingBox.min.z)/2
}
scene.add(cube);
var cube_gui = gui.addFolder("Cube");
cube_gui.add(cube.scale, 'x').min(0).max(10).step(0.01);
cube_gui.add(cube.scale, 'y').min(0).max(20).step(0.01);
cube_gui.add(cube.scale, 'z').min(0).max(10).step(0.01);
// Sky boxes

loader = new THREE.CubeTextureLoader();
texture = loader.load([
    "img/Skybox/interstellar_ft.png",
    "img/Skybox/interstellar_bk.png",
    "img/Skybox/interstellar_up.png",
    "img/Skybox/interstellar_dn.png",
    "img/Skybox/interstellar_rt.png",
    "img/Skybox/interstellar_lf.png"
])
scene.background = texture

// Bird

// Lights

const pointLight = new THREE.PointLight(0xffffff, 0.1)
pointLight.position.x = -60
pointLight.position.y = 100
pointLight.position.z = 75
pointLight.intensity = 4
scene.add(pointLight)

const parameterController = {
    alignment: 1.0,
    cohesion: 1.5,
    separation: 2.0,
    attractCenter: false
};
var boid_gui = gui.addFolder("Boid");
boid_gui.add(parameterController, 'alignment', 0.0, 20.0, 0.1);
boid_gui.add(parameterController, 'cohesion', 0.0, 5.0, 0.1);
boid_gui.add(parameterController, 'separation', 0.0, 5.0, 0.1);
boid_gui.add(parameterController, 'attractCenter').name('attract center');
var light_gui = gui.addFolder("Light");
light_gui.add(pointLight.position, 'x').min(-100).max(100).step(0.01)
light_gui.add(pointLight.position, 'y').min(-100).max(100).step(0.01)
light_gui.add(pointLight.position, 'z').min(-100).max(100).step(0.01)
light_gui.add(pointLight, 'intensity').min(0).max(20).step(0.01)

const pointLight1 = new THREE.PointLight(0xffffff, 0.1)
pointLight1.position.x = 0
pointLight1.position.y = 0
pointLight1.position.z = 0
scene.add(pointLight1)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 10000)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 500
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

controls.dampingFactor = 0.25;   //damping inertia
controls.enableZoom = true;      //Zooming
controls.maxPolarAngle = Math.PI / 2; // Limit angle of visibility
controls.minAzimuthAngle = -Math.PI + 1; // radians
controls.maxAzimuthAngle = Math.PI - 1;
controls.keys = {
    LEFT: 65, //left arrow
    UP: 87, // up arrow
    RIGHT: 68, // right arrow
    BOTTOM: 83 // down arrow
};

controls.addEventListener("change", () => {
    if (renderer) renderer.render(scene, camera);
});

window.addEventListener("keydown", onKeyDown, false);
window.addEventListener("keyup", onKeyUp, false);

function onKeyDown(event) {
    var keyCode = event.keyCode;
    switch (keyCode) {
        case 68: //d
            keyD = true;
            break;
        case 83: //s
            keyS = true;
            break;
        case 65: //a
            keyA = true;
            break;
        case 87: //w
            keyW = true;
            break;
        case 82:
            keyR = true;
            break;
    }
}

function onKeyUp(event) {
    var keyCode = event.keyCode;

    switch (keyCode) {
        case 68: //d
            keyD = false;
            break;
        case 83: //s
            keyS = false;
            break;
        case 65: //a
            keyA = false;
            break;
        case 87: //w
            keyW = false;
            break;
        case 82:
            keyR = false;
            break;
    }
}

var keyW = false;
var keyA = false;
var keyS = false;
var keyD = false;
var keyR = false;

//main animation function
function drawStuff() {
    window.requestAnimationFrame(drawStuff);

    if (keyD == true) {
        camera.position.x++;
    }
    if (keyS == true) {
        camera.position.y--;
    }
    if (keyA == true) {
        camera.position.x--;
    }
    if (keyW == true) {
        camera.position.y++;
    }
    if (keyR == true) {
        camera.position.set(0, 0, 100);
    }
}
window.requestAnimationFrame(drawStuff);
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {

    const elapsedTime = clock.getElapsedTime()

    // Update objects
    for (let boid of flock) {
        // boid.edges();
        boid.flock(flock, parameterController, tree_coordinate);
        boid.update();
    }



    // Update Orbital Controls
    controls.update();
    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

class World {
    constructor(camera, scene, renderer) {
        this.loop = new Loop(camera, scene, renderer);
    }

    async init() {

        let data;
        var ani_flock = new THREE.AnimationObjectGroup;
        for (let i = 0; i < 70; i++) {
            const loader = new GLTFLoader();
            const parrotData = await loader.loadAsync('assets/Parrot.glb');
            data = parrotData;
            let boid = new Boid(parrotData);
            flock.push(boid);
            ani_flock.add(boid.mesh)
            scene.add(boid.mesh);
            // scene.add(boid);
        }
        const mixer = new THREE.AnimationMixer(ani_flock);
        mixer.clipAction(data.animations[0]).play();
        mixer.tick = (delta) => {
            mixer.update(delta)
        }
        this.loop.updatables.push(mixer)
    }

    render() {
        // draw a single frame
        renderer.render(scene, camera);
    }

    start() {
        this.loop.start();
    }

    stop() {
        this.loop.stop();
    }
}
async function main() {
    // Get a reference to the container element
    // const container = document.querySelector('#scene-container');

    // create a new world
    const world = new World(camera, scene, renderer);

    // complete async tasks
    await world.init();

    // start the animation loop
    world.start();
}
tick()
main().catch((err) => {
    console.error(err);
});