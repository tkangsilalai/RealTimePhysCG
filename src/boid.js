import * as THREE from "three";

export default class Boid {
  constructor(GLTF) {
    //constraint
    let vec_neg5 = new THREE.Vector3(-0.5, 0, -0.5);
    this.MAX_FORCE = 0.7;
    this.SPEED_LIMIT = 9.0;

    //create Mesh bird
    const model = GLTF.scene.children[0];
    const geometry = model.geometry;
    const material = model.material;
    this.mesh = new THREE.Mesh(geometry, material);
    //property
    this.acceleration = new THREE.Vector3();
    this.velocity = new THREE.Vector3().random().add(vec_neg5).multiplyScalar(0.5); 
    this.mesh.position.add(new THREE.Vector3().random().add(vec_neg5).multiplyScalar(3000));
    var aimP = new THREE.Vector3();
    aimP.copy(this.mesh.position).add(this.velocity);
    this.mesh.lookAt(aimP);

    // setting for 2D
    // this.mesh.position.setZ(0);
    // this.velocity.setZ(0);
  }

  //for show in 2D
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

//normal force for flocking
  align(boids) { 
    let steering = new THREE.Vector3();
    //add all near vector velocity
    for (let other of boids) {
      steering.add(other.velocity);
    }
    if (boids.length > 0) {
        //because we want vector that add with velocity and will bend to desire direction
        steering.sub(this.velocity); 
    }
    steering = this.setMax(steering, this.MAX_FORCE);
    return steering;
  }

  cohesion(boids, perceptionRadius) { 
    let steering = new THREE.Vector3();
    //add all vector from other to this that in perceptionRadius
    for (let other of boids) {
        let dist = this.mesh.position.distanceTo(other.mesh.position);
        let diff = other.mesh.position.clone();

        // if far will strong force but weak if near
        let percent = 1 + dist / perceptionRadius;
        steering.add(diff.multiplyScalar(percent));
    }
    if (boids.length > 0) {
        steering.divideScalar(boids.length);
        steering.sub(this.mesh.position);
        steering.sub(this.velocity);
    }
    steering = this.setMax(steering, this.MAX_FORCE);
    return steering;
  }

  seperation(boids, separationThresh) {
    let steering = new THREE.Vector3();
    //add all vector from this to other that in separationThresh
    for (let other of boids) {
        let dist = this.mesh.position.distanceTo(other.mesh.position);
        let selfPos = this.mesh.position.clone();
        let diff = selfPos.sub(other.mesh.position);

        // if far will weak force but strong if near
        let percent = 2 - dist / separationThresh;
        steering.add(diff.multiplyScalar(percent));
    }
    if (boids.length > 0) {
      steering.divideScalar(boids.length);
      steering.sub(this.velocity);
    }
    steering = this.setMax(steering, this.MAX_FORCE);
    return steering;
  }

//new force for close to real flocking
  dodge(obstacleArray, perceptionRadius) { // force for avoid collision
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
          let diff = selfPos.sub(center).normalize();
          diff = diff.add(this.velocity.clone().normalize());
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
  handleGround(ground, perceptionRadius) { // force for avoid hitting ground
    let steering = new THREE.Vector3();
    let selfPos = this.mesh.position.clone();
    if (selfPos.y <= ground.center_y + perceptionRadius) {
      const center = new THREE.Vector3(
        this.mesh.position.x,
        ground.center_y,
        this.mesh.position.z
      );
      let d = this.mesh.position.distanceTo(center);
      if (d < perceptionRadius) {
        let diff = selfPos.sub(center);
        diff.add(this.velocity.clone());
        let percent = 1.1 - d / perceptionRadius;
        steering.add(
          diff
            .normalize()
            .multiplyScalar(perceptionRadius)
            .multiplyScalar(percent)
        );
      }
    }
    return steering;
  }
  attractCenter() { // force to center (0, 0, 0) (in realwrold is gravity)
    let center = new THREE.Vector3();
    let selfPos = this.mesh.position.clone().normalize();
    let steering = selfPos.sub(center);
    return steering;
  }

//controller
  flock(boids, parameterController, obstacle) { // calculate overall acceleration
    this.acceleration = new THREE.Vector3();
    let zoneRadius = 40.0;
    let separationThresh = 0.45;
    let alignmentThresh = 0.65;
    let boids_sep = [];
    let boids_align = [];
    let boids_co = [];
    zoneRadius = parameterController.alignment + parameterController.cohesion + parameterController.separation;
    separationThresh = parameterController.separation;
    alignmentThresh = parameterController.separation + parameterController.alignment;

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

    this.acceleration.add(this.handleGround(obstacle[0], 100).multiplyScalar(0.045));
    this.acceleration.add(this.dodge([...obstacle.slice(1, obstacle.length)], 500).multiplyScalar(0.006));
  }
  update() { // do every frame update next position of bird
    this.mesh.position.add(this.velocity);
    this.velocity.add(this.acceleration.multiplyScalar(0.3));
    var aimP = this.mesh.position.clone().add(this.velocity.clone().normalize());
    this.mesh.lookAt(aimP);
    this.velocity = this.setMax(this.velocity, this.SPEED_LIMIT);
  }

  setMax(value, maxValue) { // for set max speed and max force
    if (value.length() > maxValue)
      return value.normalize().multiplyScalar(maxValue);
    else return value;
  }
}
