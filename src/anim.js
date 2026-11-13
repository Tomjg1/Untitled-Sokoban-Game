class Animator {
  constructor() {
	  this.finished = true;
	  this.objects = new Map();
  }

  key(pos, type) { return `${pos.x},${pos.z},${type}`; }

  addObject(pos, sceneRef, type) {
    const k = this.key(pos, type);
    if (this.objects.has(k)) {
      throw new Error(`Already have a "${type}" at ${pos.x},${pos.z}`);
    }
	this.objects.set(k, {
		canonicalPos: { x: pos.x, z: pos.z },
		sceneRef: sceneRef,
		type: type,
		startPos: vec3.fromValues(pos.x, 0, pos.z),
		targetPos: vec3.fromValues(pos.x, 0, pos.z)
	});
    return sceneRef;
  }

  clearObjects() {
	this.objects.clear();
    this.finished = true;
  }

  update(deltaTime) {

  }
}
