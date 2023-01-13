// defines classes used for bounding boxes
class AABB {
  constructor(max = new Vector3(0,0,0), min = new Vector3(0,0,0)) {
    this.max = max;
    this.min = min;
  }

  hit(ray) {
    // determine if our ray is within these bounds
    let tx1 = (this.min.x - ray.origin.x) * ray.dirFrac.x;
    let tx2 = (this.max.x - ray.origin.x) * ray.dirFrac.x;

    let t_min = Math.min(tx1, tx2);
    let t_max = Math.max(tx1, tx2);

    let ty1 = (this.min.y - ray.origin.y) * ray.dirFrac.y;
    let ty2 = (this.max.y - ray.origin.y) * ray.dirFrac.y;

    t_min = Math.max(t_min, Math.min(ty1, ty2));
    t_max = Math.min(t_max, Math.max(ty1, ty2));

    return t_max >= 0 && t_max >= t_min;
  }
}