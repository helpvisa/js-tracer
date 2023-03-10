// create a texture class that is able to return a pixel at a given UV
class Texture {
  constructor(image) {
    this.image = image;
    // store our image in a canvas for easy access to its data
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.image.width;
    this.canvas.height = this.image.height;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    // get our canvas context for manipulation
    this.context = this.canvas.getContext("2d", {willReadFrequently: true});
    // render our image to our context
    this.context.drawImage(this.image, 0, 0);
    // read once, store in an array of pixels
    this.data = this.context.getImageData(0, 0, this.width, this.height).data;
  }

  // get a pixel from a given uv value
  getPixel(u, v) {
    let uL = u * this.width;
    let vL = v * this.height;
    uL = uL % this.width;
    vL = vL % this.height;
    let x = Math.floor(uL);
    let y = Math.floor(vL);

    // get indices, prepare for interpolation
    let x1 = x + 1;
    let y1 = y + 1;
    // wrap values
    if (x1 > this.width - 1) {
      x1 = 0;
    }
    if (y1 > this.height - 1) {
      y1 = 0;
    }
    // get our interpolation indices
    const topLeft = this.getIndex(x, y);
    const topRight = this.getIndex(x1, y);
    const bottomLeft = this.getIndex(x, y1);
    const bottomRight = this.getIndex(x1, y1);

    // interpolate our values
    const ix = uL - x;
    const iy = vL - y;

    const r1 = this.interpolate(iy, this.data[topLeft], this.data[bottomLeft]);
    const r2 = this.interpolate(iy, this.data[topRight], this.data[bottomRight]);
    const r = this.interpolate(ix, r1, r2);

    const g1 = this.interpolate(iy, this.data[topLeft + 1], this.data[bottomLeft + 1]);
    const g2 = this.interpolate(iy, this.data[topRight + 1], this.data[bottomRight + 1]);
    const g = this.interpolate(ix, g1, g2);

    const b1 = this.interpolate(iy, this.data[topLeft + 2], this.data[bottomLeft + 2]);
    const b2 = this.interpolate(iy, this.data[topRight + 2], this.data[bottomRight + 2]);
    const b = this.interpolate(ix, b1, b2);

    // create our return obj
    let pixel = {
      r: r / 255,
      g: g / 255,
      b: b / 255
    }

    return pixel;
  }

  // linear interpolator
  interpolate(val, a, b) {
    return a + val * (b - a);
  }

  // map index
  getIndex(x, y) {
    return y * (this.width * 4) + x * 4
  }
}