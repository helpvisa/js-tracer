//== variable declaration ==//
// define the width and height of our canvas, and determine its aspect ratio
// 1920x1080 is not a sane value; most likely the canvas should be scaled/stretched to fit the screen after it has finished rendering
let width = 100;
let height = 100;
let ratio = width / height;
// define our camera
const camera = new Camera(new Vector3(0, 0, 0), new Vector3(0, 0, 1), 20, ratio);
// define our world (only one sphere atm)
const world = new Sphere(new Vector3(0, 21, -60), 5);


//== define and manage page elements ==//
// get our main div and create a canvas element
const main = document.getElementById("canvas");
const canvas = document.createElement("canvas");
// define our canvas properties
canvas.textContent = "The raytracer is being rendered on this canvas.";
canvas.setAttribute("width", width);
canvas.setAttribute("height", height);
// add our canvas to the page
main.appendChild(canvas);


//== prepare for rendering ==//
// get the context of our canvas in order to render to it
const context = canvas.getContext("2d");

// create the ImageData object to which we will render our pixels offscreen
const buffer = context.createImageData(width, height);
raytrace();


//== function declaration ==//
// use the camera to cast rays
function raytrace() {
  // get our buffer data
  const data = buffer.data;

  // iterate through each pixel and cast a ray from it with our camera class
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let colour = new Vector3(0, 0, 0);
      // randomize UVs here, eventually, for multisample operations
      const u = x / width;
      const v = y / height;

      // cast our ray and store it
      const ray = camera.castRay(u, v);

      // intersect this ray with the world
      colour = intersectWorldNormals(ray, world);

      // paint this colour to the buffer at the appropriate index
      const index = getIndex(x, y, width);
      data[index] = colour.x; // red channel
      data[index + 1] = colour.y; // green channel
      data[index + 2] = colour.z; // blue channel
      data[index + 3] = 255; // full alpha
    }
  }

  // update the on-browser image
  context.putImageData(buffer, 0, 0);
}

// fills the buffer with one specific colour
function fillBuffer(colour = new Vector3(15, 15, 15)) {
  // colour should be a vector4 style input (r,g,b,a)
  // get our buffer data
  const data = buffer.data;

  // iterate over each pixel
  for (let i = 0; i < data.length; i += 4) { // += 4 because each pixel is stored as 4 colour indices in a row (rgba)
    data[i] = colour.x; // red
    data[i + 1] = colour.y; // green
    data[i + 2] = colour.z; // blue
    data[i + 3] = 255; // alpha
  }

  // add our image data to the context
  context.putImageData(buffer, 0, 0); // 0,0 is offset for top-left corner of buffer
}

// fills the buffer with randomly coloured pixels
function fillBufferRandom() {
  // colour should be a vector4 style input (r,g,b,a)
  // get our buffer data
  const data = buffer.data;

  // iterate over each pixel
  for (let i = 0; i < data.length; i += 4) { // += 4 because each pixel is stored as 4 colour indices in a row (rgba)
    data[i] = Math.floor(Math.random() * 255); // red
    data[i + 1] = Math.floor(Math.random() * 255); // green
    data[i + 2] = Math.floor(Math.random() * 255); // blue
    data[i + 3] = 255; // alpha
  }

  // add our image data to the context
  context.putImageData(buffer, 0, 0); // 0,0 is offset for top-left corner of buffer
}

// returns the red index (blue, green, and alpha indices can be accesed by adding + 1, + 2, + 3 to index)
function getIndex(x, y, width) {
  const redIndex = y * (width * 4) + x * 4;
  return redIndex;
}
