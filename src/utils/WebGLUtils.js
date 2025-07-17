import * as THREE from 'three';

export function initWebGL(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.width, canvas.height);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    camera.position.z = 5;
    return { renderer, scene, camera };
}

export function renderVisuals(renderer, scene, camera, visualElements) {
    if (visualElements && visualElements.length > 0) {
        // Clear the scene
        while(scene.children.length > 0){ 
            scene.remove(scene.children[0]); 
        }

        // Add visual elements to the scene
        visualElements.forEach(element => {
            if (element instanceof THREE.Object3D) {
                scene.add(element);
            }
        });
    }
    
    renderer.render(scene, camera);
}

export function cleanupWebGLResources(renderer) {
    if (renderer) {
        renderer.dispose();
    }
}

