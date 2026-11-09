#version 300 es
in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uNormalMatrix;

out vec3 oNormal;
out vec3 oFragPosition;

void main() {
	// Simply use this normal so no error is thrown
	oNormal = normalize(vec3(uNormalMatrix * vec4(aNormal, 0.0)).xyz);
	oFragPosition = vec3(uModelMatrix * vec4(aPosition, 1.0));
	// Postion of the fragment in world space
	gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}
