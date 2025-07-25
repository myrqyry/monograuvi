import BaseVisualNode from './BaseVisualNode.js';

class GeometryRendererNode extends BaseVisualNode {
    constructor(options = {}) {
        super('Visual Geometry Renderer', { size: [240, 200], ...options });

        this.setupGeometryRenderer();
    }

    setupGeometryRenderer() {
        this.addInput('Audio Data', 'array', { description: 'Audio reactive data' });
        this.addInput('Scale', 'number', { description: 'Geometry scale modifier' });
        this.addInput('Rotation', 'number', { description: 'Rotation speed modifier' });
        this.addOutput('Visual', 'visual', { description: 'Rendered geometry' });

        this.addProperty('geometryType', 'cube', {
            options: ['cube', 'sphere', 'torus', 'cylinder', 'icosahedron', 'dodecahedron', 'custom'],
            type: 'enum',
            description: '3D geometry type',
            category: 'Geometry'
        });
        this.addProperty('wireframe', false, {
            type: 'boolean',
            description: 'Render as wireframe',
            category: 'Rendering'
        });
        this.addProperty('material', 'standard', {
            options: ['standard', 'phong', 'lambert', 'basic', 'toon', 'physical'],
            type: 'enum',
            description: 'Material type',
            category: 'Rendering'
        });
        this.addProperty('rotationX', 0.01, {
            min: -1, max: 1, step: 0.001,
            description: 'X-axis rotation speed',
            category: 'Animation'
        });
        this.addProperty('rotationY', 0.01, {
            min: -1, max: 1, step: 0.001,
            description: 'Y-axis rotation speed',
            category: 'Animation'
        });
        this.addProperty('rotationZ', 0.01, {
            min: -1, max: 1, step: 0.001,
            description: 'Z-axis rotation speed',
            category: 'Animation'
        });
        this.addProperty('audioReactiveScale', true, {
            type: 'boolean',
            description: 'Scale with audio amplitude',
            category: 'Audio'
        });
        this.addProperty('audioReactiveColor', true, {
            type: 'boolean',
            description: 'Color changes with audio',
            category: 'Audio'
        });
    }

    async onProcess(inputs) {
        return this.processGeometryRenderer(inputs);
    }

    processGeometryRenderer(inputs) {
        const audioData = inputs['Audio Data'] || [];
        const scale = inputs.Scale || 1.0;
        const rotation = inputs.Rotation || 0.0;

        return {
            Visual: {
                type: 'geometry-renderer',
                geometryType: this.getProperty('geometryType'),
                audioData,
                scale,
                rotation,
                wireframe: this.getProperty('wireframe'),
                material: this.getProperty('material'),
                properties: this.getProperties()
            }
        };
    }

    onPropertyChanged(name, value) {
        if (name === 'geometryType') {
            this.reinitializeVisual();
        }
    }
}

export default GeometryRendererNode;
