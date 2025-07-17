import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import useStore from '../store';

// Helper function to recursively dispose of objects in the scene
const disposeSceneResources = (scene) => {
  if (!scene) return;
  scene.traverse((object) => {
    if (object.isMesh) {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        } else {
          if (object.material.map) object.material.map.dispose();
          object.material.dispose();
        }
      }
    }
  });
};


const VRMViewer = ({ toggleVisibility }) => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const vrmRef = useRef(null);
  const mixerRef = useRef(null);
  const animationFrameId = useRef(null);
  
  const [scene, setScene] = useState(null);
  const [camera, setCamera] = useState(null);
  const [vrmModelUrl, setVrmModelUrl] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMotion, setSelectedMotion] = useState('');

  // Main setup and teardown effect
  useEffect(() => {
    const mountNode = mountRef.current;

    // 1. --- Initialize Scene ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e2e); // Catppuccin Base

    const camera = new THREE.PerspectiveCamera(30, mountNode.clientWidth / mountNode.clientHeight, 0.1, 20);
    camera.position.set(0, 1.2, 3.5);
    setScene(scene);
    setCamera(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    mountNode.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 1));

    const gridHelper = new THREE.GridHelper(10, 10, 0x808080, 0x444444);
    scene.add(gridHelper);

    // 2. --- Animation Loop ---
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }
      if (vrmRef.current) {
        vrmRef.current.update(delta);
      }
      renderer.render(scene, camera);
    };
    animate();

    // 3. --- Resize Handling ---
    const handleResize = () => {
      if (mountRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };
    window.addEventListener('resize', handleResize);

    // 4. --- Cleanup ---
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId.current);
      
      // Dispose of all scene contents
      disposeSceneResources(scene);
      
      // Dispose of the renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      // Remove canvas from DOM
      if (mountNode && rendererRef.current) {
        mountNode.removeChild(rendererRef.current.domElement);
      }

      // Revoke any lingering object URLs
      if (vrmModelUrl && vrmModelUrl.startsWith('blob:')) {
        URL.revokeObjectURL(vrmModelUrl);
      }
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  // Load VRM model
  const loadVRMModel = useCallback(async (url) => {
    if (!url || !scene) return;
    
    setIsLoading(true);
    setLoadError(null);

    try {
      // Clean up the previous model before loading a new one
      if (vrmRef.current) {
        scene.remove(vrmRef.current.scene);
        disposeSceneResources(vrmRef.current.scene);
        vrmRef.current = null;
      }
      if (vrmModelUrl && vrmModelUrl.startsWith('blob:')) {
        URL.revokeObjectURL(vrmModelUrl);
      }

      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));
      
      const gltf = await loader.loadAsync(url);
      
      const vrm = gltf.userData.vrm;
      VRMUtils.removeUnnecessaryJoints(vrm.scene);
      VRMUtils.rotateVRM0(vrm); // Rotate model to face camera

      scene.add(vrm.scene);
      vrmRef.current = vrm;
      
      mixerRef.current = new THREE.AnimationMixer(vrm.scene);
      
      setVrmModelUrl(url);
      
      // Center camera on the new model's head
      const head = vrm.humanoid?.getBoneNode('head');
      if (head) {
        const headPos = new THREE.Vector3();
        head.getWorldPosition(headPos);
        camera.lookAt(headPos);
      }

    } catch (error) {
      console.error('Error loading VRM:', error);
      setLoadError(`Failed to load VRM: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [scene, camera, vrmModelUrl]);
  
  // Handle file input
  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    loadVRMModel(url);
  }, [loadVRMModel]);
  
  // (Motion handling logic would go here, simplified for this example)

  return (
    <div className="vrm-viewer-panel flex flex-col h-full">
      <div className="panel-header p-2 bg-bg-alt border-b border-border-component">
        <h2 className="text-lg font-bold text-text-primary">VRM Viewer</h2>
        <button onClick={toggleVisibility} className="absolute top-2 right-2 text-text-secondary hover:text-text-primary">×</button>
      </div>
      
      <div className="panel-content p-2 flex-grow flex flex-col">
        <div className="file-input mb-2">
          <label className="text-sm text-text-secondary">
            Load VRM Model:
            <input 
              type="file" 
              accept=".vrm" 
              onChange={handleFileChange}
              disabled={isLoading}
              className="ml-2"
            />
          </label>
        </div>
        
        {isLoading && <div className="loading text-text-secondary">Loading...</div>}
        {loadError && <div className="error text-red-500">{loadError}</div>}
        
        <div className="viewer-container flex-grow w-full h-full" ref={mountRef}>
          {/* 3D viewer is mounted here */}
        </div>
        
        {/* Motion controls can be added back here */}
      </div>
    </div>
  );
};

export default VRMViewer;
