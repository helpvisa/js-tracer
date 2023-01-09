// defines a set of classes which can be used to change the appearance of surfaces
class Material {
  constructor(type = 0, colour = new Vector3(1, 1, 1)) {
    // types are 0 = diffuse, 1 = reflective, 2 = light
    this.type = type;
    this.colour = colour;

    // create new keys based on material type
    switch (this.type) {
      // if it is reflective
      case 1:
        this.roughness = 0; // a value that determines the roughness of the surface reflection
        break;
    }
  }
}