// defines functions which intersect a given ray with the world and get it to return a colour value
// intersect with the world and display the normals of all the objects hit
function intersectWorldNormals(ray, world, t_min, t_max) {
  // world is a list of our surfaces; let's iterate through it and check our ray collisions
  let rayCollided = false;
  let closestSoFar = t_max; // set a max distance for our ray
  let finalObj; // an object to store the location / material of our last ray's collision point

  if (world.length > 0) {
    for (let i = 0; i < world.length; i++) {
      const hit = world[i].hit(ray, t_min, t_max);
      if (hit) {
        rayCollided = true;
        closestSoFar = hit.t;
        finalObj = hit;
      }
    }

    return finalObj ? multiplyVector(finalObj.normal, 255) : multiplyVector(ray.direction, 255);
  }
  
  // return the ray direction if nothing is in the world
  return multiplyVector(ray.direction, 255);
}

// intersect with the world and return a single diffuse colour
function intersectWorldColour(ray, world, t_min, t_max, colour = new Vector3(1, 1, 1), depth) {
  if (depth < 1) {
    return colour;
  }

  let closestSoFar = t_max;
  let finalObj;

  if (world.length > 0) {
    for (let i = 0; i < world.length; i++) {
      const hit = world[i].hit(ray, t_min, t_max);
      if (hit) {
        closestSoFar = hit.t;
        finalObj = hit;
      }
    }

    // if we have a hit registered, recursively cast more rays into the scene
    if (finalObj) {
      // set a new target for the recursively cast ray
      const target = addVectors(finalObj.point, finalObj.normal);
      const recursiveRay = new Ray(finalObj.point, subtractVectors(target, finalObj.point));
      return intersectWorldColour(recursiveRay, world, 0, Infinity, colour, depth - 1);
    } else {
      return multiplyVector(ray.direction, 255);
    }
  }

  // return the ray direction if nothing is in the world
  return multiplyVector(ray.direction, 255);
}