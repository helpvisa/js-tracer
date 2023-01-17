// defines functions which intersect a given ray with the world and get it to return a colour value
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
      let target = new Vector3(0, 0, 0);
      let unitSphereVector = randomUnitSphereVector();
      let recursiveRay;
      let lightColour = new Vector3(0, 0, 0);
      let reflectionColour = new Vector3(0, 0, 0);
      let surfaceNormal;
      let cos_theta;
      let sin_theta;

      // texture colour var
      let texCol = finalObj.material.colour;
      if (finalObj.material.useTex) {
        let size = finalObj.material.textureSize;
        let noise = finalObj.material.texture.get(finalObj.u * size, finalObj.v * size);
        texCol = multiplyVector(finalObj.material.colour, noise);
      }

      // set variables here for importance sampling to be used in switch
      let area;
      let pdf = 1;
      let dist = 1;

      // switch statement which determines how to mix the final colours
      switch (finalObj.material.type) {
        // if it is diffuse
        case 0:
          // set a new target for the recursively cast ray based on the material we are hitting
          target = subtractVectors(finalObj.point, subtractVectors(finalObj.point, addVectors(finalObj.normal, unitSphereVector)));

          // perform a light importance check if lights exist and the material is illuminated by them
          if (lights.length > 0) {
            for (let i = 0; i < lights.length; i++) {
              if (rng() > 0.5) {
                area = lights[i].area();
                dist = distanceSquared(area, finalObj.point);
                let lightVec = subtractVectors(area, finalObj.point);
                let dot = dotVectors(lightVec, finalObj.normal);
                if (dot > 0) {
                  target = lightVec;
                  pdf = dist / (dot * lights[i].radius);
                }
              }
            }
          }

          // create our recursive ray now after pdf creation
          recursiveRay = new Ray(finalObj.point, target);
          return clampVector(divideVector(mixColours(texCol, multiplyVector(intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyTop, skyBottom), 0.5)), pdf), 0, 4880);
        // if it is purely reflective
        case 1:
          // skip our light pass, since this is pure reflection
          // set a new target based on a reflected vector
          surfaceNormal = finalObj.normal;
          // add randomness if the surface has a rough characteristic
          if (finalObj.material.roughness > 0) {
            surfaceNormal = addVectors(finalObj.normal, multiplyVector(unitSphereVector, finalObj.material.roughness * finalObj.material.roughness));
          }
          // reflect along surface normal
          target = reflectVector(ray.direction, surfaceNormal);
          recursiveRay = new Ray(finalObj.point, target);
          // cast our recursive ray
          // we do not multiply the returned ray by 0.5, since it is 'pure reflection' and thus loses no energy
          return mixColours(texCol, intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyTop, skyBottom));
        // if it is a light source
        case 2:
          return multiplyVector(texCol, finalObj.material.brightness);
        // if it is refractive
        case 3:
          // our refraction ratio (should be inverted if hits a back face realistically)
          const ratio = finalObj.frontFace ? 1 / finalObj.material.ior : finalObj.material.ior;
          // get our refracted vector and create our ray
          surfaceNormal = finalObj.normal;
          // add randomness to normal if the surface has a rough characteristic
          if (finalObj.material.roughness > 0) {
            surfaceNormal = addVectors(finalObj.normal, multiplyVector(unitSphereVector, finalObj.material.roughness * finalObj.material.roughness));
          }

          // determine if our material will actually refract
          cos_theta = Math.min(dotVectors(multiplyVector(ray.direction, -1), surfaceNormal), 1);
          sin_theta = Math.sqrt(1 - cos_theta * cos_theta);
          const cannotRefract = ratio * sin_theta > 1;

          // the dotVectors + math.random component simulates fresnel
          if (cannotRefract || reflectance(cos_theta, ratio) > rng()) {
            target = reflectVector(ray.direction, surfaceNormal);
          } else {
            target = refract(cos_theta, ray.direction, surfaceNormal, ratio);
          }
          recursiveRay = new Ray(finalObj.point, target);

          // cast our ray
          return mixColours(texCol, intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyTop, skyBottom));
        // if it is a polished material (diffuse with clear coat)
        case 4:
          // apply roughness scale to normal
          surfaceNormal = finalObj.normal;
          // add randomness to normal if the surface has a rough characteristic
          if (finalObj.material.roughness > 0) {
            surfaceNormal = addVectors(finalObj.normal, multiplyVector(unitSphereVector, finalObj.material.roughness * finalObj.material.roughness));
          }

          // determine if our material's polish will reflect at this point
          cos_theta = Math.min(dotVectors(multiplyVector(ray.direction, -1), surfaceNormal), 1);

          // set a new target for the recursively cast ray (reflection or diffuse)
          // add reflection + diffuse
          if (reflectance(cos_theta) > rng()) {
            target = reflectVector(ray.direction, surfaceNormal);
            recursiveRay = new Ray(finalObj.point, target);
            reflectionColour = intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyTop, skyBottom);
          }

          // set a new target for the recursively cast ray based on the material we are hitting
          target = subtractVectors(finalObj.point, subtractVectors(finalObj.point, addVectors(finalObj.normal, unitSphereVector)));
          
          // perform a light importance check if lights exist and the material is illuminated by them
          if (lights.length > 0) {
            for (let i = 0; i < lights.length; i++) {
              if (rng() > 0.5) {
                area = lights[i].area();
                dist = distanceSquared(area, finalObj.point);
                let lightVec = subtractVectors(area, finalObj.point);
                let dot = dotVectors(lightVec, finalObj.normal);
                if (dot > 0) {
                  target = lightVec;
                  pdf = dist / (dot * lights[i].radius);
                }
              }
            }
          }
          // create our recursive ray now after pdf creation
          recursiveRay = new Ray(finalObj.point, target);
          return clampVector(divideVector(addVectors(reflectionColour, mixColours(texCol, multiplyVector(intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyTop, skyBottom), 0.5))), pdf), 0, 4880);
      }
    }
  }

  // return the sky
  const dir = normalizeVector(ray.direction);
  const t = dir.y;
  return addVectors(multiplyVector(skyBottom, t), multiplyVector(skyTop, (1 - t))); // multiply by 255?
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