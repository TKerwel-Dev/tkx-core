export const VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 a_position;

uniform mat4 u_view;
uniform mat4 u_projection;

void main() {
    gl_Position = u_projection * u_view * vec4(a_position, 0, 1);
}
`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec4 u_color;
out vec4 outColor;

void main() {
    outColor = u_color;
}
`;
