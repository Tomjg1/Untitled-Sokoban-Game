#version 300 es
precision highp float;

in vec2 oUV;
out vec4 fragColor;

uniform sampler2D uTexture;

void main()
{

	float depth = texture(uTexture, oUV).r;
fragColor = vec4(vec3(depth), 1.0);
}
