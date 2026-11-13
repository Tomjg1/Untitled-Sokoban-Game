#version 300 es
uniform mat4 uProjection;
uniform vec2 uPos;    // top left of quad 
uniform vec2 uSize;   // quad size

out vec2 oUV;

void main()
{
	vec2 uv = vec2(gl_VertexID & 1, (gl_VertexID >> 1) & 1);
	oUV = uv;
	gl_Position = uProjection * vec4(uPos + uv * uSize, 0.0, 1.0);
}
