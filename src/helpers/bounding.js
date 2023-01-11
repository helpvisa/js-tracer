// functions that aid in the creation of AABB bounding boxes
// primarily for lists of multiple world surfaces

function surroundingBox(bounds1, bounds2) {
  let small = new Vector3(Math.min(bounds1.min.x, bounds2.min.x),
                          Math.min(bounds1.min.y, bounds2.min.y),
                          Math.min(bounds1.min.z, bounds2.min.z));
  
  let big = new Vector3(Math.max(bounds1.max.x, bounds2.max.x),
                        Math.max(bounds1.max.y, bounds2.max.y),
                        Math.max(bounds1.max.z, bounds2.max.z));
  
  return new AABB(big, small);
}