#version 300 es
#define MAX_LIGHTS 20
precision highp float;

uniform vec3 diffuseVal;
uniform vec3 uCameraPos;

in vec3 oNormal;
in vec3 oFragPosition;

struct DirectionalLight {
	vec3 direction;
	vec3 color;
	float strength;
};

vec3 calcDirectionalLight(DirectionalLight light, vec3 normal, vec3 baseDiffuse)
{
	vec3 N = normalize(normal);

	// Constant for all fragments: points from the surface toward the light
	vec3 L = normalize(-light.direction);

	vec3 Ld = light.color * light.strength;

	vec3 ambient = vec3(0.5) * baseDiffuse;

	float diff = max(dot(N, L), 0.0);
	vec3 diffuse = diff * Ld * baseDiffuse;

	vec3 V = normalize(uCameraPos - oFragPosition);
	vec3 H = normalize(L + V);
	vec3 specular = vec3(0.0);
	if (diff > 0.0)
	{
		specular = 0.9 * Ld * pow(max(dot(N, H), 0.0), 32.0);
	}

	return ambient + diffuse + specular;
}

out vec4 fragColor;
void main() {
	DirectionalLight sun;
	sun.direction = normalize(vec3(-1.0, -1.0, 1.0));  // down, toward the origin from (+x, -z)
	sun.color    = vec3(0.9, 0.9, 0.95);
	sun.strength  = 1.0;
	fragColor = vec4(calcDirectionalLight(sun, oNormal, diffuseVal), 1.0);
}
