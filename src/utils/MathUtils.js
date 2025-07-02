export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function map(value, inMin, inMax, outMin, outMax) {
    return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

export function radToDeg(radians) {
    return radians * (180 / Math.PI);
}