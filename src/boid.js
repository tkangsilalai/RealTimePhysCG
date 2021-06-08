import * as THREE from 'three'

const _BOID_FORCE_ALIGNMENT = 10;
const _BOID_FORCE_SEPARATION = 20;
const _BOID_FORCE_COHESION = 10;

export default class Boid {
    constructor(GLTF) {
        const speedMultiplier = Math.floor(Math.random() * (25 - 3 + 1)) + 3;
        const scale = 1.0 / speedMultiplier;
        this.radius = scale;
        this.perceptionRadius = 50;
        const model = GLTF.scene.children[0];
        const geometry = model.geometry;
        const material = model.material;
        this.velocity = new THREE.Vector3(Math.random() - Math.round(Math.random()), Math.random() - Math.round(Math.random()), Math.random() - Math.round(Math.random()));
        this.acceleration = new THREE.Vector3();
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.add(new THREE.Vector3(Math.random() - Math.round(Math.random()), Math.random() - Math.round(Math.random()), Math.random() - Math.round(Math.random())).multiplyScalar(700));
        // this.mesh.position.add(new THREE.Vector3().random().multiplyScalar(500));
        this.maxForce = 0.001;
        var aimP = new THREE.Vector3();
        aimP.copy(this.mesh.position).add(this.velocity);
        this.mesh.lookAt(aimP);
        this.SPEED_LIMIT = 25
        this.range = 2000
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
        let perceptionRadius = this.perceptionRadius;
        let steering = new THREE.Vector3(0, 0, 0);
        for (let other of boids) {
            let d = this.mesh.position.distanceTo(other.mesh.position);
            const ratio = this.radius / other.radius;
            if (other != this && this.radius < 5 && (ratio <= 1.35 && ratio >= 0.75)) {
                steering.add(other.velocity);
            }
        }
        // steering.divideScalar(total);
        // steering.sub(this.velocity);
        steering.normalize();
        steering.multiplyScalar(_BOID_FORCE_ALIGNMENT);
        return steering;
    }

    cohesion(boids) {
        let perceptionRadius = this.perceptionRadius;
        let steering = new THREE.Vector3(0, 0, 0);
        if (boids.length == 0) {
            return steering;
        }
        for (let other of boids) {
            let d = this.mesh.position.distanceTo(other.mesh.position);
            const ratio = this.radius / other.radius;
            if (other != this && this.radius < 5 && (ratio <= 1.35 && ratio >= 0.75)) {
                steering.add(other.mesh.position);
            }
        }
        // steering.divideScalar(total);
        // steering.sub(this.mesh.position);
        // steering.sub(this.velocity);
        steering.multiplyScalar(1.0 / boids.length)
        const directionToAveragePosition = steering.clone().sub(this.mesh.position);
        directionToAveragePosition.normalize();
        directionToAveragePosition.multiplyScalar(_BOID_FORCE_COHESION);
        return directionToAveragePosition;
    }

    seperation(boids, pass) {
        let perceptionRadius = this.perceptionRadius;
        const forceVector = new THREE.Vector3(0, 0, 0);
        if (boids.length == 0) {
            return forceVector
        }
        for (let other of boids) {
            let d = this.mesh.position.distanceTo(other.mesh.position);
            const ratio = this.radius / other.radius;
            if (this.radius > 5)
                if (pass || (other != this && this.radius < 5 && (ratio <= 1.35 && ratio >= 0.75))) {
                    // let selfPos = this.mesh.position.clone();
                    // let diff = selfPos.sub(other.mesh.position);
                    // // if (d < 1) {
                    // //     diff.multiplyScalar(d) ;
                    // // } else {
                    // //     diff.divideScalar(d) ;
                    // // }
                    // // diff.divideScalar(d) ;
                    // let percent = 1 - (d / perceptionRadius);
                    // steering.add(diff.normalize().multiplyScalar(perceptionRadius).multiplyScalar(percent));
                    // total++;
                    const distanceToEntity = Math.max(d - 1.5 * (this.radius + other.radius), 0.001);
                    const directionFromEntity = new THREE.Vector3().subVectors(this.mesh.position, other.mesh.position);
                    const multiplier = (_BOID_FORCE_SEPARATION / distanceToEntity) * (this.radius + other.radius);
                    directionFromEntity.normalize();
                    forceVector.add(directionFromEntity.multiplyScalar(multiplier));
                }
        }
        return forceVector;
    }

    attractCenter() {
        let center = new THREE.Vector3(0);
        let selfPos = this.mesh.position.clone();
        let steering = selfPos.sub(center);
        steering.sub(this.velocity);
        return steering;
    }

    flock(boids, parameterController, obstacle) {
        this.acceleration = new THREE.Vector3();
        let seperation = this.seperation(boids, true);
        this.acceleration.add(seperation.multiplyScalar(parameterController.separation));
        // seperation = this.seperation(boids, false)
        let alignment = this.align(boids)
        let cohesion = this.cohesion(boids);
        let attractCenter = this.attractCenter();
        let dodge = this.dodge(obstacle);
        this.acceleration.add(alignment.multiplyScalar(parameterController.alignment));
        this.acceleration.add(cohesion.multiplyScalar(parameterController.cohesion));
        this.acceleration.add(seperation.multiplyScalar(parameterController.separation));
        this.acceleration.add(dodge.multiplyScalar(5));
        if (parameterController.attractCenter) {
            this.acceleration.sub(attractCenter.multiplyScalar(0.1));
        }

    }

    update() {
        this.mesh.position.add(this.velocity);
        let lastVelo = this.velocity.clone();
        if (this.mesh.position.x > this.range || this.mesh.position.y > this.range || this.mesh.position.z > this.range || this.mesh.position.x < -this.range || this.mesh.position.y < -this.range || this.mesh.position.z < -this.range) {
            this.velocity.multiplyScalar(-1);
            this.acceleration.add(new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10))
        }
        this.velocity.add(this.acceleration.multiplyScalar(0.01));
        var aimP = new THREE.Vector3();
        aimP.copy(this.mesh.position).add(this.velocity);
        this.mesh.lookAt(aimP);
        // if (this.mesh.position.x > this.range || this.mesh.position.y > this.range || this.mesh.position.z > this.range || this.mesh.position.x < -this.range || this.mesh.position.y < -this.range || this.mesh.position.z < -this.range) {
        //     this.velocity.multiplyScalar(-1);
        //     let x = this.mesh.position.x > this.range ? this.range - Math.random()*10+1 : this.mesh.position.x
        //     x = x > this.range ? this.range + Math.random()*10+1 : x
        //     let y = this.mesh.position.y > this.range ? this.range - Math.random()*10+1 : this.mesh.position.y
        //     y = y > this.range ? this.range + Math.random()*10+1 : y
        //     let z = this.mesh.position.z > this.range ? this.range - Math.random()*10+1 : this.mesh.position.z
        //     z = z > this.range ? this.range + Math.random()*10+1 : z
        //     this.mesh.position.set(x, y, z)
        //     this.mesh.position.add(this.acceleration.add(new THREE.Vector3(0, Math.random(), 0)));
        // }
        if (this.velocity.length() > this.SPEED_LIMIT) {
            this.velocity.normalize().multiplyScalar(this.SPEED_LIMIT);
        }

        // this.mesh.rotation.set(this.velocity.x, this.velocity.y, this.velocity.z)
    }

    dodge(obstacle) {
        let perceptionRadius = this.perceptionRadius;
        let steering = new THREE.Vector3();
        const dist_x = Math.abs(this.mesh.position.x - obstacle.center_x);
        const dist_y = Math.abs(this.mesh.position.y - obstacle.center_y);
        const dist_z = Math.abs(this.mesh.position.z - obstacle.center_z);
        const is_x = dist_x <= (obstacle.radius_x + perceptionRadius);
        const is_y = dist_y <= (obstacle.radius_y + perceptionRadius);
        const is_z = dist_z <= (obstacle.radius_z + perceptionRadius);
        if (is_x && is_y && is_z) {
            const center = new THREE.Vector3(obstacle.center_x, this.mesh.position.y, obstacle.center_z);
            let d = this.mesh.position.distanceTo(center);
            if (d < perceptionRadius) {
                let selfPos = this.mesh.position.clone();
                let diff = selfPos.sub(center);
                let percent = 1 - (d / perceptionRadius);
                steering.add(diff.normalize().multiplyScalar(perceptionRadius).multiplyScalar(percent));
            }
        }
        return steering;
    }
}