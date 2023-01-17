// helper that creates and stores a random number generator using the seedrandom package
// available at: https://github.com/davidbau/seedrandom

// create our RNG object
const seed_rng =  new Math.seedrandom();
const rng = new alea(seed_rng()); // instantiate our random number generator