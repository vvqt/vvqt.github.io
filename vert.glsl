precision highp float;

attribute vec2 c;
attribute vec2 f;
varying vec2 a;

uniform vec2 d; // [1, 1]
uniform vec2 e; // [0, 0]
uniform mat4 g; // proj
uniform mat4 h;

void main() {
    gl_Position = g * h * vec4(c.x,c.y,0,1);
    a = (f-.5) / d + .5 + e;
}