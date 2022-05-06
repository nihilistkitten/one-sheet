//
// cloth.js
//
// Author: Jim Fix
// CSCI 385, Reed College, Spring 2022
//
// This defines a class `Cloth` that is made up of a grid of particle
// objects (each of type `Mass`) connected up pairwise by `Spring`
// objects.
//
// The cloth can be `reset` to its initial configuration, and then its
// movement can be simulated by a series of `update` steps.
//
// The simulation can be controlled by three boolean settings:
//  - gGravityOn : Should the cloth masses be affected by gravity?
//  - gWindOn : Is there any wind blowing the cloth?
//  - gConstraintOn : Should spring deformation be constrained?
//
// There are also a collection of simulation parameters that can be
// tweaked, but are currently set to values that work well for the
// proposed solution.
//
// ========
//
// the primary ASSIGNMENT
//
// Make the physical simulation of a Cloth instance work. To do this,
// you will write the code for:
//
//  * Mass.saveState
//  * Mass.computeStep
//  * Mass.computeAcceleration
//  * Spring.computeForce
//  * Spring.constrain
//
// These are described in the assignment document.
//
// ========

// Simulation parameters.
//
let gTimeStep = 1.0 / 200.0;
//
let gDeformation = 1.2;
let gGravity = 9.8;
let gFriction = 0.9;
let gDrag = 0.9;
let gStiffness = 5000.0;
let gBend = 0.333;
let gWind = 100.0;

// Simulation state.
//
let gGravityOn = true;
let gWindOn = false;
let gConstraintOn = true;

// Cloth rendering.
//
let gClothTop = 1.0;
let gClothHeight = 1.0;
let gClothWidth = 1.5;

//
// Mass
//
// Class defining a particle that has a position and velocity,
// and is connected to other masses with springs.
//
// A mass can be `fixed`, meaning its position does not change.
//
class Mass {
  constructor(mass0, position0) {
    /*
     * Construct a particle with the given mass and starting position,
     * connected to no other masses with springs.
     *
     */
    this.mass = mass0;
    this.position0 = position0;
    this.reset();
    //
    this.fixed = false; // Does the particle move?
    this.springs = []; // What other masses is it connected to?
  }

  addSpring(spring) {
    /*
     * Connect this mass to another with a spring.
     */
    this.springs.push(spring);
  }

  reset() {
    /*
     * Reset the simulation state of the particle, namely its
     * position and velocity.
     *
     * You may need to reset your other simulation state.
     */
    this.position = this.position0;
    this.lastPosition = this.position0;
    this.secondLastPosition = this.position0;
    //

    // WRITE THIS!
  }

  saveState() {
    /*
     * Take a snapshot of the particle's state, its position and
     * velocity, before advancing it.
     */
    this.lastPosition = this.position;
    this.secondLastPosition = this.lastPosition;
  }

  computeAcceleration() {
    /*
     * Compute the acceleration of this particle.
     * It results from the forces due to
     *  - all the connected springs
     *  - gravity
     *  - wind (if blowing), and
     *  - drag due to movement through the air.
     * Newton's law says that:
     *
     *    accel = (sum of the forces) / mass
     */

    const gravityForce = new Vector3d(0.0, -gGravity * this.mass, 0.0); // TODO: is this the right basis?
    const breezeForce = new Vector3d(0.0, 0.0, 0.0); // TODO

    const velocity = this.lastPosition.minus(this.secondLastPosition);
    const dragForce = velocity.times(-gDrag);

    const springForce = this.springs.reduce(
      (forces, spring) => forces.plus(spring.computeForce(this)),
      new Vector3d(0.0, 0.0, 0.0)
    );

    const force = gravityForce.plus(
      breezeForce.plus(dragForce.plus(springForce))
    );

    return force.times(1.0 / this.mass);
  }

  computeStep(timeStep, acceleration) {
    /*
     * Compute the next position based on the current position,
     * the velocity, and the acceleration.
     *
     * Use `timeStep` for the time step size.
     */

    const velocity = this.lastPosition.minus(this.secondLastPosition);
    this.position = this.lastPosition
      .plus(velocity.times(timeStep))
      .plus(acceleration.times(timeStep * timeStep));
  }

  makeStep() {
    /*
     * Computes the particle's next state based on its current one.
     */
    if (!this.fixed) {
      const acceleration = this.computeAcceleration();
      this.computeStep(gTimeStep, acceleration);
    }
  }
}

//
// Spring
//
// Class defining a spring that connects two masses. A particle has
// a resting length, based on the initial poistions of its two masses,
// and a `stiffness`. These can be used to compute the force it applies
// to its two ends according to Hooke's law.
//
class Spring {
  constructor(mass1, mass2, stiffness) {
    this.mass1 = mass1;
    this.mass2 = mass2;
    mass1.addSpring(this);
    mass2.addSpring(this);
    //
    this.stiffness = stiffness;
    this.setRestingLength();
  }

  setRestingLength() {
    /*
     * Compute the resting length from the starting positions.
     */
    this.restingLength = this.mass2.position0
      .minus(this.mass1.position0)
      .norm();
  }

  computeForce(onMass) {
    /*
     * Compute the spring's force `onMass` based on its position,
     * and the position of the other mass.
     */

    const otherMass = onMass === this.mass1 ? this.mass2 : this.mass1;
    const distance = otherMass.lastPosition.minus(onMass.lastPosition);
    const force = distance
      .unit()
      .times((distance.norm() - this.restingLength) * this.stiffness);

    return force;
  }

  constrain() {
    /*
     * Move the positions of the two masses at the spring's ends so that
     * their distance apart is no more than `restingLength * gDeformation`.
     */
    // WRITE THIS!
  }
}

//
// Cloth
//
// Models a cloth as a grid of particles connected by springs.
//
//
//
class Cloth {
  constructor(rows, columns) {
    this.rows = rows;
    this.columns = columns;
    this.masses = [];
    this.springs = [];
    //
    this.doFlap = false;

    // Position all the particles.
    //
    const x0 = -gClothWidth / 2.0;
    const y0 = gClothTop;
    const dx = gClothWidth / (columns - 1);
    const dy = -gClothHeight / (rows - 1);
    this.makeMassGrid(x0, y0, dx, dy);

    // Connect them up.
    //
    this.connectMasses();

    // Fix the two corners.
    //
    this.getMass(0, 0).fixed = true;
    this.getMass(0, this.columns - 1).fixed = true;
  }

  reset() {
    /*
     * Reset the state of all the particles.
     */
    for (let mass of this.masses) {
      mass.reset();
    }
  }

  getMass(r, c) {
    /*
     * Get the particle at row `r`, column `c`.
     */
    const index = r * this.columns + c;
    return this.masses[index];
  }

  requestFlap() {
    /*
     * Register the need to perform a flap with the
     * next update.
     */
    this.doFlap = true;
  }

  flap() {
    /*
     * Flap the cloth by stretching it, i.e. changing the
     * positions of some of its particles.
     */
    // WRITE THIS!!
  }

  update() {
    /*
     * Update the positions of the cloth's particles, computing
     * one time step forward.
     */

    // Save the current particle states, prepare for their update.
    //
    for (let mass of this.masses) {
      mass.saveState();
    }

    // Set the positions according to a flap of the sheet.
    //
    if (this.doFlap) {
      this.flap();
      this.doFlap = false;
    }

    // Change all the positions of each particle.
    //
    for (let mass of this.masses) {
      mass.makeStep();
    }

    // Correct overly-stretched springs.
    //
    if (gConstraintOn) {
      for (let spring of this.springs) {
        spring.constrain();
      }
    }
  }

  // ==================================================
  //
  // Methods for WebGL rendering.
  //

  compileMesh() {
    /*
     * Record the WebGL description of the cloth's mesh.
     */
    glBegin(GL_LINES, "cloth-mesh");
    for (let spring of this.springs) {
      const p1 = spring.mass1.position;
      const p2 = spring.mass2.position;
      glVertex3f(p1.x, p1.y, p1.z);
      glVertex3f(p2.x, p2.y, p2.z);
    }
    glEnd();
  }

  recompileMesh() {
    /*
     * Update the WebGL description of the cloth's mesh.
     */
    glUpdateBegin("cloth-mesh");
    for (let spring of this.springs) {
      const p1 = spring.mass1.position;
      const p2 = spring.mass2.position;
      glVertex3f(p1.x, p1.y, p1.z);
      glVertex3f(p2.x, p2.y, p2.z);
    }
    glUpdateEnd();
  }

  renderMesh() {
    /*
     * Draw the cloth mesh in WebGL.
     */
    this.recompileMesh();
    glBeginEnd("cloth-mesh");
  }

  compile() {
    /*
     * Record the WebGL description of the cloth.
     */
    glBegin(GL_TRIANGLES, "cloth");
    this.issueFacets();
    glEnd();
  }

  recompile() {
    /*
     * Update the WebGL description of the cloth.
     */
    glUpdateBegin("cloth");
    this.issueFacets();
    glUpdateEnd();
  }

  render() {
    /*
     * Draw the cloth in WebGL.
     */
    this.recompile();
    glBeginEnd("cloth");
  }

  issueFacets() {
    /*
     * Describe the cloth's surface as a collection of
     * triangular faces, and their normals.
     */
    const middle = this.columns / 2;
    for (let r = 0; r < this.rows - 1; r++) {
      for (let c = 0; c < this.columns - 1; c++) {
        const p00 = this.getMass(r, c).position;
        const p01 = this.getMass(r, c + 1).position;
        const p10 = this.getMass(r + 1, c).position;
        const p11 = this.getMass(r + 1, c + 1).position;
        if (c >= middle) {
          //
          // p00--p01
          //  |  / |
          //  | /  |
          // p10--p11
          //
          const u01 = p01.minus(p00).unit();
          const v10 = p10.minus(p00).unit();
          const n00 = v10.cross(u01);
          //
          const u10 = p10.minus(p11).unit();
          const v01 = p01.minus(p11).unit();
          const n11 = v01.cross(u10);
          //
          glNormal3f(n00.dx, n00.dy, n00.dz);
          glVertex3f(p00.x, p00.y, p00.z);
          glVertex3f(p01.x, p01.y, p01.z);
          glVertex3f(p10.x, p10.y, p10.z);
          //
          glNormal3f(n11.dx, n11.dy, n11.dz);
          glVertex3f(p01.x, p01.y, p01.z);
          glVertex3f(p11.x, p11.y, p11.z);
          glVertex3f(p10.x, p10.y, p10.z);
        } else {
          //
          // p00--p01
          //  | \  |
          //  |  \ |
          // p10--p11
          //
          const u01 = p00.minus(p10).unit();
          const v10 = p11.minus(p10).unit();
          const n00 = v10.cross(u01);
          //
          const u10 = p11.minus(p01).unit();
          const v01 = p00.minus(p01).unit();
          const n11 = v01.cross(u10);
          //
          glNormal3f(n00.dx, n00.dy, n00.dz);
          glVertex3f(p00.x, p00.y, p00.z);
          glVertex3f(p10.x, p10.y, p10.z);
          glVertex3f(p11.x, p11.y, p11.z);
          //
          glNormal3f(n11.dx, n11.dy, n11.dz);
          glVertex3f(p00.x, p00.y, p00.z);
          glVertex3f(p11.x, p11.y, p11.z);
          glVertex3f(p01.x, p01.y, p01.z);
        }
      }
    }
  }

  // ==================================================
  //
  // Methods that construct the cloth model.
  //

  makeMassGrid(x0, y0, dx, dy) {
    /*
     * Create a (rows x columns) grid of masses, with rows
     * offset by `dy`, and columns offset by `dx`. The (0,0)
     * mass sits at `(x0,y0)`.
     */
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        const x = x0 + dx * c;
        const y = y0 + dy * r;
        const z = 0.0;
        const p = new Point3d(x, y, z);
        const mass = new Mass(1.0, p);
        this.masses.push(mass);
      }
    }
  }

  connectMasses() {
    /*
     * Connect up the masses by springs.
     *
     * Each mass is connected to NSEW masses.
     * And also the four diagonal masses.
     * And also the NSEW ones two positions away.
     *
     */

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        const lastRow = r + 1 === this.rows;
        const lastCol = c + 1 === this.columns;
        const firstRow = r === 0;
        const firstCol = c === 0;
        const secondToLastRow = r + 2 === this.rows;
        const secondToLastCol = c + 2 === this.columns;

        const thisMass = this.getMass(r, c);

        // structural springs
        if (!lastRow) {
          // make horizontal structural spring
          const newSpring = new Spring(
            thisMass,
            this.getMass(r + 1, c),
            gStiffness
          );
          this.springs.push(newSpring);
        }
        if (!lastCol) {
          // make vertical structural spring
          const newSpring = new Spring(
            thisMass,
            this.getMass(r, c + 1),
            gStiffness
          );
          this.springs.push(newSpring);
        }

        // shear springs
        if (!lastRow && !lastCol) {
          // make upwards-diagonal shear spring
          const newSpring = new Spring(
            thisMass,
            this.getMass(r + 1, c + 1),
            gStiffness
          );
          this.springs.push(newSpring);
        }
        if (!lastRow && !firstCol) {
          // make downwards-diagonal shear spring
          const newSpring = new Spring(
            thisMass,
            this.getMass(r + 1, c - 1),
            gStiffness
          );
          this.springs.push(newSpring);
        }

        // flexion springs
        if (!lastRow && !secondToLastRow) {
          // make horizontal flexion spring
          const newSpring = new Spring(
            thisMass,
            this.getMass(r + 2, c),
            gStiffness * gBend
          );
          this.springs.push(newSpring);
        }
        if (!lastCol && !secondToLastCol) {
          // make vertical flexion spring
          const newSpring = new Spring(
            thisMass,
            this.getMass(r, c + 2),
            gStiffness * gBend
          );
          this.springs.push(newSpring);
        }
      }
    }
  }
}
