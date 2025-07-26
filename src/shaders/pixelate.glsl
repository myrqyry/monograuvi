uniform sampler2D texture;
uniform float pixelSize;
varying vec2 vUv;

void main() {
    vec2 uv = floor(vUv * pixelSize) / pixelSize;
    gl_FragColor = texture2D(texture, uv);
}
