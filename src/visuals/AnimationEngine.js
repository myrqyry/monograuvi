class AnimationEngine {
    constructor(canvas) {
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error("Invalid canvas: must be an instance of HTMLCanvasElement.");
        }
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error("Invalid canvas: unable to get 2D context.");
        }
        this.canvas = canvas;
        this.context = context;
        this.animations = [];
        this.isAnimating = false;
    }

    addAnimation(animation) {
        if (typeof animation.update !== 'function') {
            throw new Error("Invalid animation: must have an 'update' method.");
        }
        this.animations.push(animation);
    }

    removeAnimation(animation) {
        this.animations = this.animations.filter(anim => anim !== animation);
    }

    start() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animate();
        }
    }

    stop() {
        this.isAnimating = false;
    }

    animate() {
        if (!this.isAnimating) return;

        this.clearCanvas();
        this.animations.forEach(animation => animation.update(this.context));
        requestAnimationFrame(() => this.animate());
    }

    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

export default AnimationEngine;
