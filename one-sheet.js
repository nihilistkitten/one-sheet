//
// one-sheet.js
//
// Author: Jim Fix
// CSCI 385: Computer Graphics, Reed College, Spring 2022
//
// This is a WebGL program that models and displays a cloth sheet
// stretched by gravity and blowing in the wind. It animates the
// physical simulation of a spring-and-mass system to represent the
// cloth's dynamics. A cloth is made up of a grid of masses connected
// by springs that deform and wiggle according to Hooke's laws.
//
// Most of this source code does the usual WebGL set-up, devising the
// event handlers that draw the state of the simulation and respond to
// user input. It loads a model of a toy airplane, builds the cloth
// model, and then repeatedly displays successive frames of the cloth
// simulation. (The airplane is used to depict an optional blowing
// breeze.)
//
// The cloth object is defined as `gCloth` and relies on the `class
// Cloth` defined in "cloth.js". That is the code that gets modified
// for completion of this assignment.
//
// The simulation is driven by a `glutTimer` function that updates the
// state of the cloth, according to a numeric simulation of Newton's
// laws applied to the masses of the cloth. This makes repeated calls
// to the cloth `update` method. This computes new positions of the
// particles based on the forces they experience from their connecting
// springs, along with gravity and wind, friction and damping.
//
//
// ========


//
// Set up some of the viewing state globals.
//

//
let gWidth  = 960;
let gHeight = 720;
//
let gViewRotation = 0.0;
let gMouseStart   = {x: 0.0, y: 0.0};
let gMouseDrag    = false;
//
let gLightPosition = new Point3d(-1.5, -0.875, -1.0);
let gMeshOn       = false;

//
// Simulation state.
let gPause        = false;

//
let gSeePlane     = true;
let gPlane        = null;    // Set once the HTML .obj info is loaded.
let gPropSpinRate = 0.0; 
let gPropSpin     = 0.0;


//
// Build the sheet model and the .obj models.
//

//
const CLOTH_MESH_ROWS    = 31;
const CLOTH_MESH_COLUMNS = 41;
const gCloth = new Cloth(CLOTH_MESH_ROWS, CLOTH_MESH_COLUMNS);
//
const MESH_COLOR   = {r:0.8, g:0.85, b:0.2};
const CLOTH_COLOR  = {r:0.7, g:0.2, b:0.9};
const AIR_COLOR    = {r:0.75, g:0.74, b:1.0};
const PROP_COLOR   = {r:0.6, g:0.55, b:0.3};
const PLANE_COLOR  = {r:0.9, g:0.1, b:0.05};
      
function draw() {
    /*
     * Issue GL calls to draw the scene.
     */

    // Clear the rendering information.
    glClearColor(AIR_COLOR.r, AIR_COLOR.g, AIR_COLOR.b);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glEnable(GL_DEPTH_TEST);

    // Turn on lighting.
    glEnable(GL_LIGHTING);
	glEnable(GL_LIGHT0);
    glLightfv(GL_LIGHT0, GL_POSITION, gLightPosition.components());

    // Render the objects.
    glPushMatrix();
    glScalef(0.75,0.75,0.75);
    glRotatef(gViewRotation, 0.0, 1.0, 0.0); // Spin the view according to mouse.

    // Draw the plane with a spinning propeller.
    if (gPlane != null && gSeePlane) {
        
        glPushMatrix();
        glTranslatef(0.0, 0.0, -0.85); // Bump away from the sheet.
        glScalef(0.25, 0.25, 0.25);    // Plane/prop is too big.
        glRotatef( 90, 0.0,1.0,0.0);   // Reorient.
        glRotatef(-90, 1.0,0.0,0.0);
    

        // Draw the propeller.
        glColor3f(PROP_COLOR.r, PROP_COLOR.g, PROP_COLOR.b);
        {
            glPushMatrix();
            glRotatef(gPropSpin, 1.0, 0.0, 0.0); // Spin the propeller.
            glBeginEnd("plane-prop");
            
            //
            // Draw five more copies of the propeller, if spinning fast.
            //
            if (!gPause && gPropSpinRate > 10.0) {
                glRotatef(60.0, 1.0, 0.0, 0.0); 
                glBeginEnd("plane-prop");
                glRotatef(60.0, 1.0, 0.0, 0.0); 
                glBeginEnd("plane-prop");
                glRotatef(60.0, 1.0, 0.0, 0.0); 
                glBeginEnd("plane-prop");
                glRotatef(60.0, 1.0, 0.0, 0.0); 
                glBeginEnd("plane-prop");
                glRotatef(60.0, 1.0, 0.0, 0.0); 
                glBeginEnd("plane-prop");
            }
            glPopMatrix();
        }

        // Draw the plane's body.
        glColor3f(PLANE_COLOR.r, PLANE_COLOR.g, PLANE_COLOR.b);
        glBeginEnd("plane-body");
        
        glPopMatrix();
    }

    // Draw the sheet, possibly showing its mesh.
    //
    glColor3f(CLOTH_COLOR.r, CLOTH_COLOR.g, CLOTH_COLOR.b);
    gCloth.render();
    if (gMeshOn) {
        glColor3f(MESH_COLOR.r, MESH_COLOR.g, MESH_COLOR.b);
        gCloth.renderMesh();
    }
    glPopMatrix();
    
    glDisable(GL_LIGHT0);
    glDisable(GL_LIGHTING);
    
    // Render everything.
    glFlush();
}


function handleKey(key, x, y) {
    /*
     * Handle a keypress.
     */

    //
    if (key == ' ') {
        gPause = !gPause;
    }
    
    //
    if (key == 'w') {
        gWindOn = !gWindOn;
    }
    
    //
    if (key == 'm') {
        gMeshOn = !gMeshOn;
    }

    //
    if (key == 'p') {
        gSeePlane = !gSeePlane;
    }

    //
    if (key == 'f') {
        gCloth.flap();
    }
    
    //
    if (key == 'c') {
        gConstraintOn = !gConstraintOn;
    }

    //
    if (key == 'r') {
        gPause = true;
        gCloth.reset();
        gPause = false;
    }

    //
    glutPostRedisplay();
}

function worldCoords(mousex, mousey) {
    /*
     * Converts the mouse coordinates to world coordinates.
     */
    const pj = mat4.create();
    glGetFloatv(GL_PROJECTION_MATRIX,pj);
    const pj_inv = mat4.create();
    mat4.invert(pj_inv,pj);
    const vp = [0,0,0,0];
    glGetIntegerv(GL_VIEWPORT,vp);
    const mousecoords = vec4.fromValues(2.0*mousex/vp[2]-1.0,
					                    1.0-2.0*mousey/vp[3],
					                    0.0, 1.0);
    vec4.transformMat4(location,mousecoords,pj_inv);
    return {x:location[0], y:location[1]};
}    

function handleMouseClick(button, state, x, y) {
    /*
     * Records the location of a mouse click in object world coordinates.
     */
    
    // Start tracking mouse for trackball/light motion.
    gMouseStart  = worldCoords(x,y);
    if (state == GLUT_DOWN) {
	    gMouseDrag = true;
    } else {
	    gMouseDrag = false;
    }
    glutPostRedisplay()
}

function handleMouseMotion(x, y) {
    /*
     * Reorients the object based on the movement of a mouse drag.
     *
     * Uses last and current location of mouse to compute a trackball
     * rotation. This gets stored in the quaternion gOrientation.
     *
     */
    
    // Capture mouse's position.
    const mouseNow = worldCoords(x,y);

    // Update the view based on mouse movement.
    const dx = mouseNow.x - gMouseStart.x;
    const angle = Math.asin(Math.max(-1.0,Math.min(dx,1.0))) * 180.0 / Math.PI;
    gViewRotation += angle;
    if (gViewRotation > 89.0) {
        gViewRotation = 89.0;
    }
    if (gViewRotation < -89.0) {
        gViewRotation = -89.0;
    }

    // Ready state for next mouse move.
    gMouseStart = mouseNow;

    // Update window.
    glutPostRedisplay()
}

function resizeWindow(w, h) {
    /*
     * Register a window resize by changing the viewport. 
     */
    glViewport(0, 0, w, h);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    
    // Note: We're using a right-handed coordinate system here.
    if (w > h) {
        glOrtho(-w/h, w/h, -1.0, 1.0, -3.0, 3.0);
    } else {
        glOrtho(-1.0, 1.0, -h/w * 1.0, h/w * 1.0, -3.0, 3.0);
    }
}

function handleClockTick(value, msecs) {

    /*
     * Updates the state of the simulation, if not paused.
     *
     */
    if (!gPause) {

        // Spin the propeller if the wind is blowing.
        //
        if (gWindOn) {
            if (gPropSpinRate < 15.0) {
                gPropSpinRate += 1.25;
            }
        } else {
            if (gPropSpinRate > 10.0) {
                gPropSpinRate -= 2.5;
            } else if (gPropSpinRate > 1.0) {
                gPropSpinRate -= 0.0625;
            } else if (gPropSpinRate > 0.0) {
                gPropSpinRate -= 0.00625;
            }
        }
        gPropSpin += gPropSpinRate;
        gPropSpin = gPropSpin % 360;

        // Update the positions of the cloth elements.
        // 
        gCloth.update();
        
    }
    
    glutPostRedisplay()
}

function viewer() {
    /*
     * The main procedure, sets up GL and GLUT.
     */

    // set up GL/UT, its canvas, and other components.
    glutInitDisplayMode(GLUT_SINGLE | GLUT_RGB | GLUT_DEPTH);
    glutInitWindowPosition(0, 0);
    glutInitWindowSize(gWidth, gHeight);
    glutCreateWindow('SHEET TO THE WIND');
    //
    resizeWindow(gWidth, gHeight); // It seems to need this.

    // Make the airplane with a propeller.
    //
	const propobj = new CGObject();
    const propText = document.getElementById("plane-prop.obj").text;
	propobj.buildFromOBJ(propText, true, 5.14); // Some fudge here.
    // ^^^ I needed the propeller to spin, so (roughly) moved it to center.
    {
        glBegin(GL_TRIANGLES, "plane-prop");
        propobj.compileSurface();
        glEnd();
    }
    //
	const planeobj = new CGObject();
    const planeText = document.getElementById("plane-body.obj").text;
	planeobj.buildFromOBJ(planeText, true, 5.14); // More of the same fudge.
    {
        glBegin(GL_TRIANGLES, "plane-body")
        planeobj.compileSurface();
        glEnd();
    }
    
    // Register that the plane model was loaded and compiled.
    //
    gPlane = planeobj;

    // Make the drawing information for the sheet.
    //
    gCloth.compile();
    gCloth.compileMesh();
    
    // Register interaction callbacks.
    glutKeyboardFunc(handleKey);
    glutReshapeFunc(resizeWindow);
    glutDisplayFunc(draw);
    glutMouseFunc(handleMouseClick);
    glutMotionFunc(handleMouseMotion);
    glutTimerFunc(33,handleClockTick,0);
    
    // Go!
    glutMainLoop();

    return 0;
}

glRun(() => { viewer(); }, true);
