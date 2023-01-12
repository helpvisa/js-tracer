// define a class for our custom ray
// depends on vector3 class and helpers
class Ray {
  constructor(origin = new Vector3(0,0,0), direction = new Vector3(0,0,1)) {
    this.origin = origin;
    this.direction = normalizeVector(direction);
    this.getFractionalDirection();
  };

  // methods
  // return a position along the ray
  getPos(t) {
    return addVectors(this.origin, multiplyVector(this.direction, t));
  }

  getFractionalDirection() {
    // calculate fractional ray direction
    let dirFrac = new Vector3(0,0,0);
    if (this.direction.x === 0) {
      dirFrac.x = 0;
    } else {
      dirFrac.x = 1 / this.direction.x;
    }
    if (this.direction.y === 0) {
      dirFrac.y = 0;
    } else {
      dirFrac.y = 1 / this.direction.y;
    }
    if (this.direction.z === 0) {
      dirFrac.z = 0;
    } else {
      dirFrac.z = 1 / this.direction.z;
    }

    this.dirFrac = dirFrac;
  }
}