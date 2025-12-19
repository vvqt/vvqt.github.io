precision highp float;

varying vec2 a;

uniform sampler2D b;

void main() {
    gl_FragColor=texture2D(b,a);
}