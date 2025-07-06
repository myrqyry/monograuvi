export function createWebGLContext(canvas) {
    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.error('Unable to initialize WebGL. Your browser may not support it.');
        return null;
}
    return gl;
}

export function initWebGL(canvas) {
    // Placeholder for future initialization logic
    return createWebGLContext(canvas);
}

export function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    console.error('Shader compilation failed: ' + gl.getShaderInfoLog(shader));
    return null;
    gl.deleteShader(shader);
}

export function linkProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return program;
    }

    console.error('Program linking failed: ' + gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
}

export function renderVisuals(gl, audioData) {
    // Basic render function placeholder
    let clearColor = [0.1, 0.1, 0.1, 1.0];
    
    // TODO: Implement actual rendering based on audioData
    if (audioData) {
        // Example: change clear color based on audio amplitude
        const amplitude = Array.isArray(audioData) ? audioData.reduce((a, b) => a + b, 0) / audioData.length : 0;
        clearColor = [amplitude * 0.5, 0.1, amplitude * 0.3, 1.0];
    }
    gl.clearColor(...clearColor);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

export function resizeCanvasToDisplaySize(canvas) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
}
