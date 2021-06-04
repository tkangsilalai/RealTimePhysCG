import * as THREE from 'three'

export default class Boid {
    constructor(mesh) {
        let vec_neg5 = new THREE.Vector3(-0.5, -0.5, -0.5);
        this.velocity = new THREE.Vector3().random().add(vec_neg5).multiplyScalar(0.5);
        this.acceleration = new THREE.Vector3();
        this.mesh = mesh;
        this.mesh.position.add(new THREE.Vector3().random().add(vec_neg5).multiplyScalar(70));
        this.maxForce = 0.001;
    }

    edges() {
        if (this.mesh.position.x > innerWidth) {
            this.mesh.position.setX(0);
        } else if (this.mesh.position.x < -innerWidth) {
            this.mesh.position.setX(innerWidth);
        } 
        if (this.mesh.position.y > innerHeight) {
            this.mesh.position.setY(0);
        } else if (this.mesh.position.y < -innerHeight) {
            this.mesh.position.setY(innerHeight);
        } 
        if (this.mesh.position.z > 100) {
            this.mesh.position.setZ(0);
        } else if (this.mesh.position.z < -100) {
            this.mesh.position.setZ(100);
        } 
    }

    align(boids) {
        let perceptionRadius = 10;
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
            let d = this.mesh.position.distanceTo(other.mesh.position);
            if (other != this && d < perceptionRadius) {
                steering.add(other.mesh.position);
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
            let d = this.mesh.position.distanceTo(other.mesh.position);
            if (other != this && d < perceptionRadius) {
                let diff = this.mesh.position.sub(other.mesh.position);
                diff.divide(d) ;
                steering.add(diff);
                total++;
            }            
        }
        if (total > 0) {
            steering.divideScalar(total);
            steering.sub(this.velocity);
            steering.clampScalar(0, this.maxForce*0.5);
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
        this.mesh.position.add(this.velocity);
        this.velocity.add(this.acceleration);
    }
}