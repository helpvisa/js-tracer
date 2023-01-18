// defines a set of classes which can be used to change the appearance of surfaces
class Material {
  constructor(type = 0, colour = new Vector3(1, 1, 1), diffNoise = false, roughNoise = false, normNoise = false, perlinSize = 32) {
    // types are 0 = diffuse, 1 = reflective, 2 = light, 3 = refractive, 4 = polished, 5 = full pbr
    this.type = type;
    this.colour = colour;
    this.diffNoise = diffNoise;
    this.roughNoise = roughNoise;
    this.normNoise = normNoise;
    this.normalMult = 1;
    this.tilingX = 3;
    this.tilingY = 3;
    // create an undefined key for our metalTex
    this.metalTex = null;

    // set our noise maps if they are used
    if (this.diffNoise) {
      // diffuse colour
      this.diffSize = perlinSize;
      this.diffuseTex = new Perlin(perlinSize); // store a perlin noise texture within the material at a fixed size
    }
    if (this.roughNoise) {
      // roughness map
      this.roughSize = perlinSize;
      this.roughnessTex = new Perlin(perlinSize);
    }
    if (this.normNoise) {
      // normal map (2 channels)
      this.normalTex = {
        x: new Perlin(perlinSize),
        y: new Perlin(perlinSize)
      };
    }

    // create new keys based on material type
    switch (this.type) {
      // if it is reflective
      case 1:
        if (this.roughnessTex) {
          this.roughness = 1; // a value that determines the roughness of the surface reflection
        } else {
          this.roughness = 0;
        }
        break;
      case 2:
        this.brightness = 1000; // multiplier for overall brightness
      case 3:
        if (this.roughnessTex) {
          this.roughness = 1; // a value that determines roughness of the surface refraction
        } else {
          this.roughness = 0;
        }
        this.ior = 1.52; // a value that determines the index of refraction
        break;
      case 4:
        if (this.roughnessTex) {
          this.roughness = 1; // roughness of surface reflection
        } else {
          this.roughness = 0;
        }
        break;
      case 5:
        if (this.roughnessTex) {
          this.roughness = 1;
        } else {
          this.roughness = 0;
        }
        if (this.metalTex) {
          this.metalness = 1;
        } else {
          this.metalness = 0;
        }
    }
  }
}