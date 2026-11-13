var state = {};
var game;
var sceneFile = "L1.json"; // can change this to be the name of your scene

// This function loads on window load, uses async functions to load the scene then try to render it
window.onload = async () => {
  try {
    console.log("Starting to load scene file");
    await parseSceneFile(`./statefiles/${sceneFile}`, state);
    main();
  } catch (err) {
    console.error(err);
    alert(err);
  }
}

/**
 * 
 * @param {object - contains vertex, normal, uv information for the mesh to be made} mesh 
 * @param {object - the game object that will use the mesh information} object 
 * @purpose - Helper function called as a callback function when the mesh is done loading for the object
 */
async function createMesh(mesh, object, vertShader, fragShader) {
  let testModel = new Model(state.gl, object, mesh);
  testModel.vertShader = vertShader ? vertShader : state.vertShaderSample;
  testModel.fragShader = fragShader ? fragShader : state.fragShaderSample;
  await testModel.setup();
  addObjectToScene(state, testModel);
  return testModel;
}

async function loadShaderSource(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  return res.text();
}

function initDepthObjects(gl, state) {
	const SHADOW_SIZE = 2048;

	const depthTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, depthTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, SHADOW_SIZE, SHADOW_SIZE, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);

	const depthFBO = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, depthFBO);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
	gl.drawBuffers([gl.NONE]);
	gl.readBuffer(gl.NONE);

	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
	  console.error('Depth FBO incomplete');
	}
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	state.depthFBO = depthFBO;
	state.depthTexture = depthTexture;
	state.shadowSize = SHADOW_SIZE;
}

/**
 * Main function that gets called when the DOM loads
 */
async function main() {
  //document.body.appendChild( stats.dom );
  const canvas = document.querySelector("#glCanvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Initialize the WebGL2 context
  var gl = canvas.getContext("webgl2");

  // Only continue if WebGL2 is available and working
  if (gl === null) {
    printError('WebGL 2 not supported by your browser',
      'Check to see you are using a <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API#WebGL_2_2" class="alert-link">modern browser</a>.');
    return;
  }

  /**
   * Sample vertex and fragment shader here that simply applies MVP matrix 
   * and diffuse colour of each object
   */
  const vertShaderSample = await loadShaderSource("assets/shaders/sample.vert")
  const fragShaderSample = await loadShaderSource("assets/shaders/sample.frag")

  const quadVertSource   = await loadShaderSource("assets/shaders/quad.vert")
  const quadFragSource   = await loadShaderSource("assets/shaders/quad.frag")

  const unlitVertSource = await loadShaderSource("assets/shaders/unlit.vert")
  const unlitFragSource = await loadShaderSource("assets/shaders/unlit.frag")

  const quadShader = initShaderProgram(gl, quadVertSource, quadFragSource)
  const unlitShaderProgram = initShaderProgram(gl, unlitVertSource, unlitFragSource)

  // Collect all the info needed to use the shader program.
  const quadProgramInfo = {
		// The actual shader program
		program: quadShader,
		attribLocations: {},
		uniformLocations: {
			projection: gl.getUniformLocation(quadShader, 'uProjection'),
			pos: gl.getUniformLocation(quadShader, 'uPos'),
			size: gl.getUniformLocation(quadShader, 'uSize'),
		},
  };
  shaderValuesErrorCheck(quadProgramInfo);

  // Collect all the info needed to use the shader program.
  const unlitProgramInfo = {
		// The actual shader program
		program: unlitShaderProgram,
		attribLocations: {},
		uniformLocations: {
			projection: gl.getUniformLocation(unlitShaderProgram, 'uProjectionMatrix'),
			view: gl.getUniformLocation(unlitShaderProgram, 'uViewMatrix'),
			model: gl.getUniformLocation(unlitShaderProgram, 'uModelMatrix'),
		},
  };
  shaderValuesErrorCheck(unlitProgramInfo);

  /**
   * Initialize state with new values (some of these you can replace/change)
   */
  state = {
    ...state, // this just takes what was already in state and applies it here again
    gl,
    vertShaderSample,
    fragShaderSample,
    canvas: canvas,
    objectCount: 0,
    lightIndices: [],
    keyboard: {},
    mouse: { sensitivity: 0.2 },
    meshCache: {},
    samplerExists: 0,
    samplerNormExists: 0,
	quadShader: quadProgramInfo,
	unlitShader: unlitProgramInfo
  };

  state.numLights = state.pointLights.length;
  initDepthObjects(gl, state);

  const now = new Date();
  for (let i = 0; i < state.loadObjects.length; i++) {
    const object = state.loadObjects[i];

    if (object.type === "mesh") {
      await addMesh(object);
    } else if (object.type === "cube") {
      addCube(object, state);
    } else if (object.type === "plane") {
      addPlane(object, state);
    } else if (object.type.includes("Custom")) {
      addCustom(object, state);
    }
    console.log(`loaded ${object.name};`);
  }

  const then = new Date();
  const loadingTime = (then.getTime() - now.getTime()) / 1000;
  console.log(`Scene file loaded in ${loadingTime} seconds.`);

  game = new Game(state);
  await game.onStart();
  loadingPage.remove();
  startRendering(gl, state); // now that scene is setup, start rendering it
}

/**
 * 
 * @param {object - object containing scene values} state 
 * @param {object - the object to be added to the scene} object 
 * @purpose - Helper function for adding a new object to the scene and refreshing the GUI
 */
function addObjectToScene(state, object) {
  object.name = object.name;
  state.objects.push(object);
}

/**
 * 
 * @param {gl context} gl 
 * @param {object - object containing scene values} state 
 * @purpose - Calls the drawscene per frame
 */
function startRendering(gl, state) {
  // A variable for keeping track of time between frames
  var then = 0.0;

  // This function is called when we want to render a frame to the canvas
  function render(now) {
    now *= 0.001; // convert to seconds
    const deltaTime = now - then;
    then = now;

    state.deltaTime = deltaTime;
	gl.bindFramebuffer(gl.FRAMEBUFFER, state.depthFBO);
	gl.viewport(0, 0, state.shadowSize, state.shadowSize);
	gl.clear(gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	shadowPass(gl, deltaTime, state, state.sunViewMatrix, state.sunProjMatrix);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawScene(gl, deltaTime, state, state.cameraViewMatrix, state.cameraProjMatrix);

	drawScreenQuads(gl, deltaTime, state);
    game.onUpdate(deltaTime); //constantly call our game loop

    // Request another frame when this one is done
    requestAnimationFrame(render);
  }
  // Draw the scene
  requestAnimationFrame(render);
}

function drawScreenQuads(gl, deltaTime, state) {

	gl.useProgram(state.quadShader.program);
	let projection = mat4.create();
	mat4.ortho(projection, 0, gl.canvas.width, 0, gl.canvas.height, 1, -0.5);
	let pos = vec2.fromValues(0,0);
	let size = vec2.fromValues(200,200);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, state.depthTexture);
	gl.uniform2fv(state.quadShader.uniformLocations.pos, pos); 
	gl.uniform2fv(state.quadShader.uniformLocations.size, size); 	
	gl.uniformMatrix4fv(state.quadShader.uniformLocations.projection, false, projection);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
/**
 * 
 * @param {gl context} gl 
 * @param {float - time from now-last} deltaTime 
 * @param {object - contains the state for the scene} state 
 * @purpose Iterate through game objects and render the objects aswell as update uniforms
 */
function drawScene(gl, deltaTime, state, viewMatrix, projectionMatrix) {
  gl.clearColor(state.settings.backgroundColor[0], state.settings.backgroundColor[1], state.settings.backgroundColor[2], 1.0); // Here we are drawing the background color that is saved in our state
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things
  gl.disable(gl.CULL_FACE); // Cull the backface of our objects to be more efficient
  gl.cullFace(gl.BACK);
  // gl.frontFace(gl.CCW);
  gl.clearDepth(1.0); // Clear everything
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // sort objects by nearness to camera
  let sorted = state.objects.sort((a, b) => {
    let aCentroidFour = vec4.fromValues(a.centroid[0], a.centroid[1], a.centroid[2], 1.0);
    vec4.transformMat4(aCentroidFour, aCentroidFour, a.modelMatrix);

    let bCentroidFour = vec4.fromValues(b.centroid[0], b.centroid[1], b.centroid[2], 1.0);
    vec4.transformMat4(bCentroidFour, bCentroidFour, b.modelMatrix);

    return vec3.distance(state.camera.position, vec3.fromValues(aCentroidFour[0], aCentroidFour[1], aCentroidFour[2]))
      >= vec3.distance(state.camera.position, vec3.fromValues(bCentroidFour[0], bCentroidFour[1], bCentroidFour[2])) ? -1 : 1;
  });

  // iterate over each object and render them
  sorted.map((object) => {

		gl.useProgram(object.programInfo.program);
    {
      gl.uniformMatrix4fv(object.programInfo.uniformLocations.projection, false, projectionMatrix);

      // View Matrix & Camera ....
      gl.uniformMatrix4fv(object.programInfo.uniformLocations.view, false, viewMatrix);

      gl.uniform3fv(object.programInfo.uniformLocations.cameraPosition, state.camera.position);

      // Model Matrix ....
      let modelMatrix = mat4.create();
      let negCentroid = vec3.fromValues(0.0, 0.0, 0.0);
      vec3.negate(negCentroid, object.centroid);
      mat4.translate(modelMatrix, modelMatrix, object.model.position);
      mat4.translate(modelMatrix, modelMatrix, object.centroid);
      mat4.mul(modelMatrix, modelMatrix, object.model.rotation);
      mat4.scale(modelMatrix, modelMatrix, object.model.scale);
      mat4.translate(modelMatrix, modelMatrix, negCentroid);

      if (object.parent) {
        let parent = getObject(state, object.parent);
        if (parent.model && parent.model.modelMatrix) {
          mat4.multiply(modelMatrix, parent.model.modelMatrix, modelMatrix);
        }
      }

      object.model.modelMatrix = modelMatrix;
      gl.uniformMatrix4fv(object.programInfo.uniformLocations.model, false, modelMatrix);

      // Normal Matrix ....
      let normalMatrix = mat4.create();
      mat4.invert(normalMatrix, modelMatrix);
      mat4.transpose(normalMatrix, normalMatrix);
      gl.uniformMatrix4fv(object.programInfo.uniformLocations.normalMatrix, false, normalMatrix);

	  gl.uniformMatrix4fv(object.programInfo.uniformLocations.lightMatrix, false, state.sunVPMatrix);

      // Object material
      gl.uniform3fv(object.programInfo.uniformLocations.diffuseVal, object.material.diffuse);
      gl.uniform3fv(object.programInfo.uniformLocations.ambientVal, object.material.ambient);
      gl.uniform3fv(object.programInfo.uniformLocations.specularVal, object.material.specular);
      gl.uniform1f(object.programInfo.uniformLocations.nVal, object.material.n);

	  gl.activeTexture(gl.TEXTURE2);
	  gl.bindTexture(gl.TEXTURE_2D, state.depthTexture);
	  gl.uniform1i(object.programInfo.uniformLocations.shadowSampler, 2);

      {
        // Bind the buffer we want to draw
        gl.bindVertexArray(object.buffers.vao);

        //check for diffuse texture and apply it
        if (object.model.texture != null) {
          state.samplerExists = 1;
          gl.activeTexture(gl.TEXTURE0);
          gl.uniform1i(object.programInfo.uniformLocations.samplerExists, state.samplerExists);
          gl.uniform1i(object.programInfo.uniformLocations.diffuseSampler, 0);
          gl.bindTexture(gl.TEXTURE_2D, object.model.texture);
        } else {
          gl.activeTexture(gl.TEXTURE0);
          state.samplerExists = 0;
          gl.uniform1i(object.programInfo.uniformLocations.samplerExists, state.samplerExists);
        }

        //check for normal texture and apply it
        if (object.model.textureNorm != null && object.model.shaderType == 3) {
          state.samplerNormExists = 1;
          gl.activeTexture(gl.TEXTURE1);
          gl.uniform1i(object.programInfo.uniformLocations.normalSamplerExists, state.samplerNormExists);
          gl.uniform1i(object.programInfo.uniformLocations.normalSampler, 1);
          gl.bindTexture(gl.TEXTURE_2D, object.model.textureNorm);
        } else {
          gl.activeTexture(gl.TEXTURE1);
          state.samplerNormExists = 0;
          gl.uniform1i(object.programInfo.uniformLocations.normalSamplerExists, state.samplerNormExists);
        }

        // Draw the object
        const offset = 0; // Number of elements to skip before starting

        //if its a mesh then we don't use an index buffer and use drawArrays instead of drawElements
        if (object.type === "mesh" || object.type === "meshCustom") {
          gl.drawArrays(gl.TRIANGLES, offset, object.buffers.numVertices / 3);
        } else {
          gl.drawElements(gl.TRIANGLES, object.buffers.numVertices, gl.UNSIGNED_SHORT, offset);
        }
      }
    }
  });
}

function shadowPass(gl, deltaTime, state, viewMatrix, projectionMatrix) {
  gl.clearColor(state.settings.backgroundColor[0], state.settings.backgroundColor[1], state.settings.backgroundColor[2], 1.0); // Here we are drawing the background color that is saved in our state
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things
  gl.disable(gl.CULL_FACE); // Cull the backface of our objects to be more efficient
  gl.cullFace(gl.BACK);
  // gl.frontFace(gl.CCW);
  gl.clearDepth(1.0); // Clear everything
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(state.unlitShader.program);
  state.objects.forEach((object) => {
      gl.uniformMatrix4fv(state.unlitShader.uniformLocations.projection, false, projectionMatrix);

      // View Matrix & Camera ....
      gl.uniformMatrix4fv(state.unlitShader.uniformLocations.view, false, viewMatrix);

      // Model Matrix ....
      let modelMatrix = mat4.create();
      let negCentroid = vec3.fromValues(0.0, 0.0, 0.0);
      vec3.negate(negCentroid, object.centroid);
      mat4.translate(modelMatrix, modelMatrix, object.model.position);
      mat4.translate(modelMatrix, modelMatrix, object.centroid);
      mat4.mul(modelMatrix, modelMatrix, object.model.rotation);
      mat4.scale(modelMatrix, modelMatrix, object.model.scale);
      mat4.translate(modelMatrix, modelMatrix, negCentroid);

      if (object.parent) {
        let parent = getObject(state, object.parent);
        if (parent.model && parent.model.modelMatrix) {
          mat4.multiply(modelMatrix, parent.model.modelMatrix, modelMatrix);
        }
      }

      object.model.modelMatrix = modelMatrix;
      gl.uniformMatrix4fv(state.unlitShader.uniformLocations.model, false, modelMatrix);
      {
        // Bind the buffer we want to draw
        gl.bindVertexArray(object.buffers.vao);

        // Draw the object
        const offset = 0; // Number of elements to skip before starting

        //if its a mesh then we don't use an index buffer and use drawArrays instead of drawElements
        if (object.type === "mesh" || object.type === "meshCustom")
		{
          gl.drawArrays(gl.TRIANGLES, offset, object.buffers.numVertices / 3);
        }
		else
		{
          gl.drawElements(gl.TRIANGLES, object.buffers.numVertices, gl.UNSIGNED_SHORT, offset);
        }
      }
  });
}
