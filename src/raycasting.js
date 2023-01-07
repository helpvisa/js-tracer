// defines functions which intersect a given ray with the world and get it to return a colour value
// old, single-object version of renderer
// 'world' is an object within the world
// function intersectWorldNormals(ray, world) {
//   // renders the normals of each object the ray hits within the world
//   const hit = world.hit(ray, 0, Infinity);
//   if (hit) {
//     return multiplyVector(hit.normal, 200);
//   }
//   return multiplyVector(ray.direction, 200);
// }

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

    return finalObj ? multiplyVector(finalObj.normal, 200) : multiplyVector(ray.direction, 200);
  }
  
  // return the ray direction if nothing is in the world
  return multiplyVector(ray.direction, 200);
}