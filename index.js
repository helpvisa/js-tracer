//== variable declaration ==//
// define the width and height of our canvas, and determine its aspect ratio
// 1920x1080 is not a sane value; most likely the canvas should be scaled/stretched to fit the screen after it has finished rendering
let width = 320;
let height = 240;
let ratio = width / height;
// tick tracking (for animation, updating on-page values)
let oldSamples = 0;
let tick = 0;
// current sample (for accumulation multisampling) and set a max sample rate
let sample = 0;
let maxSamples = 1000;
// set the depth of our samples (# of bounces)
const depth = 4;

// define our camera
const camera = new Camera(new Vector3(0, 0, 0), new Vector3(0, 0, 1), 60, ratio);

// define our materials
// define our lights
const greenLight = new Material(2, new Vector3(0.1, 5, 0.1));
greenLight.softness = 8;

// define our world `
const sphere1 = new Sphere(new Vector3(0, 0, -60), 25);
const sphere2 = new Sphere(new Vector3(-20, 13, -40), 8, new Material(0, new Vector3(1, 0.1, 0.1)));
const sphere3 = new Sphere(new Vector3(20, -13, -40), 2, greenLight);
const sphere4 = new Sphere(new Vector3(20, 13, -40), 8, new Material(0, new Vector3(0.1, 0.1, 1)));
const sphere5 = new Sphere(new Vector3(-20, -13, -40), 8, new Material(0, new Vector3(1, 0.1, 1)));
const world = [sphere1, sphere2, sphere3, sphere4, sphere5];
const lights = [sphere3]; // for biased raytracing


//== define and manage page elements ==//
// get our main div and create a canvas element
const div = document.getElementById("canvas");
const canvas = document.createElement("canvas");
// define our canvas properties
canvas.textContent = "The raytracer is being rendered on this canvas.";
canvas.setAttribute("width", width);
canvas.setAttribute("height", height);
// add our canvas to the page
div.appendChild(canvas);
// grab our sub-headers and update them
const samplesPerSecondEl = document.getElementById("samples-per-second");
const samplesEl = document.getElementById("samples");
const depthEl = document.getElementById("depth");


//== prepare for rendering ==//
// get the context of our canvas in order to render to it
const context = canvas.getContext("2d");

// create the ImageData object to which we will render our pixels offscreen
const renderBuffer = context.createImageData(width, height);
// const displayBuffer = context.createImageData(width, height);
// wrap a function to call every 1/10 of a second
function main() {
  // update our on-page elements
  samplesEl.textContent = "Samples so far: " + sample;
  depthEl.textContent = "Current ray depth: " + depth;
  if (sample < maxSamples) {
    raytrace();
  }
}
// run it as fast as possible
setInterval(main, 1);
// now check how many samples are being rendered per second
setInterval(samplesPerSecondCalc, 1000);


//== function declaration ==//
// use the camera to cast rays
function raytrace() {
  sample += 1;
  // get our buffer data
  const renderData = renderBuffer.data;
  // const displayData = displayBuffer.data;

  // iterate through each pixel and cast a ray from it with our camera class
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // create vectors which store the unbiased traces and the biased traces, and the final colour
      let colourUnbiased = new Vector3(0, 0, 0);
      let colourBiased = new Vector3(0, 0, 0);
      let colour = new Vector3(0, 0, 0);
      // randomize UVs here, eventually, for multisample operations
      const u = (x + (Math.random() * 2 - 1)) / width;
      const v = (y + (Math.random() * 2 - 1)) / height;

      // cast our ray and store it
      const ray = camera.castRay(u, v);

      // intersect this ray with the world
      // colour = intersectWorldNormals(ray, world, 0, Infinity);
      // regular trace
      colourUnbiased = multiplyVector(intersectWorld(ray, world, 0.001, Infinity, depth), 0.5);
      // trace biased toward light sources
      colourBiased = multiplyVector(intersectWorldLightBiased(ray, world, 0.001, Infinity, depth, lights), 0.5);
      colour = addVectors(colourUnbiased, colourBiased);

      // paint this colour to the buffer at the appropriate index
      const index = getIndex(x, y, width);
      // make room for new additive colour value
      renderData[index] *= 1 - (1 / sample);
      renderData[index + 1] *= 1 - (1 / sample);
      renderData[index + 2] *= 1 - (1 / sample);
      // add the new sample
      renderData[index] += colour.x * (1 / sample); // red channel
      renderData[index + 1] += colour.y * (1 / sample); // green channel
      renderData[index + 2] += colour.z * (1 / sample); // blue channel
      renderData[index + 3] = 255; // full alpha

      // apply gamma curve to rendered data by writing it to the display buffer
      // displayData[index] = Math.pow(renderData[index], 0.9);
      // displayData[index + 1] = Math.pow(renderData[index + 1], 0.9);
      // displayData[index + 2] = Math.pow(renderData[index + 2], 0.9);
      // displayData[index + 3] = renderData[index + 3];
    }
  }

  // update the on-browser image
  context.putImageData(renderBuffer, 0, 0);
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

// calculates the # of samples being performed per second (roughly)
function samplesPerSecondCalc() {
  let numSinceCheck = (sample - oldSamples); // will be updated 4 times per second
  samplesPerSecondEl.textContent = "Samples per second: " + numSinceCheck;
  oldSamples = sample;
}

// moves the world
function moveObject(obj) {
  tick += 0.01;
  obj.origin.y += Math.sin(tick);
}