import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// Import VRM utilities - we'll handle the dynamic import of the VRM library
let VRMUtils = null;
let VRMLoaderPlugin = null;
import MotionLibrary from '../lib/MotionLibrary';
import useStore from '../store';
import Playhead from '../lib/Playhead'; // Added Playhead

const VRMViewer = ({ toggleVisibility }) => {
  const mountRef = useRef(null);
  const vrmRef = useRef(null);
  const mixerRef = useRef(null);
  const currentActionRef = useRef(null);
  const vmdLoaderRef = useRef(null);
  const vmdCacheRef = useRef({});
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameId = useRef(null);
  
  const [motionLibrary, setMotionLibrary] = useState(null);
  const [vrmModelUrl, setVrmModelUrl] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMotion, setSelectedMotion] = useState('');
  const [danceBlocks, setDanceBlocks] = useState([]);
  
  // Get store methods
  const { 
    getDanceBlocks: getDanceBlocksFromStore, 
    getIsDancePlaying: getIsDancePlayingFromStore, 
    getPlayheadTime: getPlayheadTimeFromStore, 
    setPlayheadTime, 
    setIsDancePlaying 
  } = useStore();

  // Initialize motion library
  useEffect(() => {
    setMotionLibrary(new MotionLibrary());
  }, []);

  // Set up VRM loader and scene
  useEffect(() => {
    // Import VRM library dynamically
    const loadVRM = async () => {
      try {
        const vrm = await import('@pixiv/three-vrm')
          .then(module => {
            VRMUtils = module.VRMUtils;
            VRMLoaderPlugin = module.VRMLoaderPlugin;
            return module;
          });
        
        // Initialize VRM loader
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));
        vmdLoaderRef.current = new vrm.VMDLoader();
        
        // Set up scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        
        // Set up camera
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
        camera.position.set(0, 1.6, 3);
        
        // Set up renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 0);
        
        // Add lights
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1).normalize();
        scene.add(light);
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        
        // Add grid helper
        const gridHelper = new THREE.GridHelper(10, 10);
        scene.add(gridHelper);
        
        // Set refs
        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        
        // Mount to DOM
        if (mountRef.current) {
          mountRef.current.appendChild(renderer.domElement);
          handleResize();
        }
        
        // Set up animation loop
        const clock = new THREE.Clock();
        const animate = () => {
          animationFrameId.current = requestAnimationFrame(animate);
          
          const delta = clock.getDelta();
          if (mixerRef.current) {
            mixerRef.current.update(delta);
          }
          
          renderer.render(scene, camera);
        };
        
        animate();
        
        // Handle window resize
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
        
        // Cleanup
        return () => {
          window.removeEventListener('resize', handleResize);
          cancelAnimationFrame(animationFrameId.current);
          
          if (renderer) {
            renderer.dispose();
          }
          
          if (vrmModelUrl && vrmModelUrl.startsWith('blob:')) {
            URL.revokeObjectURL(vrmModelUrl);
          }
        };
        
      } catch (error) {
        console.error('Error loading VRM:', error);
        setLoadError('Failed to load VRM library');
      }
    };
    
    loadVRM();
    
  }, [vrmModelUrl]);
  
  // Play VRM motion
  const playVRMMotion = useCallback(async (motionUrl, startOffset = 0, duration = 0) => {
    if (!vrmRef.current) {
      setLoadError('No VRM model loaded');
      return;
    }
    
    if (!vmdLoaderRef.current) {
      setLoadError('VMD loader not initialized');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Load VMD motion
      const vmd = await vmdLoaderRef.current.loadAsync(motionUrl);
      
      // Create animation clip
      const clip = vmd.createAnimationClip(vrmRef.current);
      
      // Set up animation mixer if needed
      if (!mixerRef.current) {
        mixerRef.current = new THREE.AnimationMixer(vrmRef.current.scene);
      }
      
      // Stop current action
      if (currentActionRef.current) {
        currentActionRef.current.stop();
      }
      
      // Play new action
      const action = mixerRef.current.clipAction(clip);
      action.play();
      currentActionRef.current = action;
      
      // Set up loop
      if (duration > 0) {
        setTimeout(() => {
          if (currentActionRef.current === action) {
            action.stop();
            currentActionRef.current = null;
          }
        }, duration * 1000);
      }
      
      setLoadError(null);
      
    } catch (error) {
      console.error('Error playing motion:', error);
      setLoadError(`Failed to play motion: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load VRM model
  const loadVRMModel = useCallback(async (url) => {
    if (!url) return;
    
    try {
      setIsLoading(true);
      setLoadError(null);
      
      // Revoke previous object URL if it was a blob
      if (vrmModelUrl && vrmModelUrl.startsWith('blob:')) {
        URL.revokeObjectURL(vrmModelUrl);
      }
      
      // Load GLTF
      const gltf = await new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));
        
        loader.load(
          url,
          resolve,
          undefined,
          (error) => {
            console.error('Error loading VRM:', error);
            reject(new Error('Failed to load VRM file'));
          }
        );
      });
      
      // Parse VRM
      const vrm = await VRMUtils.loadVRMFromGLTF(gltf);
      
      // Clean up previous model
      if (vrmRef.current) {
        sceneRef.current.remove(vrmRef.current.scene);
      }
      
      // Add new model to scene
      sceneRef.current.add(vrm.scene);
      vrmRef.current = vrm;
      
      // Set up animation mixer
      mixerRef.current = new THREE.AnimationMixer(vrm.scene);
      
      // Update state
      setVrmModelUrl(url);
      
      // Center camera
      if (vrm.humanoid) {
        const headBone = vrm.humanoid.getBoneNode('head');
        if (headBone) {
          const headPosition = new THREE.Vector3();
          headBone.getWorldPosition(headPosition);
          cameraRef.current.lookAt(headPosition);
        }
      }
      
      setLoadError(null);
      
    } catch (error) {
      console.error('Error loading VRM:', error);
      setLoadError(`Failed to load VRM: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [vrmModelUrl]);
  
  // Handle file input
  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    loadVRMModel(url);
  }, [loadVRMModel]);
  
  // Handle motion selection
  const handleMotionSelect = useCallback((motionUrl) => {
    if (!motionUrl) return;
    playVRMMotion(motionUrl);
  }, [playVRMMotion]);
  
  // Render UI
  return (
    <div className="vrm-viewer-panel">
      <div className="panel-header">
        <h2>VRM Viewer</h2>
        <button onClick={toggleVisibility} className="close-button">×</button>
      </div>
      
      <div className="panel-content">
        <div className="file-input">
          <label>
            Load VRM Model:
            <input 
              type="file" 
              accept=".vrm" 
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </label>
        </div>
        
        {isLoading && <div className="loading">Loading...</div>}
        {loadError && <div className="error">{loadError}</div>}
        
        <div className="viewer-container" ref={mountRef}>
          {/* 3D viewer will be rendered here */}
        </div>
        
        <div className="motion-controls">
          <h3>Motions</h3>
          <select 
            value={selectedMotion} 
            onChange={(e) => setSelectedMotion(e.target.value)}
            disabled={isLoading || !vrmRef.current}
          >
            <option value="">Select a motion...</option>
            <option value="idle">Idle</option>
            <option value="walk">Walk</option>
            <option value="run">Run</option>
            <option value="jump">Jump</option>
          </select>
          
          <button 
            onClick={() => handleMotionSelect(selectedMotion)}
            disabled={!selectedMotion || isLoading || !vrmRef.current}
          >
            Play Motion
          </button>
        </div>
      </div>
    </div>
  );
};

export default VRMViewer;
