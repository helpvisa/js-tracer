// defines functions which intersect a given ray with the world and get it to return a colour value
// intersect with the world and return colours based on the surface's material (full raytracing stack)
function intersectWorld(ray, world, t_min, t_max, depth, lights, skyCol, useSkybox) {
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
      let cos_theta;
      let sin_theta;

      // texture colour var
      let texCol = finalObj.material.colour;
      let roughness = finalObj.material.roughness;
      let metalness = finalObj.material.metalness;
      let normal = finalObj.normal;
      // calc texture values
      // check for a diffuse texture map
      if (finalObj.material.diffuseTex) {
        if (finalObj.material.diffNoise) {
          const diffSize = finalObj.material.diffSize;
          const diffNoise = finalObj.material.diffuseTex.get(finalObj.u * diffSize, finalObj.v * diffSize);
          texCol = multiplyVector(finalObj.material.colour, diffNoise);
        } else {
          const texData = finalObj.material.diffuseTex.getPixel(finalObj.u * finalObj.material.tilingX, finalObj.v * finalObj.material.tilingY);
          texCol = mixColours(texCol, new Vector3(texData.r, texData.g, texData.b));
        }
      }
      // check for a roughess map
      if (finalObj.material.roughnessTex) {
        if (finalObj.material.roughNoise) {
          const roughSize = finalObj.material.roughSize;
          const roughNoise = finalObj.material.roughnessTex.get(finalObj.u * roughSize, finalObj.v * roughSize);
          roughness = roughness * roughNoise;
        } else {
          const texData = finalObj.material.roughnessTex.getPixel(finalObj.u * finalObj.material.tilingX, finalObj.v * finalObj.material.tilingY);
          roughness = texData.r * roughness;
        }
      }
      // check for a normal map
      if (finalObj.material.normalTex) {
        if (finalObj.material.normNoise) {
          const normSize = finalObj.material.roughSize;
          const normXNoise = finalObj.material.normalTex.x.get(finalObj.u * normSize, finalObj.v * normSize);
          const normYNoise = finalObj.material.normalTex.y.get(finalObj.u * normSize, finalObj.v * normSize);
          normal.x += (normXNoise * 2 - 1) * finalObj.material.normalMult;
          normal.y += (normYNoise * 2 - 1) * finalObj.material.normalMult;
        } else {
          // acquire our normalmap data
          const texData = finalObj.material.normalTex.getPixel(finalObj.u * finalObj.material.tilingX, finalObj.v * finalObj.material.tilingY);
          let texNormal = new Vector3(texData.r, texData.g, texData.b);
          // find our tangent space
          let t = crossVectors(normal, new Vector3(0, 1, 0));
          if (!magnitudeSquared(t)) {
            t = crossVectors(normal, new Vector3(0, 0, 1));
          }
          t = normalizeVector(t);
          let b = normalizeVector(crossVectors(normal, t));
          // take our normal texture and convert it to -1 to 1 space
          texNormal = subtractVectors(multiplyVector(texNormal, 2), new Vector3(1, 1, 1));
          texNormal.x *= -finalObj.material.normalMult;
          texNormal.y *= finalObj.material.normalMult;
          // add our tangent normal to our world normal using matrix -> vector multiplication
          let tbn = new Matrix3(t, b, normal);
          normal = normalizeVector(matMult(tbn, texNormal));
        }
      }
      // check for a metalness map
      if (finalObj.material.metalTex) {
        const texData = finalObj.material.metalTex.getPixel(finalObj.u * finalObj.material.tilingX, finalObj.v * finalObj.material.tilingY);
        metalness = texData.r * metalness;
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
          target = subtractVectors(finalObj.point, subtractVectors(finalObj.point, addVectors(normal, unitSphereVector)));

          // perform a light importance check if lights exist and the material is illuminated by them
          if (lights.length > 0) {
            for (let i = 0; i < lights.length; i++) {
              if (rng() > 0.5) {
                area = lights[i].area();
                dist = distanceSquared(area, finalObj.point);
                let lightVec = subtractVectors(area, finalObj.point);
                let dot = dotVectors(lightVec, normal);
                if (dot > 0) {
                  target = lightVec;
                  pdf = dist / (dot * lights[i].radius);
                }
              }
            }
          }

          // create our recursive ray now after pdf creation
          recursiveRay = new Ray(finalObj.point, target);
          return clampVector(divideVector(mixColours(texCol, multiplyVector(intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyCol, useSkybox), 0.5)), pdf), 0, 4880);
        // if it is purely reflective
        case 1:
          // skip our light pass, since this is pure reflection
          // set a new target based on a reflected vector
          // add randomness if the surface has a rough characteristic
          if (roughness > 0) {
            normal = addVectors(normal, multiplyVector(unitSphereVector, roughness));
          }
          // reflect along surface normal
          target = reflectVector(ray.direction, normal);
          recursiveRay = new Ray(finalObj.point, target);
          // cast our recursive ray
          // we do not multiply the returned ray by 0.5, since it is 'pure reflection' and thus loses no energy
          return mixColours(texCol, intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyCol, useSkybox));
        // if it is a light source
        case 2:
          return multiplyVector(texCol, finalObj.material.brightness);
        // if it is refractive
        case 3:
          // our refraction ratio (should be inverted if hits a back face realistically)
          const ratio = finalObj.frontFace ? 1 / finalObj.material.ior : finalObj.material.ior;
          // get our refracted vector and create our ray
          // add randomness to normal if the surface has a rough characteristic
          if (roughness > 0) {
            normal = addVectors(normal, multiplyVector(unitSphereVector, roughness));
          }

          // determine if our material will actually refract
          cos_theta = Math.min(dotVectors(multiplyVector(ray.direction, -1), normal), 1);
          sin_theta = Math.sqrt(1 - cos_theta * cos_theta);
          const cannotRefract = ratio * sin_theta > 1;

          // the dotVectors + math.random component simulates fresnel
          if (cannotRefract || reflectance(cos_theta, ratio) > rng()) {
            target = reflectVector(ray.direction, normal);
          } else {
            target = refract(cos_theta, ray.direction, normal, ratio);
          }
          recursiveRay = new Ray(finalObj.point, target);

          // cast our ray
          return mixColours(texCol, intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyCol, useSkybox));
        // if it is a polished material (diffuse with clear coat)
        case 4:
          // apply roughness scale to normal
          // add randomness to normal if the surface has a rough characteristic
          if (roughness > 0) {
            normal = addVectors(normal, multiplyVector(unitSphereVector, roughness));
          }

          // determine if our material's polish will reflect at this point
          cos_theta = Math.min(dotVectors(multiplyVector(ray.direction, -1), normal), 1);

          // set a new target for the recursively cast ray (reflection or diffuse)
          // add reflection + diffuse
          if (reflectance(cos_theta) > rng()) {
            target = reflectVector(ray.direction, normal);
            recursiveRay = new Ray(finalObj.point, target);
            reflectionColour = intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyCol, useSkybox);
          }

          // set a new target for the recursively cast ray based on the material we are hitting
          target = subtractVectors(finalObj.point, subtractVectors(finalObj.point, addVectors(normal, unitSphereVector)));
          
          // perform a light importance check if lights exist and the material is illuminated by them
          if (lights.length > 0) {
            for (let i = 0; i < lights.length; i++) {
              if (rng() > 0.5) {
                area = lights[i].area();
                dist = distanceSquared(area, finalObj.point);
                let lightVec = subtractVectors(area, finalObj.point);
                let dot = dotVectors(lightVec, normal);
                if (dot > 0) {
                  target = lightVec;
                  pdf = dist / (dot * lights[i].radius);
                }
              }
            }
          }
          // create our recursive ray now after pdf creation
          recursiveRay = new Ray(finalObj.point, target);
          return clampVector(divideVector(addVectors(reflectionColour, mixColours(texCol, multiplyVector(intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyCol, useSkybox), 0.5))), pdf), 0, 4880);
        case 5:
          // amount to mix our reflection with the metal colour at this point
          let diffMixFactor = 1 - metalness;
          let refMixFactor;
          // preset our willReflect var to false so we can skip a calculation later if possible
          let willReflect = false;
          
          // apply roughness scale to normal
          // add randomness to normal if the surface has a rough characteristic
          if (roughness > 0) {
            normal = addVectors(normal, multiplyVector(unitSphereVector, roughness));
          }

          // get our reflection information
          if (metalness < 1) {
            cos_theta = Math.min(dotVectors(multiplyVector(ray.direction, -1), normal), 1);
            willReflect = reflectance(cos_theta) > rng();
          }
          // use the will reflect bool to create a mix factor for our non-metal reflections
          refMixFactor = willReflect ? diffMixFactor : 0;
          // calc our reflection ray if necessary
          if (willReflect || metalness > 0) {
            target = reflectVector(ray.direction, normal);
            recursiveRay = new Ray(finalObj.point, target);
            reflectionColour = intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyCol, useSkybox);
          }

          // set a new target for the recursively cast ray based on the material we are hitting
          target = subtractVectors(finalObj.point, subtractVectors(finalObj.point, addVectors(normal, unitSphereVector)));
          
          // perform a light importance check if lights exist and the material is illuminated by them
          if (lights.length > 0) {
            for (let i = 0; i < lights.length; i++) {
              if (rng() > 0.5) {
                area = lights[i].area();
                dist = distanceSquared(area, finalObj.point);
                let lightVec = subtractVectors(area, finalObj.point);
                let dot = dotVectors(lightVec, normal);
                if (dot > 0) {
                  target = lightVec;
                  pdf = dist / (dot * lights[i].radius);
                }
              }
            }
          }
          // create our recursive ray now after pdf creation
          recursiveRay = new Ray(finalObj.point, target);
          let mainColour = clampVector(divideVector(mixColours(texCol, multiplyVector(intersectWorld(recursiveRay, world, 0.001, Infinity, depth - 1, lights, skyCol, useSkybox), 0.5)), pdf), 0, 4880);

          // mix our reflection and dielectric colours and add them
          reflectionColour = addVectors(multiplyVector(mixColours(reflectionColour, texCol), metalness), multiplyVector(reflectionColour, refMixFactor));
          mainColour = multiplyVector(mainColour, diffMixFactor);
          // return our new mixed colours
          return addVectors(mainColour, reflectionColour);
      }
    }
  }

  // return the sky
  if (!useSkybox) {
    return skyCol;
  } else {
    // return the skybox
    const pi = Math.PI;
    const dir = ray.direction;
    const theta = Math.acos(-dir.y);
    const phi = Math.atan2(-dir.z, dir.x) + pi;
    const u = phi / (2 * pi);
    const v = theta / pi;
    const skyData = skybox.getPixel(u, v);
    let mult = 255;
    return new Vector3(skyData.r * mult, skyData.g * mult, skyData.b * mult);
  }
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