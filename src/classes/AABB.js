// defines classes used for bounding boxes
class AABB {
  constructor(max = new Vector3(0,0,0), min = new Vector3(0,0,0)) {
    this.max = max;
    this.min = min;
  }

  hit(ray) {
    // determine if our ray is within these bounds
    let t1 = (this.min.x - ray.origin.x) * ray.dirFrac.x;
    let t2 = (this.max.x - ray.origin.x) * ray.dirFrac.x;
    let t3 = (this.min.y - ray.origin.y) * ray.dirFrac.y;
    let t4 = (this.max.y - ray.origin.y) * ray.dirFrac.y;
    let t5 = (this.min.z - ray.origin.z) * ray.dirFrac.z;
    let t6 = (this.max.z - ray.origin.z) * ray.dirFrac.z;

    const t_min = Math.max(Math.max(Math.min(t1,t2), Math.min(t3,t4)), Math.min(t5,t6));
    const t_max = Math.min(Math.min(Math.max(t1,t2), Math.max(t3,t4)), Math.max(t5,t6));

    if (t_max < 0)
        return false;

    if (t_min > t_max)
        return false;
    
    return true;
  }
}