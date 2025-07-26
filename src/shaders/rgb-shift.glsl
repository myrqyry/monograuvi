uniform sampler2D texture;
uniform float amount;
varying vec2 vUv;

void main() {
    vec2 offset = vec2(amount, 0.0);
    vec4 r = texture2D(texture, vUv + offset);
    vec4 g = texture2D(texture, vUv);
    vec4 b = texture2D(texture, vUv - offset);
    gl_FragColor = vec4(r.r, g.g, b.b, 1.0);
}
