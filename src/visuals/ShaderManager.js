class ShaderManager {
    constructor(gl) {
        this.gl = gl;
        this.shaders = {};
    }

    loadShader(name, vertexSource, fragmentSource) {
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        const program = this.createProgram(vertexShader, fragmentShader);
        this.shaders[name] = program;
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            return shader;
        } else {
            console.error('Error compiling shader:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
    }

    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Error linking program:', this.gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    useShader(name) {
        const program = this.shaders[name];
        if (program) {
            this.gl.useProgram(program);
        } else {
            console.warn(`Shader ${name} not found.`);
        }
    }

    setUniform(name, value) {
        const program = this.gl.getParameter(this.gl.CURRENT_PROGRAM);
        const location = this.gl.getUniformLocation(program, name);
        if (location) {
            if (Array.isArray(value)) {
                if (value.length === 1) {
                    this.gl.uniform1f(location, value[0]);
                } else if (value.length === 2) {
                    this.gl.uniform2fv(location, value);
                } else if (value.length === 3) {
                    this.gl.uniform3fv(location, value);
                } else if (value.length === 4) {
                    this.gl.uniform4fv(location, value);
                }
            } else {
                this.gl.uniform1f(location, value);
            }
        }
    }
}

export default ShaderManager;