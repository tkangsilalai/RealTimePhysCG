import * as THREE from 'three'
import { AnimationMixer } from 'three';

export default class Boid {
    constructor(data, loop) {
        this.model = data.scene.children[0];
        this.clip = data.animations[0];
        this.mixer = new AnimationMixer(this.model);
        this.action = this.mixer.clipAction(this.clip);
        this.action.play();
        this.model.tick = (delta) => {
            this.mixer.update(delta);
        };
        loop.updatables.push(this.model);
        const geometry = this.model.geometry;
        const material = this.model.material;
        let vec_neg5 = new THREE.Vector3(-0.5, -0.5, -0.5);
        this.velocity = new THREE.Vector3().random().add(vec_neg5).multiplyScalar(0.5);
        this.acceleration = new THREE.Vector3();
        // this.mesh = new THREE.Mesh(geometry, material);
        this.model.position.add(new THREE.Vector3().random().add(vec_neg5).multiplyScalar(70));
        this.maxForce = 0.001;
    }

    edges() {
        if (this.model.position.x > innerWidth) {
            this.model.position.setX(0);
        } else if (this.model.position.x < -innerWidth) {
            this.model.position.setX(innerWidth);
        }
        if (this.model.position.y > innerHeight) {
            this.model.position.setY(0);
        } else if (this.model.position.y < -innerHeight) {
            this.model.position.setY(innerHeight);
        }
        if (this.model.position.z > 100) {
            this.model.position.setZ(0);
        } else if (this.model.position.z < -100) {
            this.model.position.setZ(100);
        }
    }

    align(boids) {
        let perceptionRadius = 10;
        let steering = new THREE.Vector3();
        let total = 0;
        for (let other of boids) {
            let d = this.model.position.distanceTo(other.model.position);
            if (other != this && d < perceptionRadius) {
                steering.add(other.velocity);
                total++;
            }
        }
        if (total > 0) {
            steering.divideScalar(total);
            steering.sub(this.velocity);
            steering.clampScalar(0, this.maxForce);
        }
        return steering;
    }

    cohesion(boids) {
        let perceptionRadius = 20;
        let steering = new THREE.Vector3();
        let total = 0;
        for (let other of boids) {
            let d = this.model.position.distanceTo(other.model.position);
            if (other != this && d < perceptionRadius) {
                steering.add(other.model.position);
                total++;
            }
        }
        if (total > 0) {
            steering.divideScalar(total);
            steering.sub(this.velocity);
            steering.clampScalar(0, this.maxForce);
        }
        return steering;
    }

    seperation(boids) {
        let perceptionRadius = 10;
        let steering = new THREE.Vector3();
        let total = 0;
        for (let other of boids) {
            let d = this.model.position.distanceTo(other.model.position);
            if (other != this && d < perceptionRadius) {
                let diff = this.model.position.sub(other.model.position);
                diff.divide(d);
                steering.add(diff);
                total++;
            }
        }
        if (total > 0) {
            steering.divideScalar(total);
            steering.sub(this.velocity);
            steering.clampScalar(0, this.maxForce * 0.5);
        }
        return steering;
    }

    flock(boids) {
        this.acceleration = new THREE.Vector3();
        let alignment = this.align(boids);
        let cohesion = this.cohesion(boids);
        let seperation = this.seperation(boids);
        this.acceleration.add(alignment);
        this.acceleration.add(cohesion.multiplyScalar(0.5));
        this.acceleration.add(seperation);
    }

    update() {
        this.model.position.add(this.velocity);
        this.velocity.add(this.acceleration);
    }
}