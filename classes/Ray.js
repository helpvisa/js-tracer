// define a class for our custom ray
// depends on vector3 class and helpers
class Ray {
  constructor(origin = new Vector3(0,0,0), direction = new Vector3(0,0,1)) {
    this.origin = origin;
    this.direction = normalizeVector(direction);
    
    // store the fractional direction for future collision checks with surface objects
    let frac = new Vector3(1,1,1);
    frac.x = 1 / direction.x;
    frac.y = 1 / direction.y;
    frac.z = 1 / direction.z;
    this.fracDir = frac;
  };

  // methods
  // return a position along the ray
  getPos(t) {
    return addVectors(origin, multiplyVector(direction, t));
  }
}