class ShaderManager {
    constructor(gl) {
        this.gl = gl;
        this.shaders = {};
    }

    loadShader(name, vertexSource, fragmentSource) {
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);
        const program = this.createProgram(vertexShader, fragmentShader);
        if (vertexShader && fragmentShader && program) {
            this.shaders[name] = program;
        } else {
            console.error(`Failed to load shader: ${name}`);
        }
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
        if (!vertexShader || !fragmentShader) {
            console.error('Cannot create program: One or both shaders are null.');
            return null;
        }
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Error linking program:', this.gl.getProgramInfoLog(program));
            return null;
        }
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
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
        if (location !== null) {
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
            } else if (typeof value === "number") {
                if (Number.isInteger(value)) {
                    this.gl.uniform1i(location, value);
                } else {
                    this.gl.uniform1f(location, value);
                }
            } else if (typeof value === "boolean") {
                this.gl.uniform1i(location, value ? 1 : 0);
            } else if (value instanceof Int32Array || value instanceof Uint32Array) {
                if (value.length === 1) {
                    this.gl.uniform1iv(location, value);
                } else if (value.length === 2) {
                    this.gl.uniform2iv(location, value);
                } else if (value.length === 3) {
                    this.gl.uniform3iv(location, value);
                } else if (value.length === 4) {
                    this.gl.uniform4iv(location, value);
                }
            } else if (value instanceof Float32Array && value.length === 16) {
                this.gl.uniformMatrix4fv(location, false, value);
            }
        }
    }
}

export default ShaderManager;
