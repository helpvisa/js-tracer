// test out our classes and display them to the console
let vec1 = new Vector3(3, -5, 4);
let vec2 = new Vector3(2, 6, 5);

console.log(normalizeVector(vec1));
console.log(crossVectors(vec1, vec2));
console.log(dotVectors(vec1, vec2));


//== variable declaration =//
// define the width and height of our canvas, and determine its aspect ratio
let width = 640;
let height = 480;
let ratio = width / height;


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
// disable image smoothing in this context
context.imageSmoothingEnabled = false;

// create the ImageData object to which we will render our pixels offscreen
const buffer = context.createImageData(width, height);
fillBuffer();


//== function declaration ==//
// fills the buffer with randomly coloured pixels
function fillBuffer() {
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
function getIndex(x, y, width) { //
  const redIndex = y * (width * 4) + x * 4;
  return redIndex;
}
