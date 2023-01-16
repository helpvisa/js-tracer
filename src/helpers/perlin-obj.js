// create a perlin obj for random generation
// accessible from other scripts since it is loaded first
const perlinSize = 16;
let perlin = new Perlin(perlinSize);