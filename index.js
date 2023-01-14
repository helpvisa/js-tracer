//== variable declaration ==//
// define the width and height of our canvas, and determine its aspect ratio
// 1920x1080 is not a sane value; most likely the canvas should be scaled/stretched to fit the screen after it has finished rendering
let width = 1280;
let height = 720;
let ratio = width / height;
// tick tracking (for animation, updating on-page values)
let oldSamples = 0;
let tick = 0;
// current sample (for accumulation multisampling) and set a max sample rate
let sample = 0;
let maxSamples = 10000;
// set the depth of our samples (# of bounces)
const depth = 4;
// define a global variable for whether we want to use BVH or not (defaults to false)
let useBVH = false;

// define our sky parameters (zero vectors are pitch black)
let skyTop = new Vector3(50, 50, 150);
let skyBottom = new Vector3(100, 100, 250);

// define our camera
let camera = new Camera(new Vector3(40, 0, -10), new Vector3(3, 0, -60), new Vector3(0, 1, 0), 50, ratio);

// define our materials
// define our lights
const light1 = new Material(2, new Vector3(1, 0.5, 0.5));
light1.brightness = 10000;
const light2 = new Material(2, new Vector3(0.5, 1, 0.5));
light2.brightness = 10000;
const light3 = new Material(2, new Vector3(0.5, 0.5, 2));
light3.brightness = 10000;

const reflection1 = new Material(1, new Vector3(1, 1, 1));
reflection1.roughness = 0.2;
const reflection2 = new Material(1, new Vector3(1, 0.035, 0.8));
reflection2.roughness = 0;

const refractive1 = new Material(3, new Vector3(1, 1, 1));
refractive1.roughness = 0.5;

const diffuse1 = new Material(0, new Vector3(1, 1, 1));
const diffuse2 = new Material(0, new Vector3(0.025, 0.025, 1));
const diffuse3 = new Material(0, new Vector3(0.5, 1, 0.5));

const polished1 = new Material(4, new Vector3(0.25, 1, 0.65));
polished1.roughness = 0.5;

// define our world
const sphere1 = new Sphere(new Vector3(0, 0, -60), 18, polished1);
const sphere2 = new Sphere(new Vector3(20.5, 13, -49), 8, reflection2);
const sphere3 = new Sphere(new Vector3(-26, -19, -40), 8, light1);
const sphere4 = new Sphere(new Vector3(-28, 8, -55), 9, refractive1);
const sphere5 = new Sphere(new Vector3(30, -22, -60), 8, light2);
const sphere6 = new Sphere(new Vector3(0, 320, -60), 300, diffuse3);
const sphere7 = new Sphere(new Vector3(-30, -10, -15), 6, light3);
const rect1 = new Rectangle(-80, 80, -1000, -100, -150, light3);
const rect2 = new Rectangle(-800, 800, -600, 600, -84, reflection1);

const world = [sphere1, sphere2, sphere3, sphere4, sphere5, sphere6, sphere7, rect2];
// for (let i = 0; i < 200; i++) {
//   world.push(new Sphere(new Vector3(Math.random() * 600 - 300, Math.random() * 300 - 150, -200), Math.random() * 20, polished1));
// }

// create a master BVH container
const masterBVH = new BVH(world);

// create our lights array for sphere which emit light
const lights = [sphere3, sphere5, sphere7]; // for biased raytracing


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
// wrap a function to call for our primary render loop
function main() {
  // update our on-page elements
  samplesEl.textContent = "Samples so far: " + sample;
  depthEl.textContent = "Current ray depth: " + depth;
  if (sample < maxSamples) {
    raytrace();
  }

  // recursively call self
  requestAnimationFrame(main);
}

requestAnimationFrame(main);
// check how many samples are being rendered per second
setInterval(samplesPerSecondCalc, 1000);


//== function declaration ==//
// use the camera to cast rays
function raytrace() {
  sample += 1;
  // get our buffer data
  const renderData = renderBuffer.data;

  // iterate through each pixel and cast a ray from it with our camera class
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // create vectors which store the unbiased traces and the biased traces, and the final colour
      let colour = new Vector3(0, 0, 0);
      // randomize UVs here (for multisampling 'antialiasing')
      let rand = Math.random() - 0.5;
      const u = (x + rand) / width;
      const v = (y + rand) / height;

      // cast our ray and store it
      const ray = camera.castRay(u, v);

      // intersect this ray with the world
      // if we are using a BVH, do so here
      if (useBVH) {
        colour = intersectWorld(ray, [masterBVH], 0.001, Infinity, depth, lights, skyTop, skyBottom);
      } else {
        // otherwise just render using the whole world array
        colour = intersectWorld(ray, world, 0.001, Infinity, depth, lights, skyTop, skyBottom);
      }

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
    }
  }

  // update the on-browser image
  context.putImageData(renderBuffer, 0, 0);
}

// fills the buffer with one specific colour
function fillBuffer(colour = new Vector3(15, 15, 15)) {
  // colour should be a vector4 style input (r,g,b,a)
  // get our buffer data
  const data = renderBuffer.data;

  // iterate over each pixel
  for (let i = 0; i < data.length; i += 4) { // += 4 because each pixel is stored as 4 colour indices in a row (rgba)
    data[i] = colour.x; // red
    data[i + 1] = colour.y; // green
    data[i + 2] = colour.z; // blue
    data[i + 3] = 255; // alpha
  }

  // add our image data to the context
  context.putImageData(renderBuffer, 0, 0); // 0,0 is offset for top-left corner of buffer
}

// fills the buffer with randomly coloured pixels
function fillBufferPerlin() {
  // colour should be a vector4 style input (r,g,b,a)
  // get our buffer data
  const data = renderBuffer.data;

  // iterate over each pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = getIndex(x, y, width);
      let value = perlin.get(x / width * (perlinSize - 1), y / height * (perlinSize - 1));
      data[index] = value; // red
      data[index + 1] = value; // green
      data[index + 2] = value; // blue
      data[index + 3] = 255; // alpha
    }
  }

  // add our image data to the context
  context.putImageData(renderBuffer, 0, 0); // 0,0 is offset for top-left corner of buffer
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