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
		targetPos: vec3.fromValues(pos.x, 0, pos.z),
		animTime: 0.0,
		animTotalTime: 0.2,
	});
    return sceneRef;
  }

  clearObjects() {
	this.objects.clear();
    this.finished = true;
  }

	performMoves(moves) {
		if (!this.finished) return false;

		// All moving objects
		const moving = new Map();
		for (const { type, from, to } of moves) {
			const obj = this.objects.get(this.key(from, type));
			if (obj) moving.set(obj, to);
			else console.warn(`No "${type}" at ${from.x},${from.z} to move`);
		}
		if (moving.size === 0) return false;

		// Where the objects will be after animations finish
		const next = new Map();
		for (const obj of this.objects.values()) {
			const dest = moving.get(obj) ?? obj.canonicalPos;
			const k = this.key(dest, obj.type);
			if (next.has(k)) {
				console.warn(`Move rejected, "${obj.type}" collision at ${dest.x},${dest.z}`);
      			return false;
			}
			next.set(k, obj);
		}

		for (const [obj, to] of moving) {
			vec3.set(obj.startPos, obj.canonicalPos.x, 0, obj.canonicalPos.z);
			vec3.set(obj.targetPos, to.x, 0, to.z);
			obj.canonicalPos = { x: to.x, z: to.z };
			obj.animTime = obj.animTotalTime;
		}
		this.objects = next;
		this.finished = false;
		return true;
	}

	update(deltaTime) {
	  let animsInProgress = false;
		for (const obj of this.objects.values()) {

			if (obj.animTime <= 0) continue;

			obj.animTime = Math.max(obj.animTime - deltaTime, 0);

			// animTime counts down, so progress is how much of the total has elapsed
			const t = 1 - obj.animTime / obj.animTotalTime;
			vec3.lerp(obj.sceneRef.model.position, obj.startPos, obj.targetPos, t);

			if (obj.animTime > 0) {
			  animsInProgress = true;
			} else {
			  //vec3.copy(obj.startPos, obj.targetPos);
			  obj.animTime = 0
			}
		}

	  this.finished = !animsInProgress;

	}
}
