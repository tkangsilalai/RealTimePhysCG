import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three';

function setupModel(data) {
    const model = data.scene.children[0];
    const clip = data.animations[0];
    const mixer = new AnimationMixer(model);
    const action = mixer.clipAction(clip);
    action.play();
    model.tick = (delta) => {
        mixer.update(delta);
    };

    return model;
}

async function loadBirds() {
    const loader = new GLTFLoader();
    const parrotData = await loader.loadAsync('assets/Parrot.glb');
    const parrot = setupModel(parrotData);
    return { parrot }
}

export { loadBirds };