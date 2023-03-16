//== variable declaration ==//
// define the width and height of our canvas, and determine its aspect ratio
// 1920x1080 is not a sane value; most likely the canvas should be scaled/stretched to fit the screen after it has finished rendering
let width = 320;
let height = 240;
let ratio = width / height;
// tick tracking (for animation, updating on-page values)
let oldSamples = 0;
let tick = 0;
let clock = new Date();
let oldTimestamp = clock.getTime();
let delta = 0;
// current sample (for accumulation multisampling) and set a max sample rate
let sample = 0;
let maxSamples = 10000;
// set the depth of our samples (# of bounces)
let globalDepth = 6;
// define a global variable for whether we want to use BVH or not (defaults to false)
let useBVH = false;

// define our sky parameters (zero vectors are pitch black)
let skyCol = new Vector3(0, 0, 0);
let useSkybox = false;
let skybox;

// define and load our images
let skyImage = new Image();
skyImage.src = "./textures/sky/vestibule.jpg";

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
woodDiff.src = './textures/plank/plank_diff.jpg';
let woodRough = new Image();
woodRough.src = './textures/plank/plank_rough.jpg';
let woodNorm = new Image();
woodNorm.src = './textures/plank/plank_norm.jpg';

let coralDiff = new Image();
coralDiff.src = "./textures/coral/coral_diff.jpg";
let coralRough = new Image();
coralRough.src = "./textures/coral/coral_rough.jpg";
let coralNorm = new Image();
coralNorm.src = "./textures/coral/coral_norm.jpg";

// define our camera
let camera = new Camera(new Vector3(0, 0, 0), new Vector3(0, 0, -1), new Vector3(0, 1, 0), 60, ratio);

// define our materials
// define our lights
const light1 = new Material(2, new Vector3(1, 1, 1));
light1.brightness = 1500;
const light2 = new Material(2, new Vector3(1, 0.1, 0.1));
light2.brightness = 2500;
const light3 = new Material(2, new Vector3(0.15, 0.15, 1));
light3.brightness = 3000;
const light4 = new Material(2, new Vector3(1, 0.1, 0.1));
light4.brightness = 500;
const light5 = new Material(2, new Vector3(0.1, 0.1, 1));
light5.brightness = 500;
const light6 = new Material(2, new Vector3(1, 1, 1));
light6.brightness = 2000;

const reflection1 = new Material(1, new Vector3(1, 1, 1));
reflection1.roughness = 0.25;
const reflection2 = new Material(1, new Vector3(1, 0.843, 0));
reflection2.roughness = 0;

const refractive1 = new Material(3, new Vector3(1, 1, 1));
refractive1.roughness = 0;

const diffuse1 = new Material(0, new Vector3(1, 1, 1));
const diffuse2 = new Material(0, new Vector3(1, 0, 0));
diffuse2.roughness = 0;
const diffuse3 = new Material(0, new Vector3(0, 1, 0));
diffuse3.roughness = 0;
const diffuse4 = new Material(4, new Vector3(0.25, 0.5, 1));
diffuse4.roughness = 0.2;

const polished1 = new Material(4, new Vector3(0.65, 0.25, 0.65));
polished1.roughness = 0;
const polished2 = new Material(4, new Vector3(0.1, 0.1, 1));
polished2.roughness = 0.4;
const polished3 = new Material(4, new Vector3(1, 0.1, 0.1));
polished3.roughness = 0.4;
const polished4 = new Material(4, new Vector3(1, 1, 1));
polished3.roughness = 0.4;

// textured materials
const textured1 = new Material(5, new Vector3(1, 1, 1));
textured1.roughness = 1;
textured1.normalMult = 1;
textured1.metalness = 1;
textured1.tilingX = 2;
textured1.tilingY = 2;

const textured2 = new Material(4, new Vector3(1, 1, 1));
textured2.roughness = 1;
textured2.tilingX = 2.25;
textured2.tilingY = 2.25;

const textured3 = new Material(4, new Vector3(1, 1, 1));
textured3.normalMult = 1;
textured3.roughness = 1;
textured3.tilingX = 2;
textured3.tilingY = 2;

// define our scenes
// scene 1 -------------------------------------------------------//
const scene1_camera = new Camera(new Vector3(0, 0, 0), new Vector3(0, 0, -1), new Vector3(0, 1, 0), 60, ratio);
// define the containing room
const ceiling = new RectangleXZ(-40, 40, -40, 10, -10, textured2);
const floor =  new RectangleXZ(-40, 40, -40, 10, 10, textured3);
const back_wall = new RectangleXY(-40, 40, -40, 10, -40, diffuse1);
const left_wall = new RectangleYZ(-40, 10, -40, 10, -10, diffuse3);
const right_wall = new RectangleYZ(-40, 10, -40, 10, 10, textured1);
const enclosing_wall = new RectangleXY(-40, 40, -40, 40, 10, diffuse1);
// define the lights within this room
const ceiling_light = new RectangleXZ(-1, 1, -28, -19, -10, light1);
const wall_light = new RectangleYZ(1, 5, -30, -20, -10, light3)
const sphere1 = new Sphere(new Vector3(4, 0, -24), 2, light2);
// define the objects within this room
const sphere2 = new Sphere(new Vector3(4, 7, -24), 3, reflection2);
const box1 = new Box(new Vector3(-7, -5, -35), new Vector3(1, 10, -30), 20, diffuse4);
const box2 = new Box(new Vector3(0, 2, -26), new Vector3(8, 4, -21), -20, polished1);
const box3 = new Box(new Vector3(-8, -6, -26), new Vector3(-4, 0, -20), 0, refractive1);

const scene1 = [ceiling, ceiling_light, floor, back_wall, left_wall, right_wall, enclosing_wall, wall_light, box1, box2, box3, sphere1, sphere2];
const lighting1 = [ceiling_light, wall_light, sphere1];

const setup_01 = { scene: scene1, lighting: lighting1, camera: scene1_camera };
// ---------------------------------------------------------------//
// scene 2 -------------------------------------------------------//
const scene2_camera = new Camera(new Vector3(-8, -5, 40), new Vector3(-0.5, 0, -20), new Vector3(0, 1, 0), 20, ratio);
// objects
const s2_ground = new RectangleXZ(-40, 40, -40, 200, 10, polished4);
const s2_backwall = new RectangleXY(-200, 20, -40, 10, -40, reflection1);
const s2_frontwall = new RectangleXY(-200)
const s2_midwall = new Box(new Vector3(-1, 0, -40), new Vector3(1, 10, 200), 0, polished4);
const s2_sphere1 = new Sphere(new Vector3(-9, 5, -24), 5, polished3);
const s2_sphere2 = new Sphere(new Vector3(9, 5, -24), 5, polished2);
const s2_rightwall_light = new RectangleYZ(-200, 10, -40, 200, 20, light4);
const s2_leftwall_light = new RectangleYZ(-200, 10, -40, 200, -20, light5);

const scene2 = [s2_ground, s2_backwall, s2_sphere1, s2_sphere2, s2_rightwall_light, s2_leftwall_light, s2_midwall];
const lighting2 = [];

const setup_02 = { scene: scene2, lighting: lighting2, camera: scene2_camera };
// ---------------------------------------------------------------//
// scene 2 -------------------------------------------------------//
const scene3_camera = new Camera(new Vector3(-4, 0, -30), new Vector3(1, 0, -40), new Vector3(0, 1, 0), 14, ratio);
// objects
const s3_sphere = new Sphere(new Vector3(0, 0, -40), 4, textured2);
const s3_light = new Sphere(new Vector3(0, 0, -30), 2.2, light6);

const scene3 = [s3_sphere, s3_light];
const lighting3 = [s3_light];

const setup_03 = { scene: scene3, lighting: lighting3, camera: scene3_camera };
// ---------------------------------------------------------------//
const setups = [setup_01, setup_02, setup_03];

// assign a scene camera to our master camera
camera = scene2_camera;

// assign a scene to the world
let world = scene2;

// create a master BVH container
let masterBVH = new BVH(world);

// create our lights array for sphere which emit light
let lights = lighting2; // for biased raytracing


//== define and manage page elements ==//
// our title (added to master control container)
const titleEl = document.createElement("h2");
titleEl.textContent = "js-tracer ::";
// get our main div and create a canvas element, and a loading element
const div = document.getElementById("canvas");
const canvas = document.createElement("canvas");
const loading = document.createElement("h1")
loading.className = "loading";
// define our canvas properties
canvas.textContent = "The raytracer is being rendered on this canvas.";
canvas.setAttribute("width", width);
canvas.setAttribute("height", height);

// add text to our loading "bar"
loading.textContent = "Loading...";
// add our loading bar to the page; we will add the canvas once loading is complete
div.appendChild(loading);

// grab our sub-headers and update them
const samplesPerSecondEl = document.getElementById("samples-per-second");
const samplesEl = document.getElementById("samples");
const depthEl = document.getElementById("depth");

// create resolution buttons
const masterControlEl = document.createElement("div");
masterControlEl.className = "master-container";
masterControlEl.appendChild(titleEl);
const buttonsEl = document.createElement("div");
buttonsEl.className = "button-container";

const xElContainer = document.createElement("div");
xElContainer.className = "input-container";
const xEl = document.createElement("input");
xEl.id = "xEl";
xEl.setAttribute("type", "number");
xEl.value = "320";
const xLabel = document.createElement("label");
xLabel.setAttribute("for", xEl.id);
xLabel.innerHTML = "width";
xElContainer.append(xLabel, xEl);

const yElContainer = document.createElement("div");
yElContainer.className = "input-container";
const yEl = document.createElement("input");
yEl.id = "yEl";
yEl.setAttribute("type", "number");
yEl.value = "240";
const yLabel = document.createElement("label");
yLabel.setAttribute("for", yEl.id);
yLabel.innerHTML = "height";
yElContainer.append(yLabel, yEl);

const depthInputContainer = document.createElement("div");
depthInputContainer.className = "input-container";
const depthInput = document.createElement("input");
depthInput.id = "depthInput";
depthInput.setAttribute("type", "number");
depthInput.value = "6";
const depthInputLabel = document.createElement("label");
depthInputLabel.setAttribute("for", depthInput.id);
depthInputLabel.innerHTML = "depth";
depthInputContainer.append(depthInputLabel, depthInput);

const submitEl = document.createElement("button");
submitEl.textContent = "update";
submitEl.addEventListener("click", () => {
  // update internal values
  width = parseInt(xEl.value);
  height = parseInt(yEl.value);
  globalDepth = parseInt(depthInput.value);

  // update our canvas
  resetCanvas();
});

// add buttons and divider to div
buttonsEl.append(xElContainer, yElContainer, depthInputContainer, submitEl);
// assemble scene buttons and add after divider
const sceneButtonContainer = document.createElement("div");
sceneButtonContainer.className = "button-container";
for (let i = 0; i < setups.length; i++) {
  const sceneButton = document.createElement("button");
  sceneButton.textContent = "scene" + (i + 1);

  sceneButton.addEventListener("click", () => {
    const swap = setups[i];

    camera = swap.camera;
    lights = swap.lighting;
    world = swap.scene;

    resetCanvas();
  });

  sceneButtonContainer.appendChild(sceneButton);
}
// add buttons element to page
masterControlEl.append(buttonsEl, sceneButtonContainer);
document.body.appendChild(masterControlEl);


//== prepare for rendering ==//
// get the context of our canvas in order to render to it
const context = canvas.getContext("2d");

// create the ImageData object to which we will render our pixels offscreen
let renderBuffer = context.createImageData(width, height);
// const displayBuffer = context.createImageData(width, height);
// wrap a function to call for our primary render loop
async function main() {
  // calc
  samplesPerSecondCalc();
  // update our on-page elements
  samplesEl.textContent = "samples: " + sample + " ::";
  depthEl.textContent = "ray depth: " + globalDepth + " ::";
  if (sample < maxSamples) {
    raytrace();
  }

  // update the on-browser image
  context.putImageData(renderBuffer, 0, 0);

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
  clock = new Date();
  const currentTimestamp = clock.getTime();

  delta += (currentTimestamp - oldTimestamp) / 1000 // current delta in seconds
  oldTimestamp = currentTimestamp;

  if (delta > 1) {
    const numSinceCheck = (sample - oldSamples);
    samplesPerSecondEl.textContent = "samples / second: " + numSinceCheck + " ::";
    oldSamples = sample;
    delta = 0;
  }
}

// moves the world
function moveObject(obj) {
  tick += 0.01;
  obj.origin.y += Math.sin(tick);
}

// reset the canvas based on a resoltuion change
function resetCanvas() {
  // clear data buffer and reset sample count
  renderBuffer = context.createImageData(width, height);
  oldSamples = 0;
  sample = 0;
  tick = 0;
  // change size of canvas and recalculate ratio
  ratio = width / height;
  camera.ratio = ratio;
  camera.regenUV();
  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);
}