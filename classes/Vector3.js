// class that defines a 3 dimensional vector
class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  // methods
  normalize() {
    const max = Math.max(Math.max(this.x, this.y), this.z);
    this.x = this.x / max;
    this.y = this.y / max;
    this.z = this.z / max;
  }
};