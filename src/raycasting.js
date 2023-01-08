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
        t_max = closestSoFar;
        finalObj = hit;
      }
    }

    return finalObj ? multiplyVector(finalObj.normal, 255) : multiplyVector(ray.direction, 255);
  }
  
  // return the ray direction if nothing is in the world
  return multiplyVector(ray.direction, 255);
}

// intersect with the world and return a single diffuse colour for all objects
function intersectWorldColour(ray, world, t_min, t_max, depth, colour = new Vector3(1, 1, 1)) {
  if (depth < 1) {
    return new Vector3(0, 0, 0);
  }

  let closestSoFar = t_max;
  let finalObj;

  if (world.length > 0) {
    for (let i = 0; i < world.length; i++) {
      const hit = world[i].hit(ray, t_min, t_max);
      if (hit) {
        closestSoFar = hit.t;
        t_max = closestSoFar;
        finalObj = hit;
      }
    }

    // if we have a hit registered, recursively cast more rays into the scene
    if (finalObj) {
      // set a new target for the recursively cast ray
      let target = addVectors(finalObj.point, finalObj.normal);
      let unitSphereVector = randomUnitSphereVector();
      unitSphereVector = normalizeVector(unitSphereVector);
      target = addVectors(target, unitSphereVector);
      const recursiveRay = new Ray(finalObj.point, subtractVectors(target, finalObj.point));
      return mixColours(colour, multiplyVector(intersectWorldColour(recursiveRay, world, 0.001, Infinity, depth - 1, colour), 0.5));
    } else {
      const dir = normalizeVector(ray.direction);
      const t = dir.y + 0.7;
      return addVectors(multiplyVector(new Vector3(50, 0, 50), t), multiplyVector(new Vector3(255, 255, 255), (1 - t)));
    }
  }

  // return the sky if nothing is in the world
  const dir = normalizeVector(ray.direction);
  const t = dir.y + 1;
  return addVectors(multiplyVector(new Vector3(0, 0, 0), t), multiplyVector(new Vector3(0, 0, 0), (1 - t)));
}

// intersect with the world and return colours based on the surface's material (full raytracing stack)
function intersectWorld(ray, world, t_min, t_max, depth) {
  if (depth < 1) {
    return new Vector3(0, 0, 0);
  }

  let closestSoFar = t_max;
  let finalObj;

  if (world.length > 0) {
    for (let i = 0; i < world.length; i++) {
      const hit = world[i].hit(ray, t_min, t_max);
      if (hit) {
        closestSoFar = hit.t;
        t_max = closestSoFar;
        finalObj = hit;
      }
    }

    // if we have a hit registered, recursively cast more rays into the scene
    if (finalObj) {
      let target;
      let unitSphereVector = randomUnitSphereVector();
      unitSphereVector = normalizeVector(unitSphereVector);
      let recursiveRay;

      // switch statement which determines how to mix the final colours
      switch (finalObj.material.type) {
        case 0:
          // set a new target for the recursively cast ray based on the material we are hitting
          target = addVectors(finalObj.point, finalObj.normal);
          target = addVectors(target, unitSphereVector);
          recursiveRay = new Ray(finalObj.point, subtractVectors(target, finalObj.point));

          // cast our recursive ray with the colour mixed in
          return mixColours(finalObj.material.colour, intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1));
          break;
        case 2:
          // set a new target for the recursively cast ray based on the material we are hitting
          target = addVectors(finalObj.point, finalObj.normal);
          target = addVectors(target, unitSphereVector);
          recursiveRay = new Ray(finalObj.point, subtractVectors(target, finalObj.point));

          // cast our ray
          return addVectors(multiplyVector(finalObj.material.colour, 255), mixColours(finalObj.material.colour, intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1)));
          break;
      }

    } else {
      const dir = normalizeVector(ray.direction);
      const t = dir.y + 0.7;
      return addVectors(multiplyVector(new Vector3(0, 0, 0), t), multiplyVector(new Vector3(100, 50, 50), (1 - t)));
    }
  }

  // return the sky if nothing is in the world
  const dir = normalizeVector(ray.direction);
  const t = dir.y + 1;
  return addVectors(multiplyVector(new Vector3(0, 0, 0), t), multiplyVector(new Vector3(255, 255, 255), (1 - t)));
}

// intersect with the world and return colours based on the surface's material (biased towards lights)
function intersectWorldLightBiased(ray, world, t_min, t_max, depth, lights) {
  if (depth < 1) {
    return new Vector3(0, 0, 0);
  }

  let closestSoFar = t_max;
  let finalObj;

  if (world.length > 0) {
    for (let i = 0; i < world.length; i++) {
      const hit = world[i].hit(ray, t_min, t_max);
      if (hit) {
        closestSoFar = hit.t;
        t_max = closestSoFar;
        finalObj = hit;
      }
    }

    // if we have a hit registered, recursively cast more rays into the scene
    if (finalObj) {
      // pick a random light source
      const idx = Math.floor(Math.random() * lights.length);
      let target = addVectors(lights[idx].origin, multiplyVector(randomVector(), lights[idx].radius * lights[idx].material.softness));
      const recursiveRay = new Ray(finalObj.point, subtractVectors(target, finalObj.point));

      // switch statement which determines how to mix the final colours
      switch (finalObj.material.type) {
        case 0: // basic diffuse surface
          // cast our recursive ray with the colour mixed in
          return mixColours(finalObj.material.colour, intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1));
          break;
        case 2: // lights
          // cast our ray
          return addVectors(multiplyVector(finalObj.material.colour, 255), mixColours(finalObj.material.colour, intersectWorldLightBiased(recursiveRay, world, 0.001, Infinity, depth - 1, lights)));
          break;
      }

    } else {
      const dir = normalizeVector(ray.direction);
      const t = dir.y + 0.7;
      return addVectors(multiplyVector(new Vector3(0, 0, 0), t), multiplyVector(new Vector3(100, 50, 50), (1 - t)));
    }
  }

  // return the sky if nothing is in the world
  const dir = normalizeVector(ray.direction);
  const t = dir.y + 1;
  return addVectors(multiplyVector(new Vector3(0, 0, 0), t), multiplyVector(new Vector3(255, 255, 255), (1 - t)));
}