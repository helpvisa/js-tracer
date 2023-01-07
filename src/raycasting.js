// defines functions which intersect a given ray with the world and get it to return a colour value
// 'world' is an array of all our objects within the world
function intersectWorldNormals(ray, world) {
  // renders the normals of each object the ray hits within the world
  const hit = world.hit(ray, 0, Infinity);
  if (hit) {
    return multiplyVector(hit.normal, 200);
  }
  return multiplyVector(ray.direction, 200);
}