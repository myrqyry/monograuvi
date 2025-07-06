export function lerp(a, b, t) {
    // Clamps t to the range [0, 1] to prevent extrapolation
    t = clamp(t, 0, 1);
    return a + (b - a) * t;
}

export function clamp(value, min, max) {
    if (min > max) {
        throw new Error("Invalid clamp range: 'min' should not be greater than 'max'.");
    }
    return Math.max(min, Math.min(max, value));
}

export function map(value, inMin, inMax, outMin, outMax) {
    if (inMin === inMax) {
        throw new Error("Invalid map range: 'inMin' should not be equal to 'inMax'.");
    }
    // Clamps value to the range [inMin, inMax] to prevent extrapolation
    value = clamp(value, inMin, inMax);
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
