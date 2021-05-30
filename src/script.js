import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import Boid from './boid'

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
var geometry = new THREE.PlaneGeometry( 1, 1, 1 );
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
for (let i = 0; i < 70; i++) {
    // let geometry = new THREE.IcosahedronGeometry( Math.random()*1.5 );
    let boid = new Boid( geometry, material);
    flock.push( boid );
    scene.add( boid.mesh );	
}

// Land
var loader = new THREE.TextureLoader();
var texture = loader.load("img/texture/ground.jpg");
geometry = new THREE.PlaneGeometry( 100, 100 );
material = new THREE.MeshBasicMaterial({
    map: texture
})
var plane= new THREE.Mesh( geometry, material );
plane.rotateX(-20);
plane.position.set(0, 0,-20);
scene.add( plane );	

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

// Lights

const pointLight = new THREE.PointLight(0xffffff, 0.1)
pointLight.position.x = 2
pointLight.position.y = 3
pointLight.position.z = 4
scene.add(pointLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 100
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

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

const tick = () =>
{

    const elapsedTime = clock.getElapsedTime()

    // Update objects
    for(let boid of flock) {
        boid.edges();
        boid.flock(flock);
        boid.update();
        
    }

    // Update Orbital Controls
    // controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()