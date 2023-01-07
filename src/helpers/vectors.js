// normalize a given vector
function normalizeVector(vector) {
  const max = Math.max(Math.max(Math.abs(vector.x), Math.abs(vector.y)), Math.abs(vector.z));
  
  // normalize and return a new Vector
  let returnVector = new Vector3(vector.x, vector.y, vector.z);
  if (max !== 0) {
    returnVector.x /= max;
    returnVector.y /= max;
    returnVector.z /= max;
  }

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

// function for inverting a normal if it is not front-facing
// this is broken; cannot simply flip my custom class, need a custom implementation
function setFaceNormal(ray, normal) {
    let frontFace = dotVectors(ray.direction, normal) < 0;

    if (frontFace) {
      return normal;
    } else {
      normal.x *= -1;
      normal.y *= -1;
      normal.z *= -1;
      return normal;
    }
}