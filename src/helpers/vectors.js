// normalize a given vector
function normalizeVector(vector) {
  const magnitude = Math.sqrt(magnitudeSquared(vector));
  
  // normalize and return a new Vector
  let returnVector = divideVector(vector, magnitude);

  return returnVector;
}

// add a vector with another vector
function addVectors(vec1, vec2) {
  let returnVector = new Vector3(0, 0, 0);
  returnVector.x = vec1.x + vec2.x;
  returnVector.y = vec1.y + vec2.y;
  returnVector.z = vec1.z + vec2.z;

  return returnVector;
}

// subtract a vector from another vector
function subtractVectors(vec1, vec2) {
  let returnVector = new Vector3(0, 0, 0);
  returnVector.x = vec1.x - vec2.x;
  returnVector.y = vec1.y - vec2.y;
  returnVector.z = vec1.z - vec2.z;

  return returnVector;
}

// multiply a vector with a float or int
function multiplyVector(vec, n) {
  let returnVector = new Vector3(vec.x, vec.y, vec.z);

  returnVector.x *= n;
  returnVector.y *= n;
  returnVector.z *= n;

  return returnVector;
}

// divide a vector by a float or int
function divideVector(vec, n) {
  let returnVector = new Vector3(vec.x, vec.y, vec.z);

  if (n !== 0) {
    returnVector.x /= n;
    returnVector.y /= n;
    returnVector.z /= n;
  }

  return returnVector;
}

// find the cross product of two given vectors
function crossVectors(vec1, vec2) {
  let returnVector = new Vector3(0, 0, 0);

  returnVector.x = vec1.y * vec2.z - vec1.z * vec2.y;
  returnVector.y = vec1.z * vec2.x - vec1.x * vec2.z;
  returnVector.z = vec1.x * vec2.y - vec1.y * vec2.x;

  return returnVector;
}

// find the dot product of two given vectors
function dotVectors(vec1, vec2) {
  let product = 0;

  product =
    vec1.x * vec2.x +
    vec1.y * vec2.y +
    vec1.z * vec2.z;
  
  return product;
}

// find the distance between two vectors
function distanceBetween(vec1, vec2) {
  let dx = vec2.x - vec1.x;
  let dy = vec2.y - vec1.y;
  let dz = vec2.z - vec1.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// find the squared distance between two vectors
function distanceSquared(vec1, vec2) {
  let dx = vec2.x - vec1.x;
  let dy = vec2.y - vec1.y;
  let dz = vec2.z - vec1.z;

  return dx * dx + dy * dy + dz * dz;
}

// find the squared magnitude of the vectors
function magnitudeSquared(vec) {
  const xsqr = vec.x * vec.x;
  const ysqr = vec.y * vec.y;
  const zsqr = vec.z * vec.z;

  return xsqr + ysqr + zsqr;
}

// reflect a vector along another vector (the normal)
function reflectVector(vec, normal) {
  let returnVector = new Vector3(0, 0, 0);

  returnVector = subtractVectors(vec, multiplyVector(normal, dotVectors(normal, vec) * 2));

  return returnVector;
}

// function for inverting a normal if it is not front-facing
// this is broken; cannot simply flip my custom class, need a custom implementation
function setFaceNormal(ray, normal) {
    let frontFace = dotVectors(ray.direction, normal) < 0;

    if (frontFace) {
      return {
        normal: normal,
        front: true
      };
    } else {
      normal.x *= -1;
      normal.y *= -1;
      normal.z *= -1;
      return {
        normal: normal,
        front: false
      };
    }
}

// clamp a vector's values within a range (useful for colours)
function clampVector(vec, min, max) {
  let returnVector = vec;
  returnVector.x = clamp(returnVector.x, min, max);
  returnVector.y = clamp(returnVector.y, min, max);
  returnVector.z = clamp(returnVector.z, min, max);

  return returnVector;
}

//== generate and return random vectors ==//
// generate a random vector
function randomVector() {
  return new Vector3(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1);
}

function normalizedRandomVector() {
  let returnVector = randomVector();
  returnVector = normalizeVector(returnVector);
  return returnVector;
}

// generate a random unit sphere vector
function randomUnitSphereVector() {
  while (true)
    {
      let p = randomVector();
      if (distanceSquared(p, new Vector3(0,0,0)) >=1) continue;
      return p;
    }
}

//== colour mixing functions ==//
function mixColours(col1, col2) {
  let returnVector = new Vector3(0, 0, 0);

  returnVector.x = col1.x * col2.x;
  returnVector.y = col1.y * col2.y;
  returnVector.z = col1.z * col2.z;

  return returnVector;
}

//== matrix multiplication function ==//
function matMult(mat, vec) {
  let a = dotVectors(mat.a, vec);
  let b = dotVectors(mat.b, vec);
  let c = dotVectors(mat.c, vec);

  return new Vector3(a, b, c);
}