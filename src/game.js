class Game {
  constructor(state) {
    this.state = state;
    this.spawnedObjects = [];
    this.collidableObjects = [];
  }

  // example - we can add our own custom method to our game and call it using 'this.customMethod()'
  // customMethod() {
  //   console.log("Custom method!");
  // }

  // example - create a collider on our object with various fields we might need (you will likely need to add/remove/edit how this works)
  // createSphereCollider(object, radius, onCollide = null) {
  //   object.collider = {
  //     type: "SPHERE",
  //     radius: radius,
  //     onCollide: onCollide ? onCollide : (otherObject) => {
  //       console.log(`Collided with ${otherObject.name}`);
  //     }
  //   };
  //   this.collidableObjects.push(object);
  // }

  // example - function to check if an object is colliding with collidable objects
  // checkCollision(object) {
  //   // loop over all the other collidable objects 
  //   this.collidableObjects.forEach(otherObject => {
  //     // probably don't need to collide with ourselves
  //     if (object.name === otherObject.name) {
  //       return;
  //     }
  //     // do a check to see if we have collided, if we have we can call object.onCollide(otherObject) which will
  //     // call the onCollide we define for that specific object. This way we can handle collisions identically for all
  //     // objects that can collide but they can do different things (ie. player colliding vs projectile colliding)
  //     // use the modeling transformation for object and otherObject to transform position into current location
  //     // ie: 
  //     // if (collide){ object.collider.onCollide(otherObject) } // fires what we defined our object should do when it collides
  //   });
  // }

  // runs once on startup after the scene loads the objects
  async onStart() {
    console.log("On start");
	this.state.cameraViewMatrix = mat4.create();
    this.state.cameraProjMatrix = mat4.create();
	this.state.sunViewMatrix = mat4.create();
	this.state.sunProjMatrix = mat4.create();
	this.state.sunVPMatrix = mat4.create();

    // // this just prevents the context menu from popping up when you right click
    // document.addEventListener("contextmenu", (e) => {
    //   e.preventDefault();
    // }, false);

    // // example - set an object in onStart before starting our render loop!
    // this.cube = getObject(this.state, "cube1");
    // const otherCube = getObject(this.state, "cube2"); // we wont save this as instance var since we dont plan on using it in update

    // // example - create sphere colliders on our two objects as an example, we give 2 objects colliders otherwise
    // // no collision can happen
    // this.createSphereCollider(this.cube, 0.5, (otherObject) => {
    //   console.log(`This is a custom collision of ${otherObject.name}`)
    // });
    // // this.createSphereCollider(otherCube, 0.5);

    // // example - setting up a key press event to move an object in the scene
    // document.addEventListener("keypress", (e) => {
    //   e.preventDefault();

    //   switch (e.key) {
    //     case "a":
    //       this.cube.translate(vec3.fromValues(0.5, 0, 0));
    //       break;

    //     case "d":
    //       this.cube.translate(vec3.fromValues(-0.5, 0, 0));
    //       break;

    //     default:
    //       break;
    //   }
    // });

    // calling our custom method! (we could put spawning logic, collision logic etc in there ;)
    // this.customMethod();

    // example: spawn some stuff before the scene starts
    // for (let i = 0; i < 10; i++) {
    //     for (let j = 0; j < 10; j++) {
    //         for (let k = 0; k < 10; k++) {
    //             spawnObject({
    //                 name: `new-Object${i}${j}${k}`,
    //                 type: "cube",
    //                 material: {
    //                     diffuse: randomVec3(0, 1)
    //                 },
    //                 position: vec3.fromValues(4 - i, 5 - j, 10 - k),
    //                 scale: vec3.fromValues(0.5, 0.5, 0.5)
    //             }, this.state);
    //         }
    //     }
    // }

    // example: spawn in objects, set constantRotate to true for them (used below) and give them a collider
    //   for (let i = 0; i < 2; i++) {
    //     let tempObject = await spawnObject({
    //       name: `new-Object${i}`,
    //       type: "cube",
    //       material: {
    //         diffuse: randomVec3(0, 1)
    //       },
    //       position: vec3.fromValues(4 - i, 0, 0),
    //       scale: vec3.fromValues(0.5, 0.5, 0.5)
    //     }, this.state);


    //     tempObject.constantRotate = true;         // lets add a flag so we can access it later
    //     this.spawnedObjects.push(tempObject);     // add these to a spawned objects list
    //     this.collidableObjects.push(tempObject);  // say these can be collided into
    //   }
  }

  // Runs once every frame non stop after the scene loads
  onUpdate(deltaTime) {
    // TODO - Here we can add game logic, like moving game objects, detecting collisions, you name it. Examples of functions can be found in sceneFunctions

    // example: Rotate a single object we defined in our start method
    // this.cube.rotate('x', deltaTime * 0.5);

    // example: Rotate all objects in the scene marked with a flag
    // this.state.objects.forEach((object) => {
    //   if (object.constantRotate) {
    //     object.rotate('y', deltaTime * 0.5);
    //   }
    // });

    // simulate a collision between the first spawned object and 'cube' 
    // if (this.spawnedObjects[0].collidable) {
    //     this.spawnedObjects[0].onCollide(this.cube);
    // }

    // example: Rotate all the 'spawned' objects in the scene
    // this.spawnedObjects.forEach((object) => {
    //     object.rotate('y', deltaTime * 0.5);
    // });


    // example - call our collision check method on our cube
    // this.checkCollision(this.cube);
	
  	let camFront = vec3.fromValues(0, 0, 0);
    vec3.add(camFront, state.camera.position, state.camera.front);
    mat4.lookAt(this.state.cameraViewMatrix, state.camera.position, camFront, state.camera.up);

    // Projection Matrix ....
    let fovy = 90.0 * Math.PI / 180.0; // Vertical field of view in radians
    let aspect = state.canvas.clientWidth / state.canvas.clientHeight; // Aspect ratio of the canvas
    let near = 0.1; // Near clipping plane
    let far = 1000000.0; // Far clipping plane
    mat4.perspective(this.state.cameraProjMatrix, fovy, aspect, near, far);

	// Sun view and projection
	const center = vec3.fromValues(2.5, 0, 2.5);
	const sunDir = vec3.fromValues(-1, -1, 1);
	calculateSunViewMatrix(this.state.sunViewMatrix, center, sunDir);
	calculateSunProjMatrix(this.state.sunProjMatrix, 5, 10);
	mat4.mul(this.state.sunVPMatrix, this.state.sunProjMatrix, this.state.sunViewMatrix);
 }
}

function calculateSunViewMatrix(out, center, sunDir, distance = 10, up = [0, 1, 0]) {
	const dir = vec3.normalize(vec3.create(), sunDir);
	const eye = vec3.scaleAndAdd(vec3.create(), center, dir, -distance);

	// Avoid a degenerate lookAt when the sun is (nearly) parallel to up
	const safeUp = Math.abs(vec3.dot(dir, up)) > 0.999 ? [0, 0, 1] : up;

	return mat4.lookAt(out, eye, center, safeUp);
}

function calculateSunProjMatrix(out, sceneRadius, distance) {
	return mat4.ortho(out, -sceneRadius, sceneRadius, -sceneRadius, sceneRadius, 0.1, sceneRadius + distance);
}
