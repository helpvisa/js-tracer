// define our surface classes
// these will be added to an array of objects which the rays will be checked against

// sphere class
class Sphere {
  constructor(origin = new Vector3(0,0,0), radius = 3, material = new Material()) {
    this.origin = origin;
    this.radius = radius;
    this.material = material;
  };

  // methods
  // this function is what is called when a ray hits our sphere
  // t_min is the minimum distance allowed for a hit to register along the ray; t_max is the max allowed distance for a hit to register
  hit(ray, t_min, t_max) {
    let distance = subtractVectors(ray.origin, this.origin);
    let a = distanceSquared(ray.direction, new Vector3(0, 0, 0));
    let half_b = dotVectors(distance, ray.direction);
    let c = distanceSquared(distance, new Vector3(0, 0, 0)) - (this.radius * this.radius);
    let discriminant = (half_b * half_b) - (a * c);

    // perform a check on the discriminant to see if the ray actually hit our sphere
    if (discriminant < 0 ) {
      return false;
    }
    // if it did, continue and find the square root of the discriminant
    let sqrtDisc = Math.sqrt(discriminant);

    // find nearest root within our acceptable t (ray) range
    let rt = (-half_b - sqrtDisc) / a;
    if (rt < t_min || t_max < rt) {
      rt = (-half_b + sqrtDisc) / a;
      if (rt < t_min || t_max < rt) {
        return false;
      }
    }

    // if we have made it this far without returning, we have hit the sphere and are within our t range, and so can return a value for t
    let t = rt; // the distance along the ray our collision lies at
    let point = ray.getPos(t); // the point in world space the ray collided at
    let normal = divideVector(subtractVectors(point, this.origin), this.radius); // get the normal of the point on the sphere we hit
    normal = setFaceNormal(ray, normal); // invert this normal if it is facing inward (we hit the inside of the sphere)

    // create a record of the information from this hit and return it as an object
    let hitObj = {
      t: t,
      point: point,
      normal: normal,
      material: this.material
    }
    return hitObj;
  }
}