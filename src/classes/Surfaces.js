// define our surface classes
// these will be added to an array of objects which the rays will be checked against

// base class
class Surface {
  constructor(origin = new Vector3(0, 0, 0)) {
    this.origin = origin;
  }

  // methods
  // this is a dummy function, it will be extended by anything that also extends this class to write custom functions
  // but it is important to define it in order to avoid a null check
  hit(ray, t_min, t_max) {
    return false; // this will prevent the hit from ever registering if a blank surface somehow ends up in our world list
  }

  // calculate the AABB bounds of the current surface
  bounding() {
    return false; // will always return false (no bounds) for a blank surface
  }
}

// BVH class, that wraps our world list in an AABB bounding box container hierarchically
class BVH extends Surface {
  constructor(surfaces = []) {
    super(new Vector3(0,0,0));
    this.surfaces = surfaces; // store an array of our world list
  }


}

// sphere class
class Sphere extends Surface {
  constructor(origin = new Vector3(0,0,0), radius = 3, material = new Material()) {
    super(origin);
    this.radius = radius;
    this.material = material;
    this.bounding();
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

  // calculate this object's AABB bounding box
  bounding() {
    this.bounds = new AABB(this.origin + new Vector3(this.radius, this.radius, this.radius), this.origin - new Vector3(this.radius, this.radius, this.radius));
  }
}