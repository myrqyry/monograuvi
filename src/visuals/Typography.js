class Typography {
    constructor(text, options) {
        this.text = text;
        this.options = options || {};
        this.animationFrameId = null;
        this.canvas = null;
        this.context = null;
    }

    init(canvas) {
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error('Provided canvas is not a valid HTMLCanvasElement.');
        }
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.setupCanvas();
        window.addEventListener('resize', this.handleResize.bind(this));
        this.startAnimation();
    }

    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.setupCanvas();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        const DEFAULT_FONT_SIZE = 48;
        const DEFAULT_FONT_FAMILY = 'Arial';
        this.context.font = `${this.options.fontSize || DEFAULT_FONT_SIZE}px ${this.options.fontFamily || DEFAULT_FONT_FAMILY}`;
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
