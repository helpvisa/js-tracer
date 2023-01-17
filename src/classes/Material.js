// defines a set of classes which can be used to change the appearance of surfaces
class Material {
  constructor(type = 0, colour = new Vector3(1, 1, 1), useTex = false, textureSize = 8) {
    // types are 0 = diffuse, 1 = reflective, 2 = light, 3 = refractive, 4 = polished
    this.type = type;
    this.colour = colour;
    this.useTex = useTex;
    if (this.useTex) {
      this.textureSize = textureSize; // size of perlin texture
      this.texture = new Perlin(this.textureSize); // store a perlin noise texture within the material at a fixed size
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