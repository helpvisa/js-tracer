// define a class for the Camera used to render the image
// depends on Vector3 class and math helpers, so must be loaded by the html after these
class Camera {
  // ratio is the aspect ratio (ex. 16/9, 4/3), default is square ratio
  constructor(origin = Vector3(0,0,0), direction = Vector3(0,0,1), fov = 60, ratio = 1) {
    this.origin = origin;
    this.direction = direction;
    this.fov = fov;
    this.ratio = ratio;

    // perform calculations based on inputs
    // generate screen UVs
    theta = toRadians(fov);
    h = Math.tan(theta / 2);
    this.viewportHeight = 2 * h;
    this.viewportWidth = viewportHeight * ratio;

    let w = normalizeVector(this.origin - this.direction);
    let u = normalizeVector(crossVectors(new Vector3(0,1,0), w));
    let v = crossVectors(w, u);

    this.horizontal = this.viewportWidth * u;
    this.vertical = this.viewportHeight * v;
    this.lowerLeftCorner = this.origin - this.horizontal / 2 - this.vertical / 2 - w;
  }

  // methods
  returnRay(u, v) {
    // code to manage custom rays here
  }
}