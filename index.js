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
let maxSamples = 100000;
// set the depth of our samples (# of bounces)
const globalDepth = 4;
// define a global variable for whether we want to use BVH or not (defaults to false)
let useBVH = false;

// define our sky parameters (zero vectors are pitch black)
let skyCol = new Vector3(0, 0, 0);
let useSkybox = false;
let skybox;

// define and load our images
let skyImage = new Image();
skyImage.src = "./textures/sky/sky_01.jpg";
let grateDiff = new Image();
grateDiff.src = "./textures/metal_plate/plate_diff.jpg";
let grateRough = new Image();
grateRough.src = "./textures/metal_plate/plate_rough.jpg";
let grateNorm = new Image();
grateNorm.src = "./textures/metal_plate/plate_norm.jpg";
let grateMetal = new Image();
grateMetal.src = "./textures/metal_plate/plate_metal.jpg";

let slabDiff = new Image();
slabDiff.src = './textures/slab/slab_diff.jpg';
let slabRough = new Image();
slabRough.src = './textures/slab/slab_rough.jpg';
let slabNorm = new Image();
slabNorm.src = './textures/slab/slab_norm.jpg';

let woodDiff = new Image();
woodDiff.src = './textures/wood_old/wood_old_diff.jpg';
let woodRough = new Image();
woodRough.src = './textures/wood_old/wood_old_rough.jpg';
let woodNorm = new Image();
woodNorm.src = './textures/wood_old/wood_old_norm.jpg';

// define our camera
let camera = new Camera(new Vector3(0, 0, 0), new Vector3(0, 0, -1), new Vector3(0, 1, 0), 60, ratio);

// define our materials
// define our lights
const light1 = new Material(2, new Vector3(1, 1, 1));
light1.brightness = 2000;
const light2 = new Material(2, new Vector3(1, 1, 0));
light2.brightness = 500;
const light3 = new Material(2, new Vector3(0.5, 0.5, 2));
light3.brightness = 5000;

const reflection1 = new Material(1, new Vector3(1, 1, 1));
reflection1.roughness = 0.05;
const reflection2 = new Material(1, new Vector3(1, 0.035, 0.8));
reflection2.roughness = 0;

const refractive1 = new Material(3, new Vector3(1, 1, 1));
refractive1.roughness = 0;

const diffuse1 = new Material(0, new Vector3(1, 1, 1));
const diffuse2 = new Material(1, new Vector3(1, 0, 0));
diffuse2.roughness = 0;
const diffuse3 = new Material(1, new Vector3(0, 1, 0));
diffuse3.roughness = 0;
const diffuse4 = new Material(4, new Vector3(0.25, 0.5, 1));
diffuse4.roughness = 0.25;

const polished1 = new Material(4, new Vector3(0.25, 1, 0.65));
polished1.roughness = 0.1;

// textured materials
const textured1 = new Material(5, new Vector3(1, 1, 1));
textured1.roughness = 1;
textured1.normalMult = 1;
textured1.metalness = 1;
textured1.tilingX = 2;
textured1.tilingY = 2;

const textured2 = new Material(4, new Vector3(1, 1, 1));
textured2.roughness = 1;
textured2.tilingX = 2;
textured2.tilingY = 2;

const textured3 = new Material(4, new Vector3(1, 1, 1));
textured3.roughness = 1;
textured3.tilingX = 2;
textured3.tilingY = 2;

// define our world
// define the containing room
const ceiling = new RectangleXZ(-40, 40, -40, 10, -10, diffuse1);
const floor =  new RectangleXZ(-40, 40, -40, 10, 10, diffuse1);
const back_wall = new RectangleXY(-40, 40, -40, 40, -40, diffuse1);
const left_wall = new RectangleYZ(-10, 10, -40, 10, -10, diffuse2);
const right_wall = new RectangleYZ(-10, 10, -40, 10, 10, diffuse3);
const enclosing_wall = new RectangleXY(-40, 40, -40, 40, 10, diffuse1);
// define the lights within this room
const ceiling_light = new RectangleXZ(-2, 2, -27, -22, -10, light1);
// define the objects within this room
const sphere1 = new Sphere(new Vector3(-4.5, 5.5, -25), 4, diffuse1);
const sphere2 = new Sphere(new Vector3(4.5, 5.5, -20), 4, diffuse1);
const box1 = new Box(new Vector3(-7, -5, -35), new Vector3(1, 10, -30), 20, diffuse4);
const box2 = new Box(new Vector3(0, 2, -26), new Vector3(8, 10, -21), -18, diffuse4);

const world = [ceiling, floor, back_wall, left_wall, right_wall, enclosing_wall, ceiling_light, box1, box2];

// create a master BVH container
const masterBVH = new BVH(world);

// create our lights array for sphere which emit light
const lights = [ceiling_light]; // for biased raytracing


//== define and manage page elements ==//
// get our main div and create a canvas element, and a loading element
const div = document.getElementById("canvas");
const canvas = document.createElement("canvas");
const loading = document.createElement("h1")
// define our canvas properties
canvas.textContent = "The raytracer is being rendered on this canvas.";
canvas.setAttribute("width", width);
canvas.setAttribute("height", height);
// add text to our loading "bar"
loading.textContent = "Loading assets... please wait.";
// add our loading bar to the page; we will add the canvas once loading is complete
div.appendChild(loading);
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
  depthEl.textContent = "Current ray depth: " + globalDepth;
  if (sample < maxSamples) {
    raytrace();
  }

  // recursively call self
  requestAnimationFrame(main);
}

// call our rendering once the whole webpage has loaded
window.onload = () => {
  skybox = new Texture(skyImage);
  textured1.diffuseTex = new Texture(grateDiff);
  textured1.roughnessTex = new Texture(grateRough);
  textured1.normalTex = new Texture(grateNorm);
  textured1.metalTex = new Texture(grateMetal);

  textured2.diffuseTex = new Texture(slabDiff);
  textured2.roughnessTex = new Texture(slabRough);
  textured2.normalTex = new Texture(slabNorm);

  textured3.diffuseTex = new Texture(woodDiff);
  textured3.roughnessTex = new Texture(woodRough);
  textured3.normalTex = new Texture(woodNorm);

  // remove our loading "bar" and add our canvas to the page
  loading.remove();
  div.appendChild(canvas);

  // begin our progressive rendering loop
  requestAnimationFrame(main);
};

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
      let randx = rng() * 2 - 1;
      let randy = rng() * 2 - 1;
      const u = (x + randx) / width;
      const v = (y + randy) / height;

      // cast our ray and store it
      const ray = camera.castRay(u, v);

      // intersect this ray with the world
      // if we are using a BVH, do so here
      if (useBVH) {
        colour = intersectWorld(ray, [masterBVH], 0.001, Infinity, globalDepth, lights, skyCol, useSkybox);
      } else {
        // otherwise just render using the whole world array
        colour = intersectWorld(ray, world, 0.001, Infinity, globalDepth, lights, skyCol, useSkybox);
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
      let value = perlin.get((x / width) * perlinSize * 4, (y / height) * perlinSize * 4) * 255;
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