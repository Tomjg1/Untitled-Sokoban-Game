#version 300 es
precision highp float;

in vec2 oUV;
out vec4 fragColor;

uniform sampler2D uTexture;
uniform int uLinearizeDepth;

// NOTE(rordon): copy pasted from https://learnopengl.com/Advanced-OpenGL/Depth-testing
float LinearizeDepth(float depth, float near, float far) 
{
    float z = depth * 2.0 - 1.0; // back to NDC 
    return (2.0 * near * far) / (far + near - z * (far - near));	
}

void main()
{
	float depth = texture(uTexture, oUV).r;
	if (uLinearizeDepth == 1) { depth = LinearizeDepth(depth, 0.01, 100.0); }
	fragColor = vec4(vec3(depth), 1.0);
}
