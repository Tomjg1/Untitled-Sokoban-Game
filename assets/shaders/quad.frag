#version 300 es
precision highp float;

in vec2 oUV;
out vec4 fragColour;

void main()
{
	fragColour = vec4(oUV, 0.0, 1.0);
}
