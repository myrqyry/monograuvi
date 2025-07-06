class ParticleSystem {
    constructor(gl, numParticles) {
        this.gl = gl;
        this.numParticles = numParticles;
        this.particles = new Float32Array(numParticles * 4); // x, y, size, life
        this.initParticles();
        this.vertexBuffer = this.createBuffer();
    }

    initParticles() {
        for (let i = 0; i < this.numParticles; i++) {
            this.particles[i * 4] = Math.random() * 2 - 1; // x
            this.particles[i * 4 + 1] = Math.random() * 2 - 1; // y
            this.particles[i * 4 + 2] = Math.random(); // size
            this.particles[i * 4 + 3] = Math.random(); // life
        }
    }

    createBuffer() {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.particles);
        return buffer;
    }

    update(deltaTime, audioFeatures) {
        for (let i = 0; i < this.numParticles; i++) {
            this.particles[i * 4 + 3] -= deltaTime; // decrease life
            if (this.particles[i * 4 + 3] <= 0) {
                this.resetParticle(i);
            }
            // Update position based on audio features
            this.particles[i * 4] += (Math.random() - 0.5) * audioFeatures.frequency; // x
            this.particles[i * 4 + 1] += (Math.random() - 0.5) * audioFeatures.frequency; // y
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.particles, this.gl.STREAM_DRAW);
    }

    resetParticle(index) {
        this.particles[index * 4] = Math.random() * 2 - 1; // x
        this.particles[index * 4 + 1] = Math.random() * 2 - 1; // y
        this.particles[index * 4 + 2] = Math.random(); // size
        this.particles[index * 4 + 3] = Math.random(); // life
    }

    render(shaderProgram) {
        this.gl.useProgram(shaderProgram);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        const particleDataLocation = this.gl.getAttribLocation(shaderProgram, "a_particleData");
        this.gl.enableVertexAttribArray(particleDataLocation);
        this.gl.vertexAttribPointer(particleDataLocation, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.POINTS, 0, this.numParticles);
        this.gl.disableVertexAttribArray(particleDataLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }
}

export default ParticleSystem;
