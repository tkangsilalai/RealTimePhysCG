import * as THREE from "three";

export default class Boid {
  constructor(GLTF) {
    const model = GLTF.scene.children[0];
    const geometry = model.geometry;
    const material = model.material;
    let vec_neg5 = new THREE.Vector3(-0.5, -0.5, -0.5);
    this.velocity = new THREE.Vector3()
      .random()
      .add(vec_neg5)
      .multiplyScalar(0.5);
    this.acceleration = new THREE.Vector3();
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.add(
      new THREE.Vector3().random().add(vec_neg5).multiplyScalar(3000)
    );
    this.MAX_FORCE = 0.7;
    this.SPEED_LIMIT = 9.0;
    var aimP = new THREE.Vector3();
    aimP.copy(this.mesh.position).add(this.velocity);
    this.mesh.lookAt(aimP);

    // setting for 2D
    // this.mesh.position.setZ(0);
    // this.velocity.setZ(0);
  }

  edges() {
    if (this.mesh.position.x > (75 * window.innerWidth) / window.innerHeight) {
      this.mesh.position.setX((-75 * window.innerWidth) / window.innerHeight);
    } else if (
      this.mesh.position.x <
      (-75 * window.innerWidth) / window.innerHeight
    ) {
      this.mesh.position.setX((75 * window.innerWidth) / window.innerHeight);
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
    let steering = new THREE.Vector3();
    for (let other of boids) {
      steering.add(other.velocity);
    }
    if (boids.length > 0) {
      // steering.divideScalar(boids.length);
      steering.sub(this.velocity);
    }
    steering = this.setMax(steering, this.MAX_FORCE);
    return steering;
  }

  cohesion(boids, perceptionRadius) {
    let steering = new THREE.Vector3();
    for (let other of boids) {
      let dist = this.mesh.position.distanceTo(other.mesh.position);
      let percent = 0.5 + dist / perceptionRadius;
      let diff = other.mesh.position.clone();
      // console.log(percent)
      steering.add(diff.multiplyScalar(percent));
      // steering.add(other.mesh.position);
    }
    if (boids.length > 0) {
      steering.divideScalar(boids.length);
      steering.sub(this.mesh.position);
      steering.sub(this.velocity);
    }
    steering = this.setMax(steering, this.MAX_FORCE);
    return steering;
  }

  seperation(boids, perceptionRadius) {
    let steering = new THREE.Vector3();
    for (let other of boids) {
      let dist = this.mesh.position.distanceTo(other.mesh.position);
      let selfPos = this.mesh.position.clone();
      let diff = selfPos.sub(other.mesh.position);

      let percent = 2 - dist / perceptionRadius;
      steering.add(diff.multiplyScalar(percent));
    }
    if (boids.length > 0) {
      steering.divideScalar(boids.length);
      steering.sub(this.velocity);
    }
    steering = this.setMax(steering, this.MAX_FORCE);
    return steering;
  }

  attractCenter() {
    let center = new THREE.Vector3();
    let selfPos = this.mesh.position.clone().normalize();
    let steering = selfPos.sub(center);
    return steering;
  }

  calculateForce(boids, parameterController) {
    this.acceleration = new THREE.Vector3();
    let zoneRadius = 40.0;
    let zoneRadiusSquared = 1600.0;
    let separationThresh = 0.45;
    let alignmentThresh = 0.65;
    let boids_sep = [];
    let boids_align = [];
    let boids_co = [];
    zoneRadius =
      parameterController.alignment +
      parameterController.cohesion +
      parameterController.separation;
    separationThresh = parameterController.separation;
    alignmentThresh =
      parameterController.separation + parameterController.alignment;
    zoneRadiusSquared = zoneRadius * zoneRadius;

    if (parameterController.attractCenter) {
      this.acceleration.sub(this.attractCenter().multiplyScalar(0.4));
    }

    for (let other of boids) {
      let otherPos = other.mesh.position.clone();
      let vecSelftoOther = otherPos.sub(this.mesh.position);
      let dreg = this.velocity.angleTo(vecSelftoOther);
      let dist = this.mesh.position.distanceTo(other.mesh.position);
      if (other == this) continue;
      if (Math.abs(dreg) > 2) continue;
      if (dist >= zoneRadius) continue;
      if (dist < separationThresh) boids_sep.push(other);
      else if (dist < alignmentThresh) boids_align.push(other);
      else boids_co.push(other);
    }

    this.acceleration.add(this.seperation(boids_sep, separationThresh));
    this.acceleration.add(this.align(boids_align));
    this.acceleration.add(this.cohesion(boids_co, zoneRadius));
  }

  flock(boids, parameterController, obstacle) {
    this.calculateForce(boids, parameterController);
    let dodge = this.dodge(obstacle);
    // console.log(dodge);
    this.acceleration.add(dodge.multiplyScalar(3));
  }

  setMax(value, maxValue) {
    if (value.length() > maxValue)
      return value.normalize().multiplyScalar(maxValue);
    else return value;
  }

  update() {
    this.mesh.position.add(this.velocity);
    this.velocity.add(this.acceleration.multiplyScalar(0.3));
    var aimP = this.mesh.position
      .clone()
      .add(this.velocity.clone().normalize());
    this.mesh.lookAt(aimP);
    this.velocity = this.setMax(this.velocity, this.SPEED_LIMIT);
  }

  dodge(obstacleArray) {
    let perceptionRadius = 200;
    let steering = new THREE.Vector3();
    obstacleArray.forEach((obstacle) => {
      const dist_x = Math.abs(this.mesh.position.x - obstacle.center_x);
      const dist_y = Math.abs(this.mesh.position.y - obstacle.center_y);
      const dist_z = Math.abs(this.mesh.position.z - obstacle.center_z);
      const is_x = dist_x <= obstacle.radius_x + perceptionRadius;
      const is_y = dist_y <= obstacle.radius_y + perceptionRadius;
      const is_z = dist_z <= obstacle.radius_z + perceptionRadius;
      if (is_x && is_y && is_z) {
        const center = new THREE.Vector3(
          obstacle.center_x,
          this.mesh.position.y,
          obstacle.center_z
        );
        let d = this.mesh.position.distanceTo(center);
        if (d < perceptionRadius) {
          let selfPos = this.mesh.position.clone();
          let diff = selfPos.sub(center);
          let percent = 1 - d / perceptionRadius;
          steering.add(
            diff
              .normalize()
              .multiplyScalar(perceptionRadius)
              .multiplyScalar(percent)
          );
        }
      }
    });
    return steering;
  }
}
