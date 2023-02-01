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

  // calculate the area that this object occupies for use in a pdf
  area() {
    return false; // dummy class
  }
}

// BVH class that wraps our world list in an AABB bounding box container hierarchically
class BVH extends Surface {
  constructor(surfaces = []) {
    super(new Vector3(0,0,0));
    this.surfaces = surfaces; // store an array of our world list
    // calc our bounding box for this node
    this.bounds = this.bounding();
    // create our hierarchical structure
    this.createStructure();
  }

  hit(ray, t_min, t_max) {
    if (!this.bounds.hit(ray)) {
      return false;
    }

    // check sub-nodes
    let finalObj;
    const hitLeft = this.left.hit(ray, t_min, t_max);
    if (hitLeft) {
      t_max = hitLeft.t;
      finalObj = hitLeft;
    }
    if (!this.leaf) {
      const hitRight = this.right.hit(ray, t_min, t_max);
      if (hitRight) {
        t_max = hitRight.t;
        finalObj = hitRight;
      }
    }
  
    // return our finally found obj
    return finalObj;
  }

  // determine the bounding box of the surfaces contained within its list
  bounding() {
    // set bounds to false if there are no surfaces to create a bounding box for
    if (this.surfaces.length < 1) {
      return false;
    }
    
    // is this the first attempt at creating a bounding box?
    // used in case there is only one object in world list; sets BVH bounds to the bounds of that one objkect
    let firstBox = true;
    let tempBounds = new AABB(new Vector3(0,0,0), new Vector3(0,0,0));
    let bounds = tempBounds;
    for (let i = 0; i < this.surfaces.length; i++) {
      if (!this.surfaces[i].bounds) {
        return false;
      }
      
      if (firstBox) {
        bounds = this.surfaces[i].bounds;
      } else {
        tempBounds = bounds;
        bounds = surroundingBox(this.surfaces[i].bounds, tempBounds);
      }

      firstBox = false;
    }

    // return our actual bounds
    return bounds;
  }

  // create a sub-hierarchy of BVH nodes to split the world into parts and minimize complex calculations
  createStructure() {
    // determine how many surfaces there are within our node
    if (this.surfaces.length === 1) {
      this.left = this.surfaces[0];
      // mark that this node is an ending point
      this.leaf = true;
    } else if (this.surfaces.length === 2) {
      this.left = this.surfaces[0];
      this.right = this.surfaces[1];
    } else {
      const leftSurfaces = [];
      const rightSurfaces = [];

      // sort our surfaces based on a random axis
      let axis = Math.floor(Math.random() * 2);
      this.surfaces.sort(function(a, b) {
        switch (axis) {
          case 0:
            if (a.origin.x < b.origin.x) {
              return -1;
            }
            if (a.origin.x > b.origin.x) {
              return  1;
            }
            return 0;
            break;
          case 1:
            if (a.origin.y < b.origin.y) {
              return -1;
            }
            if (a.origin.y > b.origin.y) {
              return  1;
            }
            return 0;
            break;
          case 2:
            if (a.origin.z < b.origin.z) {
              return -1;
            }
            if (a.origin.z > b.origin.z) {
              return  1;
            }
            return 0;
            break;
        }
      });

      // find the middle point of our array
      const mid = Math.floor(this.surfaces.length / 2);

      // populate our left and right arrays
      for (let l = 0; l < mid; l++) {
        leftSurfaces.push(this.surfaces[l]);
      }
      for (let r = mid; r < this.surfaces.length; r++) {
        rightSurfaces.push(this.surfaces[r]);
      }

      // create our BVH nodes and add them to this object
      this.left = new BVH(leftSurfaces);
      this.right = new BVH(rightSurfaces);

      // recalculate bounds based off left / right BVH nodes
      this.bounds = surroundingBox(this.left.bounds, this.right.bounds);
    }
  }
}

// sphere class
class Sphere extends Surface {
  constructor(origin = new Vector3(0,0,0), radius = 3, material = new Material()) {
    super(origin);
    this.radius = radius;
    this.material = material;
    this.bounds = this.bounding();
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
    let frontFace = setFaceNormal(ray, normal); // invert this normal if it is facing inward (we hit the inside of the sphere)

    // calculate our texture coordinates in terms of u, v if we have a texture
    let u = 0;
    let v = 0;
    if (this.material.perlin || this.material.diffuseTex || this.material.roughnessTex || this.material.normalTex) {
      const pi = Math.PI;
      const theta = Math.acos(-normal.y);
      const phi = Math.atan2(-normal.z, normal.x) + pi;
      u = phi / (2 * pi);
      v = theta / pi;
    }

    // create a record of the information from this hit and return it as an object
    const hitObj = {
      t: t,
      point: point,
      normal: frontFace.normal,
      frontFace: frontFace.front,
      material: this.material,
      u: u,
      v: v,
      obj: this
    }
    return hitObj;
  }

  // calculate this object's AABB bounding box
  bounding() {
    return new AABB(addVectors(this.origin, new Vector3(this.radius, this.radius, this.radius)), subtractVectors(this.origin, new Vector3(this.radius, this.radius, this.radius)));
  }

  // calculate area
  area() {
    return addVectors(this.origin, multiplyVector(normalizedRandomVector(), this.radius));
  }
}

// axis-aligned rectangle surfaces
// aligned along x and y
class RectangleXY extends Surface {
  constructor(x0, x1, y0, y1, z, material) {
    let center = new Vector3(0, 0, z);
    center.x = x0 + (x1 - x0) / 2;
    center.y = y0 + (y1 - y0) / 2;

    // call our super where the origin is our new-found center
    super(center);
    // assign our class-specific variables
    this.x0 = x0;
    this.x1 = x1;
    this.y0 = y0;
    this.y1 = y1;
    this.z = z;
    this.material = material;

    // calculate our bounding box
    this.bounds = this.bounding();

    // pre-calculate our rectangular area
    this.areaX = x1 - x0;
    this.areaY = y1 - y0;

    // "light" radius
    this.radius = (this.areaX * this.areaY);
  }

  hit(ray, t_min, t_max) {
    const t = (this.z - ray.origin.z) / ray.direction.z;
    if (t < t_min || t > t_max) {
      return false;
    }

    const x = ray.origin.x + t * ray.direction.x;
    const y = ray.origin.y + t * ray.direction.y;
    if (x < this.x0 || x > this.x1 || y < this.y0 || y > this.y1) {
      return false;
    }

    const u = (x - this.x0) / (this.x1 - this.x0);
    const v = (y - this.y0) / (this.y1 - this.y0);

    const normal = new Vector3(0, 0, 1); // always faces toward Z since it is axis-aligned
    const frontFace = setFaceNormal(ray, normal);
    
    const hitObj = {
      t: t,
      point: ray.getPos(t),
      normal: frontFace.normal,
      frontFace: frontFace.front,
      material: this.material,
      u: u,
      v: v,
      obj: this
    }
    return hitObj;
  }

  bounding() {
    // bounding box must have non-zero width in all dimensions
    // therefore we must pad the z value by a small amount
    return new AABB(new Vector3(this.x1, this.y1, this.z + 0.001), new Vector3(this.x0, this.y0, this.z - 0.001));
  }

  // calculate area
  area() {
    const randomPoint = mixColours(randomVector(), new Vector3(this.areaX, this.areaY, 0));
    return addVectors(this.origin, randomPoint);
  }
}

// aligned along x and z
class RectangleXZ extends Surface {
  constructor(x0, x1, z0, z1, y, material) {
    let center = new Vector3(0, y, 0);
    center.x = x0 + (x1 - x0) / 2;
    center.z = z0 + (z1 - z0) / 2;

    // call our super where the origin is our new-found center
    super(center);
    // assign our class-specific variables
    this.x0 = x0;
    this.x1 = x1;
    this.z0 = z0;
    this.z1 = z1;
    this.y = y;
    this.material = material;

    // calculate our bounding box
    this.bounds = this.bounding();

    // pre-calculate our rectangular area
    this.areaX = x1 - x0;
    this.areaZ = z1 - z0;

    // "light" radius
    this.radius = (this.areaX * this.areaZ);
  }

  hit(ray, t_min, t_max) {
    const t = (this.y - ray.origin.y) / ray.direction.y;
    if (t < t_min || t > t_max) {
      return false;
    }

    const x = ray.origin.x + t * ray.direction.x;
    const z = ray.origin.z + t * ray.direction.z;
    if (x < this.x0 || x > this.x1 || z < this.z0 || z > this.z1) {
      return false;
    }

    const u = (x - this.x0) / (this.x1 - this.x0);
    const v = (z - this.z0) / (this.z1 - this.z0);

    const normal = new Vector3(0, 1, 0); // always faces toward Y since it is axis-aligned
    const frontFace = setFaceNormal(ray, normal);
    
    const hitObj = {
      t: t,
      point: ray.getPos(t),
      normal: frontFace.normal,
      frontFace: frontFace.front,
      material: this.material,
      u: u,
      v: v,
      obj: this
    }
    return hitObj;
  }

  bounding() {
    // bounding box must have non-zero width in all dimensions
    // therefore we must pad the z value by a small amount
    return new AABB(new Vector3(this.x1, this.y + 0.001, this.z1), new Vector3(this.x0, this.y - 0.001, this.z0));
  }

  // calculate area
  area() {
    const randomPoint = mixColours(randomVector(), new Vector3(this.areaX, 0, this.areaZ));
    return addVectors(this.origin, randomPoint);
  }
}

// aligned along y and z
class RectangleYZ extends Surface {
  constructor(y0, y1, z0, z1, x, material) {
    let center = new Vector3(x, 0, 0);
    center.z = z0 + (z1 - z0) / 2;
    center.y = y0 + (y1 - y0) / 2;

    // call our super where the origin is our new-found center
    super(center);
    // assign our class-specific variables
    this.x = x;
    this.y0 = y0;
    this.y1 = y1;
    this.z0 = z0;
    this.z1 = z1;
    this.material = material;

    // calculate our bounding box
    this.bounds = this.bounding();

    // pre-calculate our rectangular area
    this.areaZ = z1 - z0;
    this.areaY = y1 - y0;
    
    // "light" radius
    this.radius = (this.areaY * this.areaZ);
  }

  hit(ray, t_min, t_max) {
    const t = (this.x - ray.origin.x) / ray.direction.x;
    if (t < t_min || t > t_max) {
      return false;
    }

    const z = ray.origin.z + t * ray.direction.z;
    const y = ray.origin.y + t * ray.direction.y;
    if (z < this.z0 || z > this.z1 || y < this.y0 || y > this.y1) {
      return false;
    }

    const u = (z - this.z0) / (this.z1 - this.z0);
    const v = (y - this.y0) / (this.y1 - this.y0);

    const normal = new Vector3(1, 0, 0); // always faces toward X since it is axis-aligned
    const frontFace = setFaceNormal(ray, normal);
    
    const hitObj = {
      t: t,
      point: ray.getPos(t),
      normal: frontFace.normal,
      frontFace: frontFace.front,
      material: this.material,
      u: u,
      v: v,
      obj: this
    }
    return hitObj;
  }

  bounding() {
    // bounding box must have non-zero width in all dimensions
    // therefore we must pad the z value by a small amount
    return new AABB(new Vector3(this.x + 0.001, this.y1, this.z1), new Vector3(this.x - 0.001, this.y0, this.z0));
  }

  // calculate area
  area() {
    const randomPoint = mixColours(randomVector(), new Vector3(0, this.areaY, this.areaZ));
    return addVectors(this.origin, randomPoint);
  }
}

// box surface
// essentially a container for six different axis-aligned planes
class Box extends Surface {
  constructor(p0, p1, y_rotation, material) {
    const center = divideVector(addVectors(p0, p1), 2);
    super(center);

    // get radians from y_rotation degrees input
    this.rotation = y_rotation;
    const rot_radians = toRadians(y_rotation);

    // get sin and cos of y_rotation
    this.sin_theta = Math.sin(rot_radians);
    this.cos_theta = Math.cos(rot_radians);

    this.min = p0;
    this.max = p1;

    this.sides = [];
    // add our sides
    // front and back sides
    this.sides.push(new RectangleXY(p0.x, p1.x, p0.y, p1.y, p1.z, material));
    this.sides.push(new RectangleXY(p0.x, p1.x, p0.y, p1.y, p0.z, material));
    // top and bottom sides
    this.sides.push(new RectangleXZ(p0.x, p1.x, p0.z, p1.z, p1.y, material));
    this.sides.push(new RectangleXZ(p0.x, p1.x, p0.z, p1.z, p0.y, material));
    // left and right sides
    this.sides.push(new RectangleYZ(p0.y, p1.y, p0.z, p1.z, p1.x, material));
    this.sides.push(new RectangleYZ(p0.y, p1.y, p0.z, p1.z, p0.x, material));

    // add our bounds
    this.bounds = this.bounding();
  }

  hit(ray, t_min, t_max) {
    // rotate our ray
    // origin and direction and rotatedRay must be new objects, not references
    const origin = new Vector3(ray.origin.x, ray.origin.y, ray.origin.z);
    const direction = new Vector3(ray.direction.x, ray.direction.y, ray.direction.z);
    const rotatedRay = new Ray(origin, direction);
    if (this.rotation !== 0) {
      // subtract origin to rotate around object's center
      const tempOrigin = subtractVectors(ray.origin, this.origin);
      // rotate our ray's origin
      origin.x = this.cos_theta * tempOrigin.x - this.sin_theta * tempOrigin.z;
      origin.z = this.sin_theta * tempOrigin.x + this.cos_theta * tempOrigin.z;

      // rotate our ray's direction
      direction.x = this.cos_theta * ray.direction.x - this.sin_theta * ray.direction.z;
      direction.z = this.sin_theta * ray.direction.x + this.cos_theta * ray.direction.z;

      // update our rotated ray
      rotatedRay.origin = addVectors(origin, this.origin);
      rotatedRay.origin.y -= this.origin.y;
      rotatedRay.direction = direction;
    }

    let finalObj;
    for (let i = 0; i < this.sides.length; i++) {
      const hit = this.sides[i].hit(rotatedRay, t_min, t_max);
      if (hit) {
        // apply rotation if necessary
        if (this.rotation !== 0) {
          // rotate hit point
          const tempPoint = subtractVectors(hit.point, this.origin);
          hit.point.x = this.cos_theta * tempPoint.x + this.sin_theta * tempPoint.z;
          hit.point.z = -this.sin_theta * tempPoint.x + this.cos_theta * tempPoint.z;
          hit.point = addVectors(hit.point, this.origin);
          hit.point.y -= this.origin.y;
          // rotate hit normal
          hit.normal.x = this.cos_theta * hit.normal.x + this.sin_theta * hit.normal.z;
          hit.normal.z = -this.sin_theta * hit.normal.x + this.cos_theta * hit.normal.z;
        }
        t_max = hit.t;
        finalObj = hit;
      }
    }
    return finalObj;
  }

  bounding() {
    // create a min and max with infinity values for comparison
    const min = new Vector3(Infinity, Infinity, Infinity);
    const max = new Vector3(-Infinity, -Infinity, -Infinity);

    // apply our y_rotation to the bounding box
    // this is not rotating around object's origin but rather the world's origin; this will have to be fixed to use BVH
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        for (let k = 0; k < 2; k++) {
          const x = i * this.max.x + (1 - i) * this.min.x;
          const y = j * this.max.y + (1 - j) * this.min.y;
          const z = k * this.max.z + (1 - k) * this.min.z;

          const newx = this.cos_theta * x + this.sin_theta * z;
          const newz = -this.sin_theta * x + this.cos_theta * z;
          
          const testVector = new Vector3(newx, y, newz);

          // compare and replace min and max
          min.x = Math.min(min.x, testVector.x);
          min.y = Math.min(min.y, testVector.y);
          min.z = Math.min(min.z, testVector.z);

          max.x = Math.max(max.x, testVector.x);
          max.y = Math.max(max.y, testVector.y);
          max.z = Math.max(max.z, testVector.z);
        }
      }
    }

    // return our rotated bounding box
    return new AABB(max, min);
  }

  area() {
    return;
  }
}