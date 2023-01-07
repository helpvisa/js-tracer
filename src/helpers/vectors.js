// normalize a given vector
function normalizeVector(vector) {
  const max = Math.max(Math.max(vector.x, vector.y), vector.z);
  
  // normalize and return a new Vector
  let returnVector = new Vector3(vector.x, vector.y, vector.z);
  returnVector.x = vector.x / max;
  returnVector.y = vector.y / max;
  returnVector.z = vector.z / max;

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
  vec.x *= n;
  vec.y *= n;
  vec.z *= n;

  return vec;
}

// divide a vector by a float or int
function divideVector(vec, n) {
  vec.x /= n;
  vec.y /= n;
  vec.z /= n;

  return vec;
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

// function for inverting a normal if it is not front-facing
function setFaceNormal(ray, normal) {
    let frontFace = dotVectors(ray.direction, normal) < 0;
    return frontFace ? normal : -normal;
}