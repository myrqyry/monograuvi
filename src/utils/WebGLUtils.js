export function createWebGLContext(canvas) {
    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.error('Unable to initialize WebGL. Your browser may not support it.');
        return null;
    }
    return gl;
}

export function initWebGL(canvas) {
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
    gl.deleteShader(shader);
}

export function linkProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.error('Program linking failed: ' + gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

export function renderVisuals(gl, audioData, visualElements) {
    // Basic render function placeholder
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // TODO: Implement actual rendering based on audioData and visualElements
    if (audioData) {
        // Example: change clear color based on audio amplitude
        const amplitude = audioData.reduce ? audioData.reduce((a, b) => a + b, 0) / audioData.length : 0;
        gl.clearColor(amplitude * 0.5, 0.1, amplitude * 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
}

export function resizeCanvasToDisplaySize(canvas) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
}