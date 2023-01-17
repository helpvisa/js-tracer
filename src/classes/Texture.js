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
    this.data = this.context.getImageData(0, 0, this.width, this.height);
  }

  // get a pixel from a given uv value
  getPixel(u, v) {
    const index = Math.floor(v * this.height) * (this.width * 4) + Math.floor(u * this.width) * 4;
    return {
      r: this.data.data[index] / 255,
      g: this.data.data[index + 1] / 255,
      b: this.data.data[index + 2] / 255
    };
  }
}