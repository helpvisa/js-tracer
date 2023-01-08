// convert a given angle in degrees to radians
function toRadians(degrees) {
  return degrees * (Math.PI/180);
}

// clamp a given value
function clamp(val, min, max) {
  return Math.max(min, Math.min(val, max));
}