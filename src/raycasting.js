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
      let lightColour = new Vector3(0, 0, 0);
      let reflectionColour = new Vector3(0, 0, 0);
      let surfaceNormal;
      let cos_theta;
      let sin_theta;

      // switch statement which determines how to mix the final colours
      switch (finalObj.material.type) {
        // if it is diffuse
        case 0:
          // perform a light pass if lights exist and the material is illuminated by them
          if (lights) {
            lightColour = calculateLight(lights, finalObj);
          }
          // set a new target for the recursively cast ray based on the material we are hitting
          target = addVectors(finalObj.point, finalObj.normal);
          target = addVectors(target, unitSphereVector);
          recursiveRay = new Ray(finalObj.point, subtractVectors(target, finalObj.point));
          // cast our recursive ray with the colour mixed in
          return clampVector(addVectors(lightColour, multiplyVector(intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyTop, skyBottom), 0.5)), 0, 4880);
        // if it is purely reflective
        case 1:
          // skip our light pass, since this is pure reflection
          // set a new target based on a reflected vector
          surfaceNormal = finalObj.normal;
          // add randomness if the surface has a rough characteristic
          if (finalObj.material.roughness > 0) {
            surfaceNormal = addVectors(finalObj.normal, multiplyVector(randomVector(), finalObj.material.roughness * finalObj.material.roughness));
          }
          // reflect along surface normal
          target = reflectVector(ray.direction, surfaceNormal);
          recursiveRay = new Ray(finalObj.point, target);
          // cast our recursive ray
          // we do not multiply the returned ray by 0.5, since it is 'pure reflection' and thus loses no energy
          return mixColours(finalObj.material.colour, intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyTop, skyBottom));
        // if it is a light source
        case 2:
          return multiplyVector(finalObj.material.colour, 255 * finalObj.material.brightness);
        // if it is refractive
        case 3:
          // our refraction ratio (should be inverted if hits a back face realistically)
          const ratio = finalObj.frontFace ? 1 / finalObj.material.ior : finalObj.material.ior;
          // get our refracted vector and create our ray
          surfaceNormal = finalObj.normal;
          // add randomness to normal if the surface has a rough characteristic
          if (finalObj.material.roughness > 0) {
            surfaceNormal = addVectors(finalObj.normal, multiplyVector(randomVector(), finalObj.material.roughness * finalObj.material.roughness));
          }

          // determine if our material will actually refract
          cos_theta = Math.min(dotVectors(multiplyVector(ray.direction, -1), surfaceNormal), 1);
          sin_theta = Math.sqrt(1 - cos_theta * cos_theta);
          const cannotRefract = ratio * sin_theta > 1;

          // the dotVectors + math.random component simulates fresnel
          if (cannotRefract || reflectance(cos_theta, ratio) > -dotVectors(ray.direction, surfaceNormal) - Math.random()) {
            target = reflectVector(ray.direction, surfaceNormal);
          } else {
            target = refract(cos_theta, ray.direction, surfaceNormal, ratio);
          }
          recursiveRay = new Ray(finalObj.point, target);

          // cast our ray
          return mixColours(finalObj.material.colour, intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyTop, skyBottom));
        // if it is a polished material (diffuse with clear coat)
        case 4:
          // perform a light pass if lights exist and the material is illuminated by them
          if (lights) {
            lightColour = calculateLight(lights, finalObj);
          }
          
          // apply roughness scale to normal
          surfaceNormal = finalObj.normal;
          // add randomness to normal if the surface has a rough characteristic
          if (finalObj.material.roughness > 0) {
            surfaceNormal = addVectors(finalObj.normal, multiplyVector(randomVector(), finalObj.material.roughness * finalObj.material.roughness));
          }

          // determine if our material's polish will reflect at this point
          cos_theta = Math.min(dotVectors(multiplyVector(ray.direction, -1), surfaceNormal), 1);

          // set a new target for the recursively cast ray (reflection or diffuse)
          // add reflection + diffuse
          if (reflectance(cos_theta) > -dotVectors(ray.direction, surfaceNormal) - Math.random()) {
            target = reflectVector(ray.direction, surfaceNormal);
            recursiveRay = new Ray(finalObj.point, target);
            reflectionColour = intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyTop, skyBottom);
          }

          target = addVectors(finalObj.point, finalObj.normal);
          target = addVectors(target, unitSphereVector);
          recursiveRay = new Ray(finalObj.point, subtractVectors(target, finalObj.point));
          return clampVector(addVectors(reflectionColour, addVectors(lightColour, multiplyVector(intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyTop, skyBottom), 0.5))), 0, 4880);
      }
    }
  }

  // return the sky
  const dir = normalizeVector(ray.direction);
  const t = dir.y;
  return addVectors(multiplyVector(skyBottom, t), multiplyVector(skyTop, (1 - t)));
}

// used inside a material when it responds to light
function calculateLight(lights, obj) {
  // perform a light pass if lights exist and the material is illuminated by them
  // this should be branched into its own function
  let lightColour = new Vector3(0, 0, 0);
  let numLights = lights.length;
  lightColour = new Vector3(0, 0, 0);
  // iterate through light sources
  for (let i = 0; i < numLights; i++) {
    let target = lights[i].origin;
    target = addVectors(target, multiplyVector(normalizedRandomVector(), lights[i].radius));
    const rayDir = subtractVectors(target, obj.point);

    // get the dot of normal - light; only cast ray if it can actually hit light
    const dot = dotVectors(rayDir, obj.normal);
    if (dot >= 0) {
      const recursiveRay = new Ray(obj.point, rayDir);
      lightColour = addVectors(lightColour, multiplyVector(intersectLight(recursiveRay, world, 0.001, Infinity), 255));
    }
  }
  lightColour = mixColours(obj.material.colour, lightColour);
  return lightColour;
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
        return multiplyVector(multiplyVector(finalObj.material.colour, finalObj.material.brightness), (1 / (distanceBetween(finalObj.point, ray.origin) / 10)));
      }
    }
  }
  // return the void
  return new Vector3(0, 0, 0);
}

// used to refract a ray
function refract(cos_theta, dir, normal, ratio) {
  dir = normalizeVector(dir);
  const perpendicular = multiplyVector(addVectors(dir, multiplyVector(normal, cos_theta)), ratio);
  const parallel = multiplyVector(normal, -Math.sqrt(Math.abs(1 - magnitudeSquared(perpendicular))));
  return addVectors(perpendicular, parallel);
}

// calculate reflectance based on normal (schlick approximation)
function reflectance(cos_theta, ior = 1.52) {
  let r = (1 - ior) / (1 + ior);
  r *= r; // square r
  return r + (1 - r) * Math.pow((1 - cos_theta), 5);
}