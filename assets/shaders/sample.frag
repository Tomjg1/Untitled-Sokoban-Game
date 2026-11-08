#version 300 es
#define MAX_LIGHTS 20
precision highp float;

uniform vec3 diffuseVal;

out vec4 fragColor;
void main() {
	fragColor = vec4(diffuseVal, 1.0);
}
