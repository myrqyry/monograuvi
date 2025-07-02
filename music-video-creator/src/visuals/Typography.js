import React from 'react';

class Typography {
    constructor(text, options) {
        this.text = text;
        this.options = options || {};
        this.animationFrameId = null;
        this.canvas = null;
        this.context = null;
    }

    init(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.setupCanvas();
        this.startAnimation();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.context.font = `${this.options.fontSize || 48}px ${this.options.fontFamily || 'Arial'}`;
        this.context.fillStyle = this.options.color || '#FFFFFF';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
    }

    startAnimation() {
        const animate = () => {
            this.render();
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    render() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fillText(this.text, this.canvas.width / 2, this.canvas.height / 2);
    }

    stopAnimation() {
        cancelAnimationFrame(this.animationFrameId);
    }
}

export default Typography;