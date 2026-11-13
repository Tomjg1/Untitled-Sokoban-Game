#version 300 es
#define MAX_LIGHTS 20
precision highp float;

uniform vec3 diffuseVal;
uniform vec3 uCameraPos;

// Textures
uniform sampler2D uShadowTexture;
uniform sampler2D uDiffuseTexture;
uniform sampler2D uNormalTexture;

uniform int  uNormalSamplerExists;

in vec3 oNormal;
in vec2 oUV;
in vec3 oFragPosition;
in vec4 oFragPosLightSpace;
in vec3 oBitangent;

struct DirectionalLight {
	vec3 direction;
	vec3 color;
	float strength;
};

vec3 calcDirectionalLight(DirectionalLight light, vec3 normal, vec3 baseDiffuse, float shadow)
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
		specular = 0.075 * Ld * pow(max(dot(N, H), 0.0), 32.0);
	}

	return ambient + ((1.0 - shadow) * (diffuse + specular));
}

float calcShadow(vec4 fragPosLightSpace, vec3 normal, vec3 lightDir) {
	// NOTE(rordon): copy pasted from https://learnopengl.com/Advanced-Lighting/Shadows/Shadow-Mapping

    // perform perspective divide
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    // transform to [0,1] range
    projCoords = projCoords * 0.5 + 0.5;

	// NOTE(rordon): better bounds check so that anything outside shadow map range is lit 100%
    if (projCoords.x < 0.0 || projCoords.x > 1.0 ||
        projCoords.y < 0.0 || projCoords.y > 1.0 ||
        projCoords.z < 0.0 || projCoords.z > 1.0) {
        return 0.0;
    }
    // get closest depth value from light's perspective (using [0,1] range fragPosLight as coords)
    float closestDepth = texture(uShadowTexture, projCoords.xy).r; 
    // get depth of current fragment from light's perspective
    float currentDepth = projCoords.z;


	vec3 N = normalize(normal);
	vec3 L = normalize(-lightDir);
	float bias = max(0.01 * (1.0 - dot(N, L)), 0.005);  
    // check whether current frag pos is in shadow
	float shadow = currentDepth - bias > closestDepth  ? 1.0 : 0.0;  

    return shadow;
}

vec3 calcNormal(vec3 normal, vec3 bitangent)
{
	vec3 N = normalize(normal);
	vec3 B = normalize(bitangent - dot(bitangent, N) * N);
	vec3 T = cross(B, N);   // flip to cross(N, B) if bumps look mirrored

	vec3 n = texture(uNormalTexture, oUV).xyz * 2.0 - 1.0;
	return normalize(mat3(T, B, N) * n);
}

out vec4 fragColor;
void main() {
	DirectionalLight sun;
	sun.direction = normalize(vec3(-1.0, -1.0, 1.0));  // down, toward the origin from (+x, -z)
	sun.color    = vec3(0.9, 0.9, 0.95);
	sun.strength  = 1.0;
	vec3 diffuse = texture(uDiffuseTexture, oUV).rgb;

	vec3 normal = oNormal;
	if (uNormalSamplerExists == 1)
	{
		normal = calcNormal(normal, oBitangent);
	}

	float shadow = calcShadow(oFragPosLightSpace, oNormal, sun.direction);
	fragColor = vec4(calcDirectionalLight(sun, normal, diffuse, shadow), 1.0);
}
