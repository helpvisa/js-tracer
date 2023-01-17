// defines a set of classes which can be used to change the appearance of surfaces
class Material {
  constructor(type = 0, colour = new Vector3(1, 1, 1), perlin = false, perlinSize = 16) {
    // types are 0 = diffuse, 1 = reflective, 2 = light, 3 = refractive, 4 = polished
    this.type = type;
    this.colour = colour;
    this.perlin = perlin;
    if (this.perlin) {
      // diffuse colour
      this.diffSize = perlinSize;
      this.diffuseTex = new Perlin(perlinSize); // store a perlin noise texture within the material at a fixed size
      // roughness map
      this.roughSize = perlinSize;
      this.roughnessTex = new Perlin(perlinSize);
      // normal map (2 channels)
      this.normalTex = {
        x: new Perlin(perlinSize),
        y: new Perlin(perlinSize)
      };
      this.normalMult = 1;
    }

    // create new keys based on material type
    switch (this.type) {
      // if it is reflective
      case 1:
        this.roughness = 0; // a value that determines the roughness of the surface reflection
        break;
      case 2:
        this.brightness = 500; // multiplier for overall brightness
      case 3:
        this.roughness = 0; // a value that determines the roughness of the surface refraction
        this.ior = 1.52; // a value that determines the index of refraction
        break;
      case 4:
        this.roughness = 0; // roughness of surface reflection
    }
  }
}