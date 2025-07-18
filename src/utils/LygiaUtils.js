/**
 * LYGIA Shader Library Integration Utilities
 *
 * This module provides utilities for integrating LYGIA shader functions
 * into the monograuvi project, enabling advanced visual effects and
 * procedural generation capabilities.
 */

/**
 * LYGIA function categories and their most commonly used functions
 */
export const LYGIA_CATEGORIES = {
  animation: {
    name: 'Animation',
    functions: [
      'easeInOut', 'easeIn', 'easeOut', 'bounce', 'elastic',
      'pulse', 'wave', 'oscillate', 'swing'
    ]
  },
  color: {
    name: 'Color',
    functions: [
      'palette', 'hue', 'saturation', 'brightness', 'contrast',
      'gamma', 'exposure', 'vibrance', 'temperature', 'tint'
    ]
  },
  distort: {
    name: 'Distortion',
    functions: [
      'barrel', 'pincushion', 'fisheye', 'spherize', 'twist',
      'ripple', 'wave', 'bulge', 'squeeze', 'stretch'
    ]
  },
  draw: {
    name: 'Drawing',
    functions: [
      'circle', 'rect', 'line', 'polygon', 'star', 'cross',
      'diamond', 'heart', 'arrow', 'spiral'
    ]
  },
  filter: {
    name: 'Filters',
    functions: [
      'blur', 'sharpen', 'edge', 'emboss', 'sobel', 'laplacian',
      'bilateral', 'median', 'kuwahara', 'oilPaint'
    ]
  },
  generative: {
    name: 'Generative',
    functions: [
      'noise', 'fbm', 'ridge', 'turbulence', 'cellular', 'voronoi',
      'random', 'curl', 'flow', 'field'
    ]
  },
  lighting: {
    name: 'Lighting',
    functions: [
      'phong', 'blinnPhong', 'lambert', 'fresnel', 'rim',
      'gooch', 'toon', 'shadow', 'ao', 'gi'
    ]
  },
  math: {
    name: 'Math',
    functions: [
      'map', 'clamp', 'mix', 'step', 'smoothstep', 'remap',
      'saturate', 'pow', 'exp', 'log'
    ]
  },
  morphological: {
    name: 'Morphological',
    functions: [
      'dilate', 'erode', 'opening', 'closing', 'gradient',
      'tophat', 'blackhat', 'skeleton', 'distance'
    ]
  },
  sample: {
    name: 'Sampling',
    functions: [
      'clamp', 'wrap', 'mirror', 'zero', 'untile', 'triplanar',
      'bicubic', 'bilinear', 'nearest', 'dither'
    ]
  },
  sdf: {
    name: 'SDF (Signed Distance Fields)',
    functions: [
      'circleSDF', 'rectSDF', 'boxSDF', 'sphereSDF', 'cylinderSDF',
      'coneSDF', 'torusSDF', 'planeSDF', 'triangleSDF', 'hexSDF'
    ]
  },
  space: {
    name: 'Space',
    functions: [
      'rotate', 'scale', 'translate', 'skew', 'flip', 'mirror',
      'polar', 'cartesian', 'fisheye', 'perspective'
    ]
  }
};

/**
 * Generates LYGIA include statements for shader preprocessing
 */
export class LygiaProcessor {
  constructor() {
    this.includedFunctions = new Set();
    this.dependencies = new Map();
  }

  /**
   * Add a LYGIA function to be included in the shader
   * @param {string} category - The LYGIA category (e.g., 'generative', 'color')
   * @param {string} functionName - The specific function name
   * @returns {string} The include statement
   */
  addFunction(category, functionName) {
    const includePath = `lygia/${category}/${functionName}.glsl`;
    this.includedFunctions.add(includePath);
    return `#include "${includePath}"`;
  }

  /**
   * Add multiple LYGIA functions at once
   * @param {Object} functions - Object with category as key and array of function names as value
   * @returns {string[]} Array of include statements
   */
  addFunctions(functions) {
    const includes = [];
    for (const [category, functionNames] of Object.entries(functions)) {
      for (const functionName of functionNames) {
        includes.push(this.addFunction(category, functionName));
      }
    }
    return includes;
  }

  /**
   * Generate the complete include block for shader preprocessing
   * @returns {string} Complete include block
   */
  generateIncludes() {
    return Array.from(this.includedFunctions)
      .map(include => `#include "${include}"`)
      .join('\n');
  }

  /**
   * Process a shader string by injecting LYGIA includes
   * @param {string} shaderCode - The original shader code
   * @param {string} includeMarker - Marker where to inject includes (default: '// LYGIA_INCLUDES')
   * @returns {string} Processed shader code
   */
  processShader(shaderCode, includeMarker = '// LYGIA_INCLUDES') {
    const includes = this.generateIncludes();
    return shaderCode.replace(includeMarker, includes);
  }

  /**
   * Clear all included functions
   */
  clear() {
    this.includedFunctions.clear();
    this.dependencies.clear();
  }
}

/**
 * Predefined LYGIA shader templates for common effects
 */
export const LYGIA_TEMPLATES = {
  noise: {
    name: 'Noise Field',
    description: 'Basic noise field using LYGIA noise functions',
    vertex: `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragment: `
      // LYGIA_INCLUDES
      uniform float time;
      uniform vec2 resolution;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        float n = noise(uv * 10.0 + time * 0.5);
        gl_FragColor = vec4(vec3(n), 1.0);
      }
    `,
    uniforms: {
      time: { value: 0.0 },
      resolution: { value: [1.0, 1.0] }
    },
    functions: {
      generative: ['noise']
    }
  },

  fbm: {
    name: 'Fractal Brownian Motion',
    description: 'Layered noise for natural-looking textures',
    vertex: `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragment: `
      // LYGIA_INCLUDES
      uniform float time;
      uniform vec2 resolution;
      uniform float scale;
      uniform int octaves;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        float n = fbm(uv * scale + time * 0.1);
        gl_FragColor = vec4(vec3(n), 1.0);
      }
    `,
    uniforms: {
      time: { value: 0.0 },
      resolution: { value: [1.0, 1.0] },
      scale: { value: 8.0 },
      octaves: { value: 4 }
    },
    functions: {
      generative: ['fbm']
    }
  },

  palette: {
    name: 'Color Palette',
    description: 'Procedural color palette generation',
    vertex: `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragment: `
      // LYGIA_INCLUDES
      uniform float time;
      uniform vec2 resolution;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform vec3 colorC;
      uniform vec3 colorD;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        float t = length(uv - 0.5) + time * 0.1;
        vec3 color = palette(t, colorA, colorB, colorC, colorD);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    uniforms: {
      time: { value: 0.0 },
      resolution: { value: [1.0, 1.0] },
      colorA: { value: [0.5, 0.5, 0.5] },
      colorB: { value: [0.5, 0.5, 0.5] },
      colorC: { value: [1.0, 1.0, 1.0] },
      colorD: { value: [0.0, 0.33, 0.67] }
    },
    functions: {
      color: ['palette']
    }
  },

  distortion: {
    name: 'Distortion Field',
    description: 'Spatial distortion effects',
    vertex: `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragment: `
      // LYGIA_INCLUDES
      uniform float time;
      uniform vec2 resolution;
      uniform float strength;
      uniform sampler2D inputTexture;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec2 distorted = barrel(uv, strength * sin(time));
        vec4 color = texture2D(inputTexture, distorted);
        gl_FragColor = color;
      }
    `,
    uniforms: {
      time: { value: 0.0 },
      resolution: { value: [1.0, 1.0] },
      strength: { value: 0.1 },
      inputTexture: { value: null }
    },
    functions: {
      distort: ['barrel']
    }
  },

  sdf: {
    name: 'SDF Shapes',
    description: 'Signed Distance Field shapes',
    vertex: `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragment: `
      // LYGIA_INCLUDES
      uniform float time;
      uniform vec2 resolution;
      uniform float radius;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec2 centered = uv - 0.5;
        float d = circleSDF(centered, radius);
        float circle = step(0.0, -d);
        gl_FragColor = vec4(vec3(circle), 1.0);
      }
    `,
    uniforms: {
      time: { value: 0.0 },
      resolution: { value: [1.0, 1.0] },
      radius: { value: 0.2 }
    },
    functions: {
      sdf: ['circleSDF']
    }
  },

  audioReactive: {
    name: 'Audio Reactive',
    description: 'Audio-reactive shader using LYGIA functions',
    vertex: `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragment: `
      // LYGIA_INCLUDES
      uniform float time;
      uniform vec2 resolution;
      uniform float audioLevel;
      uniform float bass;
      uniform float mid;
      uniform float treble;
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        
        // Generate noise based on audio
        float n = noise(uv * 10.0 + time * audioLevel);
        
        // Create color palette based on frequency bands
        vec3 color = palette(n + audioLevel, 
          vec3(0.5 + bass * 0.5), 
          vec3(0.5 + mid * 0.5), 
          vec3(1.0), 
          vec3(0.0 + treble, 0.33, 0.67)
        );
        
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    uniforms: {
      time: { value: 0.0 },
      resolution: { value: [1.0, 1.0] },
      audioLevel: { value: 0.0 },
      bass: { value: 0.0 },
      mid: { value: 0.0 },
      treble: { value: 0.0 }
    },
    functions: {
      generative: ['noise'],
      color: ['palette']
    }
  }
};

/**
 * Create a processed shader template
 * @param {string} templateName - Name of the template
 * @param {Object} customUniforms - Optional custom uniforms to merge
 * @returns {Object} Processed shader template
 */
export function createLygiaShader(templateName, customUniforms = {}) {
  const template = LYGIA_TEMPLATES[templateName];
  if (!template) {
    throw new Error(`LYGIA template '${templateName}' not found`);
  }

  const processor = new LygiaProcessor();
  const includes = processor.addFunctions(template.functions);
  
  const processedTemplate = {
    name: template.name,
    description: template.description,
    vertexShader: template.vertex,
    fragmentShader: processor.processShader(template.fragment),
    uniforms: {
      ...template.uniforms,
      ...customUniforms
    },
    includes: includes
  };

  return processedTemplate;
}

/**
 * Get available LYGIA functions by category
 * @param {string} category - Category name
 * @returns {string[]} Array of function names
 */
export function getLygiaFunctions(category) {
  return LYGIA_CATEGORIES[category]?.functions || [];
}

/**
 * Get all available LYGIA categories
 * @returns {string[]} Array of category names
 */
export function getLygiaCategories() {
  return Object.keys(LYGIA_CATEGORIES);
}

/**
 * Search for LYGIA functions by name
 * @param {string} searchTerm - Search term
 * @returns {Object[]} Array of matching functions with category info
 */
export function searchLygiaFunctions(searchTerm) {
  const results = [];
  const term = searchTerm.toLowerCase();
  
  for (const [categoryName, category] of Object.entries(LYGIA_CATEGORIES)) {
    for (const functionName of category.functions) {
      if (functionName.toLowerCase().includes(term)) {
        results.push({
          category: categoryName,
          categoryName: category.name,
          function: functionName
        });
      }
    }
  }
  
  return results;
}

export default {
  LygiaProcessor,
  LYGIA_CATEGORIES,
  LYGIA_TEMPLATES,
  createLygiaShader,
  getLygiaFunctions,
  getLygiaCategories,
  searchLygiaFunctions
};