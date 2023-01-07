// define a class for the Camera used to render the image
// depends on Vector3 class and math helpers, so must be loaded by the html after these
class Camera {
  // ratio is the aspect ratio (ex. 16/9, 4/3), default is square ratio
  constructor(origin = new Vector3(0,0,0), direction = new Vector3(0,0,1), fov = 60, ratio = 1) {
    this.origin = origin;
    this.direction = direction;
    this.fov = fov;
    this.ratio = ratio;

    // perform calculations based on inputs
    // generate screen UVs
    let theta = toRadians(fov);
    let h = Math.tan(theta / 2);
    this.viewportHeight = 2 * h;
    this.viewportWidth = this.viewportHeight * ratio;

    let w = normalizeVector(subtractVectors(this.origin, this.direction));
    let u = normalizeVector(crossVectors(new Vector3(0,1,0), w));
    let v = crossVectors(w, u);

    this.horizontal = multiplyVector(u, this.viewportWidth);
    this.vertical = multiplyVector(v, this.viewportHeight);
    this.lowerLeftCorner = subtractVectors(this.origin, subtractVectors(subtractVectors(divideVector(this.horizontal, 2), divideVector(this.vertical, 2)), w));
  };

  // methods
  castRay(u, v) {
    const uu = multiplyVector(this.horizontal, u);
    const vv = multiplyVector(this.vertical, v);
    const add = addVectors(uu, vv);
    const addadd = addVectors(this.lowerLeftCorner, add);
    const addaddsub = subtractVectors(addadd, this.origin);

    return new Ray(this.origin, addaddsub);
  }
}