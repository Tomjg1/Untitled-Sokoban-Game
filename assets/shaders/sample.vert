#version 300 es
in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;

out vec3 oNormal;

void main() {
	// Simply use this normal so no error is thrown
	oNormal = aNormal;

	// Postion of the fragment in world space
	gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}
