#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec2 aUV;
in vec3 aBitangent;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uNormalMatrix;
uniform mat4 uLightMatrix;

out vec2 oUV;
out vec3 oNormal;
out vec3 oBitangent;
out vec3 oFragPosition;
out vec4 oFragPosLightSpace;

void main() {
	// Simply use this normal so no error is thrown
oUV = vec2(aUV.x, 1.0 - aUV.y);
	oNormal = normalize(vec3(uNormalMatrix * vec4(aNormal, 0.0)).xyz);
	oBitangent = normalize(vec3(uModelMatrix * vec4(aBitangent, 0.0)).xyz);
	oFragPosition = vec3(uModelMatrix * vec4(aPosition, 1.0));
	oFragPosLightSpace = uLightMatrix * vec4(oFragPosition, 1.0);

	// Postion of the fragment in world space
	gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}
