// define a class for the Camera used to render the image
// depends on Vector3 class and math helpers, so must be loaded by the html after these
class Camera {
  // ratio is the aspect ratio (ex. 16/9, 4/3), default is square ratio
  constructor(origin = new Vector3(0, 0, 0), direction = new Vector3(0, 0, 1), fov = 60, ratio = 1) {
    this.origin = origin;
    this.direction = direction;
    this.fov = fov;
    this.ratio = ratio;

    // perform calculations based on inputs
    // generate viewplane UVs
    let theta = toRadians(fov);
    let h = Math.tan(theta / 2);
    this.viewportHeight = 2 * h;
    this.viewportWidth = this.viewportHeight * ratio;

    let w = normalizeVector(subtractVectors(this.origin, this.direction));
    let u = normalizeVector(crossVectors(new Vector3(0, 1, 0), w));
    let v = crossVectors(w, u);

    // the vector defining the horizontal axis of the viewplane
    this.horizontal = multiplyVector(u, this.viewportWidth);
    // the vector defining the vertical axis of the viewplane
    this.vertical = multiplyVector(v, this.viewportHeight);
    // find the upper left corner of our viewplane, split process into steps
    const halfHorizontal = divideVector(this.horizontal, 2);
    const halfVertical = divideVector(this.vertical, 2);
    const addVert = addVectors(this.origin, halfVertical);
    const addHor = addVectors(addVert, halfHorizontal);
    const subDir = subtractVectors(addHor, w);
    this.upperLeftCorner = subtractVectors(this.origin, subDir);
  };

  // methods
  castRay(u, v) {
    // split our direction vector into parts so the computations are easier to manage, this will give us a ray direction
    const step1 = multiplyVector(this.horizontal, u);
    const step2 = multiplyVector(this.vertical, v);
    const step3 = addVectors(step1, step2);
    const step4 = addVectors(this.upperLeftCorner, step3);
    let rayDir = subtractVectors(step4, this.origin);

    // experimentations with randomizing ray direction from camera
    // rayDir = addVectors(divideVector(randomVector(), 500), rayDir);
    // rayDir = normalizeVector(rayDir);

    return new Ray(this.origin, rayDir);
  }
}