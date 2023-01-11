// defines classes used for bounding boxes
class AABB {
  constructor(max = new Vector3(0,0,0), min = new Vector3(0,0,0)) {
    this.max = max;
    this.min = min;
  }

  hit(ray) {
    // calculate fractional ray direction
    let dirFrac = new Vector3(0,0,0);
    if (ray.direction.x === 0) {
      dirFrac.x = 0;
    } else {
      dirFrac.x = 1 / ray.direction.x;
    }
    if (ray.direction.y === 0) {
      dirFrac.y = 0;
    } else {
      dirFrac.y = 1 / ray.direction.y;
    }
    if (ray.direction.z === 0) {
      dirFrac.z = 0;
    } else {
      dirFrac.z = 1 / ray.direction.z;
    }

    // determine if our ray is within these bounds
    let t1 = (this.min.x - ray.origin.x) * dirFrac.x;
    let t2 = (this.max.x - ray.origin.x) * dirFrac.x;
    let t3 = (this.min.y - ray.origin.y) * dirFrac.y;
    let t4 = (this.max.y - ray.origin.y) * dirFrac.y;
    let t5 = (this.min.z - ray.origin.z) * dirFrac.z;
    let t6 = (this.max.z - ray.origin.z) * dirFrac.z;

    const t_min = Math.max(Math.max(Math.min(t1,t2), Math.min(t3,t4)), Math.min(t5,t6));
    const t_max = Math.min(Math.min(Math.max(t1,t2), Math.max(t3,t4)), Math.max(t5,t6));

    if (t_max < 0)
        return false;

    if (t_min > t_max)
        return false;
    
    return true;
  }
}