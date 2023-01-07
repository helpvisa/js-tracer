// define a class for our custom ray
// depends on vector3 class and helpers
class Ray {
  constructor(origin = new Vector3(0,0,0), direction = new Vector3(0,0,1)) {
    this.origin = origin;
    this.direction = normalizeVector(direction);
  };

  // methods
  // return a position along the ray
  getPos(t) {
    return addVectors(this.origin, multiplyVector(this.direction, t));
  }
}