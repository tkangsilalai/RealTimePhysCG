import * as THREE from 'three'

export default class Boid {
    constructor(GLTF) {
        const model = GLTF.scene.children[0];
        const geometry = model.geometry;
        const material = model.material;
        let vec_neg5 = new THREE.Vector3(-0.5, -0.5, -0.5);
        this.velocity = new THREE.Vector3().random().add(vec_neg5).multiplyScalar(0.5);
        this.acceleration = new THREE.Vector3();
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.add(new THREE.Vector3().random().add(vec_neg5).multiplyScalar(500));
        this.maxForce = 0.001;

        // setting for 2D
        // this.mesh.position.setZ(0);
        // this.velocity.setZ(0);
    }

    edges() {
        if (this.mesh.position.x > 75 * window.innerWidth / window.innerHeight) {
            this.mesh.position.setX(-75 * window.innerWidth / window.innerHeight);
        } else if (this.mesh.position.x < -75 * window.innerWidth / window.innerHeight) {
            this.mesh.position.setX(75 * window.innerWidth / window.innerHeight);
        }
        if (this.mesh.position.y > 75) {
            this.mesh.position.setY(-75);
        } else if (this.mesh.position.y < -75) {
            this.mesh.position.setY(75);
        }
        if (this.mesh.position.z > 100) {
            this.mesh.position.setZ(0);
        } else if (this.mesh.position.z < -100) {
            this.mesh.position.setZ(100);
        }
    }

    align(boids) {
        let perceptionRadius = 20;
        let steering = new THREE.Vector3();
        let total = 0;
        for (let other of boids) {
            let d = this.mesh.position.distanceTo(other.mesh.position);
            if (other != this && d < perceptionRadius) {
                steering.add(other.velocity);
                total++;
            }
        }
        if (total > 0) {
            // steering.divideScalar(total);
            steering.sub(this.velocity);
        }
        return steering;
    }

    cohesion(boids) {
        let perceptionRadius = 20;
        let steering = new THREE.Vector3();
        let total = 0;
        for (let other of boids) {
            let d = this.mesh.position.distanceTo(other.mesh.position);
            if (other != this && d < perceptionRadius) {
                steering.add(other.mesh.position);
                total++;
            }
        }
        if (total > 0) {
            steering.divideScalar(total);
            steering.sub(this.mesh.position);
            steering.sub(this.velocity);
        }
        return steering;
    }

    seperation(boids) {
        let perceptionRadius = 20;
        let steering = new THREE.Vector3();
        let total = 0;
        for (let other of boids) {
            let d = this.mesh.position.distanceTo(other.mesh.position);
            if (other != this && d < perceptionRadius) {
                let selfPos = this.mesh.position.clone();
                let diff = selfPos.sub(other.mesh.position);
                // if (d < 1) {
                //     diff.multiplyScalar(d) ;
                // } else {
                //     diff.divideScalar(d) ;
                // }
                // diff.divideScalar(d) ;
                let percent = 1 - (d / perceptionRadius);
                steering.add(diff.normalize().multiplyScalar(perceptionRadius).multiplyScalar(percent));
                total++;
            }
        }
        if (total > 0) {
            steering.divideScalar(total);
            steering.sub(this.velocity);
        }
        return steering;
    }

    attractCenter() {
        let center = new THREE.Vector3(0);
        let selfPos = this.mesh.position.clone();
        let steering = selfPos.sub(center);
        steering.sub(this.velocity);
        return steering;
    }

    flock(boids, parameterController) {
        this.acceleration = new THREE.Vector3();
        let alignment = this.align(boids);
        let cohesion = this.cohesion(boids);
        let seperation = this.seperation(boids);
        let attractCenter = this.attractCenter();
        this.acceleration.add(alignment.multiplyScalar(parameterController.alignment));
        this.acceleration.add(cohesion.multiplyScalar(parameterController.cohesion));
        this.acceleration.add(seperation.multiplyScalar(parameterController.separation));
        if (parameterController.attractCenter) {
            this.acceleration.sub(attractCenter.multiplyScalar(0.1));
        }

    }

    update() {
        this.mesh.position.add(this.velocity);
        this.velocity.add(this.acceleration.multiplyScalar(0.001));
        if (this.velocity.length() > this.SPEED_LIMIT) {
            this.velocity.normalize().multiplyScalar(this.SPEED_LIMIT);
        }
    }
}