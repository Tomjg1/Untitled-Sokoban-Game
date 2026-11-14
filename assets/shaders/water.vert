#version 300 es
uniform mat4 uProjection;
uniform mat4 uView;
uniform vec3 uPos;    // center of plane 
uniform float uSize;   // half extents of plane

out vec2 oUV;

void main()
{
	vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
	vec2 uv = vec2(gl_VertexID & 1, (gl_VertexID >> 1) & 1);
	//oUV = uv;

	vec3 position = uPos + vec3(c.x * uSize, 0.0, c.y * uSize);
	gl_Position = uProjection * uView * vec4(position, 1.0);
}
