// Vertex shader code for rendering visual elements
#version 300 es

in vec4 a_position;
in vec2 a_texCoord;
in vec3 a_color;

uniform mat4 u_projectionMatrix;
uniform mat4 u_modelViewMatrix;

out vec2 v_texCoord;
out vec3 v_color;

void main() {
    gl_Position = u_projectionMatrix * u_modelViewMatrix * a_position;
    v_texCoord = a_texCoord;
    v_color = a_color;
}