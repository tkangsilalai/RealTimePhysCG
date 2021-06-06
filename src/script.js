import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import Boid from './boid'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Loop } from './loop.js';
import { loadBirds } from './bird.js';

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
var texture = loader.load("img/texture/ground.jpg");
geometry = new THREE.PlaneGeometry(100, 100);
material = new THREE.MeshBasicMaterial({
    map: texture
})
const loaderrr = new GLTFLoader();
loaderrr.load(
    // resource URL
    '/assets/birch_tree.glb',
    // called when the resource is loaded
    function (gltf) {

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
var plane = new THREE.Mesh(geometry, material);
plane.rotateX(-20);
plane.position.set(0, 0, -20);
scene.add(plane);

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
gui.add(pointLight.position, 'x').min(-100).max(100).step(0.01)
gui.add(pointLight.position, 'y').min(-100).max(100).step(0.01)
gui.add(pointLight.position, 'z').min(-100).max(100).step(0.01)
gui.add(pointLight, 'intensity').min(0).max(20).step(0.01)

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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 100
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true


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
        boid.edges();
        boid.flock(flock);
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

        for (let i = 0; i < 70; i++) {
            const loader = new GLTFLoader();
            const parrotData = await loader.loadAsync('assets/Parrot.glb');
            let boid = new Boid(parrotData, this.loop);
            flock.push(boid);
            scene.add(boid.model);
            // scene.add(boid);
        }
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