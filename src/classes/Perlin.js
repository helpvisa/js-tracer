// create a perlin noise function, and store it as an object that can be called
class Perlin {
  constructor(n) {
    // create a grid
    this.grid = [];
    this.nodes = n; // number of columns and rows

    // populate our grid with random vectors (should now be a 2d array of cols and rows)
    for (let i = 0; i < this.nodes; i++) {
      let row = [];
      for (let j = 0; j < this.nodes; j++) {
        row.push(this.random2DVector());
      }
      this.grid.push(row);
    }
  }

  seed() {
    // create a grid
    this.grid = [];

    // populate our grid with random vectors (should now be a 2d array of cols and rows)
    for (let i = 0; i < this.nodes; i++) {
      let row = [];
      for (let j = 0; j < this.nodes; j++) {
        row.push(this.random2DVector());
      }
      this.grid.push(row);
    }
  }

  get(x, y) {
    // use modulo to make x and y values repeat
    x = x % (this.nodes);
    y = y % (this.nodes);
    
    // return an intensity based on the input x and y values
    // get grid entries, forming a 2x2 "cell" of values to interpolate
    let x0 = Math.floor(Math.abs(x)); // prevent negative numbers from appearing, just in case
    let x1 = x0 + 1;
    let y0 = Math.floor(Math.abs(y));
    let y1 = y0 + 1;

    // get dot products of our cell grid
    let topLeft = this.dotGrid(x, y, x0, y0);
    let bottomLeft = this.dotGrid(x, y, x0, y1);
    let topRight = this.dotGrid(x, y, x1, y0);
    let bottomRight = this.dotGrid(x, y, x1, y1);

    // fade our x and y values for smoother interpolation
    y = y1 - y;
    x = x1 - x;
    y = this.fade(y);
    x = this.fade(x);
  
    // linearly interpolate this value to get the intensity
    let v1 = this.interpolate(y, bottomLeft, topLeft);
    let v2 = this.interpolate(y, bottomRight, topRight);
    let v3 = this.interpolate(x, v2, v1);

    // clamp between 0 and 1
    let intensity = (v3 + 1) / 2;

    // return our interpolated intensity
    return intensity;
  }

  // create a random normalized 2d vector (stored here since it is only used by this perlin noise function)
  random2DVector() {
    const theta = Math.random() * 2 * Math.PI;
    let vector = {x: Math.cos(theta), y: Math.sin(theta)};
    return vector;
  }

  // get dot products
  dotGrid(x, y, gridX, gridY) {
    let distance = {x: x - gridX, y: y - gridY};

    // wrap grid values
    if (gridX > this.nodes - 1) {
      gridX = 0;
    }
    if (gridY > this.nodes - 1) {
      gridY = 0;
    }
    
    // then find our grid value
    let gradient = this.grid[gridX][gridY];
    return distance.x * gradient.x + distance.y * gradient.y;
  }

  // linear interpolator
  interpolate(val, a, b) {
    return a + val * (b - a);
  }

  fade(val) {
    return ((6 * val - 15) * val + 10) * val * val * val;
  }
}