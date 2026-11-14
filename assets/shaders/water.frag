#version 300 es
precision highp float;

uniform sampler2D uDepthTexture;
uniform vec2 uViewportSize;

// NOTE(rordon): copy pasted from https://learnopengl.com/Advanced-OpenGL/Depth-testing
float LinearizeDepth(float depth, float near, float far) 
{
    float z = depth * 2.0 - 1.0; // back to NDC 
    return (2.0 * near * far) / (far + near - z * (far - near));	
}

float depthFade(float depthScale) {
	float eyeDepth = 1.0 / gl_FragCoord.w;
	vec2 uv = gl_FragCoord.xy / uViewportSize;

	float rawDepth = texture(uDepthTexture, uv).r;
	float sceneDepth = LinearizeDepth(rawDepth, 0.1, 100.0);
	float diff = sceneDepth - eyeDepth;

	return 1.0 - clamp(diff / depthScale, 0.0, 1.0);
}

out vec4 fragColor;
void main() {
	vec4 shallowColor = vec4(0, 1, 1, 0.5);
	vec4 deepColor = vec4(0, 0.5092537, 0.7075471, 0.3882353);
	vec4 c = mix(deepColor, shallowColor, depthFade(0.5));   // t = 0 gives shallowColor, t = 1 gives deepColor
	fragColor = c;
}
