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
function intersectWorld(ray, world, t_min, t_max, depth, lights, skyTop, skyBottom) {
  if (depth < 1) {
    return new Vector3(0, 0, 0);
  }

  let finalObj;

  if (world.length > 0) {
    for (let i = 0; i < world.length; i++) {
      const hit = world[i].hit(ray, t_min, t_max);
      if (hit) {
        t_max = hit.t;
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
        // if it is diffuse
        case 0:
          // perform a light pass if lights exist and the material is illuminated by them
          // this should be branched into its own function
          let lightColour = new Vector3(0, 0, 0);
          if (lights) {
            let numLights = lights.length;
            lightColour = new Vector3(0, 0, 0);
            // iterate through light sources
            for (let i = 0; i < numLights; i++) {
              let target = lights[i].origin;
              target = addVectors(target, multiplyVector(normalizedRandomVector(), lights[i].radius));
              const rayDir = subtractVectors(target, finalObj.point);

              // get the dot of normal - light; only cast ray if it can actually hit light
              const dot = dotVectors(rayDir, finalObj.normal);
              if (dot >= 0) {
                const recursiveRay = new Ray(finalObj.point, rayDir);
                lightColour = addVectors(lightColour, multiplyVector(intersectLight(recursiveRay, world, 0.001, Infinity), 255));
              }
            }
            lightColour = clampVector(mixColours(finalObj.material.colour, lightColour), 0, 255);
          }

          // set a new target for the recursively cast ray based on the material we are hitting
          target = addVectors(finalObj.point, finalObj.normal);
          target = addVectors(target, unitSphereVector);
          recursiveRay = new Ray(finalObj.point, subtractVectors(target, finalObj.point));

          // cast our recursive ray with the colour mixed in
          return clampVector(addVectors(lightColour, multiplyVector(intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyTop, skyBottom), 0.5)), 0, 255);
        // if it is purely reflective
        case 1:
          // skip our light pass, since this is pure reflection

          // set a new target based on a reflected vector
          let surfaceNormal = finalObj.normal;
          // add randomness if the surface has a rough characteristic
          if (finalObj.material.roughness > 0) {
            surfaceNormal = addVectors(finalObj.normal, multiplyVector(randomVector(), finalObj.material.roughness * finalObj.material.roughness));
          }

          target = reflectVector(ray.direction, surfaceNormal);
          recursiveRay = new Ray(finalObj.point, target);
          // cast our recursive ray
          // we do not multiply the returned ray by 0.5, since it is 'pure reflection' and thus loses no energy
          return clampVector(mixColours(finalObj.material.colour, intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyTop, skyBottom)), 0, 255);
        // if it is a light source
        case 2:
          // set a new target for the recursively cast ray based on the material we are hitting
          target = addVectors(finalObj.point, finalObj.normal);
          target = addVectors(target, unitSphereVector);
          recursiveRay = new Ray(finalObj.point, subtractVectors(target, finalObj.point));

          // cast our ray
          return multiplyVector(finalObj.material.colour, 255);
      }
    }
  }

  // return the sky
  const dir = normalizeVector(ray.direction);
  const t = dir.y;
  return addVectors(multiplyVector(skyBottom, t), multiplyVector(skyTop, (1 - t)));
}

// used to cast only to rays
function intersectLight(ray, world, t_min, t_max) {
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

    if (finalObj) {
      // is this obj a light?
      if (finalObj.material.type === 2) {
        return finalObj.material.colour;
      }
    }
  }
  // return the void
  return new Vector3(0, 0, 0);
}