import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// Ensure VRMAnimationLoaderPlugin is NOT in the line below
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import MotionLibrary from '../lib/MotionLibrary';
import useStore from '../store';
import Playhead from '../lib/Playhead'; // Added Playhead

const VRMViewer = () => {
  const mountRef = useRef(null);
  const vrmRef = useRef(null);
  const mixerRef = useRef(null);
  const currentActionRef = useRef(null);
  const vmdLoaderRef = useRef(null); // For loading VMDs (using VRMAnimationLoaderPlugin)
  const vmdCacheRef = useRef({}); // Cache for loaded VMD animation clips { [url]: THREE.AnimationClip }

  const [motionLibrary, setMotionLibrary] = useState(null);
  const [availableMotions, setAvailableMotions] = useState([]);
  const [selectedMotionId, setSelectedMotionId] = useState('');
  const [playheadInstance, setPlayheadInstance] = useState(null);

  // Zustand store access
  const {
    danceBlocks, addDanceBlock,
    playheadTime, setPlayheadTime,
    isDancePlaying, setIsDancePlaying
  } = useStore(state => ({
    danceBlocks: state.danceBlocks,
    addDanceBlock: state.addDanceBlock,
    playheadTime: state.playheadTime,
    setPlayheadTime: state.setPlayheadTime,
    isDancePlaying: state.isDancePlaying,
    setIsDancePlaying: state.setIsDancePlaying,
  }));

  // Need to get a stable reference to these for the Playhead
  // Pass state setters directly. For getters, Playhead can call useStore.getState() if needed or be passed functions.
  const getDanceBlocksFromStore = useCallback(() => useStore.getState().danceBlocks, []);
  const getIsDancePlayingFromStore = useCallback(() => useStore.getState().isDancePlaying, []);
  const getPlayheadTimeFromStore = useCallback(() => useStore.getState().playheadTime, []);

  // Updated default model URL to a versioned unpkg link for better stability
  const [vrmModelUrl, setVrmModelUrl] = useState('https://unpkg.com/@pixiv/three-vrm@1.0.11/models/VRM1_Constraint_Twist_Sample.vrm');
  const [loadError, setLoadError] = useState(null); // For displaying errors to the user

  useEffect(() => {
    const lib = new MotionLibrary();
    setMotionLibrary(lib);
    const motions = lib.getAllMotions();
    setAvailableMotions(motions);
    if (motions.length > 0) {
      // setSelectedMotionId(motions[0].id); // Optionally default to first motion's ID
    }
    // createPlaceholderAnimations(); // No longer calling this
    const currentMount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(30.0, currentMount.clientWidth / currentMount.clientHeight, 0.1, 20.0);
    camera.position.set(0.0, 1.0, 5.0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Light
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(light);

    // Initialize VMD Loader (VRMAnimationLoaderPlugin instance)
    // Attempt to access it via VRMUtils
    if (VRMUtils.VRMAnimationLoaderPlugin) {
      vmdLoaderRef.current = new VRMUtils.VRMAnimationLoaderPlugin();
    } else {
      // Fallback or error if not found on VRMUtils - this indicates a deeper issue with the library version or structure
      console.error("VRMAnimationLoaderPlugin not found on VRMUtils. The @pixiv/three-vrm API might have changed or the plugin is located elsewhere.");
      // Optionally, set an error state or prevent further operations that depend on vmdLoaderRef.current
      setLoadError("Failed to initialize VMD animation loader. Animations may not work.");
      // vmdLoaderRef.current will remain null if this path is taken.
    }

    // GLTF Loader for VRM model
    const modelLoader = new GLTFLoader(); // Already correctly named modelLoader here
    modelLoader.register((parser) => {
      return new VRMLoaderPlugin(parser, { autoUpdateHumanBones: true });
    });

    if (!vrmModelUrl) { // If no URL, don't attempt to load
        setLoadError("No VRM model URL specified."); // Or simply clear the scene
        if (vrmRef.current && vrmRef.current.scene) scene.remove(vrmRef.current.scene);
        vrmRef.current = null;
        if (mixerRef.current) mixerRef.current = null; // Reset mixer
        currentActionRef.current = null;
        return;
    }

    console.log(`Attempting to load VRM model from: ${vrmModelUrl}`);
    setLoadError(null); // Clear previous errors before new load attempt

    modelLoader.load( // Corrected to use modelLoader
      vrmModelUrl,
      (gltf) => {
        // Clear previous model and resources
        if (vrmRef.current && vrmRef.current.scene) {
            scene.remove(vrmRef.current.scene);
            // TODO: Proper disposal of old VRM (VRMUtils.deepDispose or similar if available)
        }
        if (mixerRef.current) {
            mixerRef.current.stopAllAction();
        }
        currentActionRef.current = null;

        const vrm = gltf.userData.vrm;
        if (!vrm) {
            console.error("Loaded GLTF is not a VRM model or VRM data is missing.");
            setLoadError("Failed to load VRM: Model data is not valid. Ensure it's a .vrm file.");
            vrmRef.current = null; // Ensure ref is null if load failed
            return;
        }
        scene.add(vrm.scene);
        vrmRef.current = vrm;

        // Initialize AnimationMixer
        mixerRef.current = new THREE.AnimationMixer(vrm.scene);

        // Rotate model to face camera
        VRMUtils.rotateVRM0(vrm);
        console.log('VRM model loaded:', vrm);

        // Initialize Playhead
        // playVRMMotion needs to be defined before Playhead is instantiated if passed directly.
        // We'll define playVRMMotion wrapped in useCallback later.
        // For now, ensure playVRMMotion function is stable or Playhead uses a callback to get it.
        // The playVRMMotion defined further down will be used.
        const ph = new Playhead({
          getDanceBlocks: getDanceBlocksFromStore,
          setPlayheadTime, // Pass setter from Zustand
          setIsDancePlaying, // Pass setter from Zustand
          playVRMMotion: (...args) => memoizedPlayVRMMotion(...args), // Will use the memoized version
          getIsDancePlaying: getIsDancePlayingFromStore,
          getPlayheadTime: getPlayheadTimeFromStore,
        });
        setPlayheadInstance(ph);
        setLoadError(null); // Clear error on successful load

      },
      (progress) => console.log('Loading VRM model...', 100.0 * (progress.loaded / progress.total), '%'),
      (error) => {
        console.error('Error loading VRM model:', error);
        setLoadError(`Failed to load VRM: ${error.message || 'Unknown error'}. Check console for details.`);
        vrmRef.current = null; // Ensure ref is null on error
        if (mixerRef.current) mixerRef.current = null;
      }
    );

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (vrmRef.current) {
        vrmRef.current.update(delta);
      }
      if (mixerRef.current) {
        mixerRef.current.update(delta); // Update animation mixer
      }
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      currentMount.removeChild(renderer.domElement);
      renderer.dispose();
      // Revoke object URL if it was created for the current model
      if (vrmModelUrl && vrmModelUrl.startsWith('blob:')) {
        URL.revokeObjectURL(vrmModelUrl);
      }
    };
  }, [vrmModelUrl, getDanceBlocksFromStore, getIsDancePlayingFromStore, getPlayheadTimeFromStore, setPlayheadTime, setIsDancePlaying]); // Added vrmModelUrl

  // playVRMMotion API - now attempts to load and play VMDs
  const memoizedPlayVRMMotion = useCallback(async (motionUrl, startOffset = 0, duration = 0) => {
    setLoadError(null); // Clear errors when trying to play a motion

    if (!vrmRef.current) { // Check if VRM model is loaded first
        setLoadError("Cannot play motion: No VRM model loaded.");
        console.warn("Cannot play motion: No VRM model loaded.");
        return;
    }
    if (!mixerRef.current || !vmdLoaderRef.current) { // These should be set if vrmRef.current is set
      const message = 'VRM resources (mixer/loader) not ready. This usually indicates an issue with model loading.';
      console.warn(message);
      setLoadError(message);
      return;
    }

    if (motionUrl === 'default_idle') {
      if (currentActionRef.current) {
        // Fade out current action and then set it to null
        // Ensure it doesn't conflict if another motion starts immediately
        const actionToFade = currentActionRef.current;
        actionToFade.fadeOut(0.25);
        setTimeout(() => {
          if (currentActionRef.current === actionToFade) { // only nullify if it's still the same one
            currentActionRef.current = null;
          }
        }, 250);
      }
      console.log("Playing default idle (fading out current action).");
      return;
    }

    console.log(`playVRMMotion: Loading/Playing ${motionUrl}`);

    try {
      let clip = vmdCacheRef.current[motionUrl];

      if (!clip) {
        console.log(`VMD cache miss for ${motionUrl}. Loading...`);
        const response = await fetch(motionUrl);
        if (!response.ok) throw new Error(`Failed to fetch VMD ${motionUrl}: ${response.statusText}`);
        const vmdBuffer = await response.arrayBuffer();

        // Use the vmdLoaderRef (VRMAnimationLoaderPlugin instance)
        const vrmAnimation = await vmdLoaderRef.current.parse(vmdBuffer, vrmRef.current); // Pass current VRM

        if (!vrmAnimation || vrmAnimation.clips.length === 0) {
            throw new Error(`Failed to parse VMD ${motionUrl} or no animation clips found.`);
        }
        clip = vrmAnimation.clips[0];
        clip.name = motionUrl;
        vmdCacheRef.current[motionUrl] = clip;
        console.log(`Loaded and cached VMD: ${motionUrl}`, clip);
      } else {
        console.log(`VMD cache hit for ${motionUrl}.`);
      }

      // Stop current animation before playing next, unless it's the same clip
      if (currentActionRef.current && currentActionRef.current.getClip() !== clip) {
        currentActionRef.current.fadeOut(0.25);
      }

      const newAction = mixerRef.current.clipAction(clip);
      newAction.reset();
      newAction.setLoop(THREE.LoopRepeat, Infinity);
      newAction.time = startOffset;
      newAction.clampWhenFinished = false;
      newAction.weight = 1.0; // Ensure full weight
      newAction.fadeIn(0.25).play();

      currentActionRef.current = newAction;

    } catch (error) {
      console.error(`Error playing motion ${motionUrl}:`, error);
      setLoadError(`Failed to play motion ${motionUrl}: ${error.message || 'Unknown error'}. Check console.`);
      if (currentActionRef.current) {
         const actionToFade = currentActionRef.current;
         actionToFade.fadeOut(0.25);
         setTimeout(() => { // Ensure fadeOut completes before nullifying if it's the same action
            if(currentActionRef.current === actionToFade) currentActionRef.current = null;
         }, 250);
      }
    }
  }, [vrmRef, mixerRef, vmdLoaderRef]); // Dependencies are refs, but including them for strictness.

  const preloadVmd = useCallback(async (motionUrl) => {
    if (!vmdLoaderRef.current || !vrmRef.current) { // Need vrmRef for parsing context even if not playing
      console.warn('VMD Loader or VRM model not ready for preloading.');
      return null;
    }
    if (vmdCacheRef.current[motionUrl]) {
      console.log(`VMD Preload: Cache hit for ${motionUrl}`);
      return vmdCacheRef.current[motionUrl];
    }

    console.log(`VMD Preload: Cache miss for ${motionUrl}. Preloading...`);
    try {
      const response = await fetch(motionUrl);
      if (!response.ok) throw new Error(`Failed to fetch VMD ${motionUrl}: ${response.statusText}`);
      const vmdBuffer = await response.arrayBuffer();
      const vrmAnimation = await vmdLoaderRef.current.parse(vmdBuffer, vrmRef.current);

      if (!vrmAnimation || vrmAnimation.clips.length === 0) {
        throw new Error(`Failed to parse VMD ${motionUrl} or no animation clips found during preload.`);
      }
      const clip = vrmAnimation.clips[0];
      clip.name = motionUrl; // For debugging
      vmdCacheRef.current[motionUrl] = clip;
      console.log(`VMD Preload: Successfully preloaded and cached ${motionUrl}`);
      return clip;
    } catch (error) {
      console.error(`VMD Preload: Error preloading ${motionUrl}:`, error);
      // Optionally set a non-critical error state or log for monitoring
      // setLoadError(`Failed to preload motion ${motionUrl}: ${error.message}`); // Avoid spamming UI for background errors
      return null;
    }
  }, [vrmRef, vmdLoaderRef]); // Depends on vrmRef (for parsing context) and vmdLoaderRef

  // Expose globally FOR DEBUGGING & inter-module access (e.g., from DanceMotionNode) - consider context/store for cleaner approach
  useEffect(() => {
    window.playVRMMotion = memoizedPlayVRMMotion;
    window.preloadVRMMotionData = preloadVmd; // Expose preloader
    return () => {
      delete window.playVRMMotion;
      delete window.preloadVRMMotionData;
    };
  }, [memoizedPlayVRMMotion, preloadVmd]);


  const handleMotionSelectChange = (event) => {
    const mId = event.target.value;
    setSelectedMotionId(mId);
    if (mId && motionLibrary) {
      const motion = motionLibrary.getMotionById(mId);
      if (motion) {
        memoizedPlayVRMMotion(motion.url, 0, motion.duration || 0);
      }
    } else if (!mId) {
        memoizedPlayVRMMotion('default_idle', 0, 0);
    }
  };

  const handleAddMotionToTimeline = () => {
    if (!selectedMotionId || !motionLibrary) {
      alert("Please select a motion first.");
      return;
    }
    const motion = motionLibrary.getMotionById(selectedMotionId);
    if (!motion) {
      alert("Selected motion not found in library.");
      return;
    }

    let calculatedStartTime = 0;
    if (danceBlocks.length > 0) {
      const lastBlock = danceBlocks[danceBlocks.length - 1];
      calculatedStartTime = lastBlock.startTime + lastBlock.duration;
    }

    const SNAP_INTERVAL = 0.5; // seconds
    const newStartTime = Math.max(0, Math.round(calculatedStartTime / SNAP_INTERVAL) * SNAP_INTERVAL);

    const newBlock = {
      id: crypto.randomUUID(),
      motionId: motion.id,
      motionUrl: motion.url, // Denormalize URL for easier access by player
      startTime: newStartTime, // Use snapped start time
      duration: motion.duration || 5.0, // Use motion's duration or a default
    };
    addDanceBlock(newBlock);

    // Preload the VMD when added to timeline
    if (motion.url && vrmRef.current) { // Check if VRM model is loaded before trying to preload
        preloadVmd(motion.url);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>VRM Loader & Motion Controls</h3>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="vrm-loader-input">Load VRM Model (.vrm): </label>
          <input
            type="file"
            id="vrm-loader-input"
            accept=".vrm"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const objectURL = URL.createObjectURL(file);
                // Revoke previous object URL if it exists and is a blob URL, to prevent memory leaks
                if (vrmModelUrl && vrmModelUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(vrmModelUrl);
                }
                setVrmModelUrl(objectURL);
                e.target.value = null; // Reset file input
              }
            }}
          />
        </div>

        {loadError && <div style={{ color: 'red', marginBottom: '10px', padding: '5px', border: '1px solid red', backgroundColor: '#ffe0e0' }}>Error: {loadError}</div>}

        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="motion-select">Select Motion (for preview/adding): </label>
          <select
            id="motion-select"
            value={selectedMotionId}
            onChange={handleMotionSelectChange}
            disabled={!vrmRef.current} // Disable if no VRM loaded
          >
            <option value="">-- Select a motion --</option>
            {availableMotions.map((motion) => (
              <option key={motion.id} value={motion.id}>
                {motion.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddMotionToTimeline}
            style={{ marginLeft: '10px' }}
            disabled={!selectedMotionId || !vrmRef.current}
          >
            Add Selected to Timeline
          </button>
          <button
            onClick={() => {
              if (selectedMotionId && motionLibrary && vrmRef.current) {
                const motion = motionLibrary.getMotionById(selectedMotionId);
                if (motion) memoizedPlayVRMMotion(motion.url, 0, motion.duration || 0);
              }
            }}
            style={{ marginLeft: '10px' }}
            disabled={!selectedMotionId || !vrmRef.current}
          >
            Preview Selected
          </button>
        </div>
        <div>
            <h4>Timeline Controls</h4>
            <button
                onClick={() => playheadInstance?.start()}
                disabled={isDancePlaying || danceBlocks.length === 0 || !vrmRef.current}
            >Play Timeline</button>
            <button
                onClick={() => playheadInstance?.stop()}
                disabled={!isDancePlaying || !vrmRef.current}
                style={{ marginLeft: '5px' }}
            >Stop Timeline</button>
            <button
                onClick={() => playheadInstance?.reset()}
                disabled={!vrmRef.current}
                style={{ marginLeft: '5px' }}
            >Reset Timeline (to 0s)</button>
            <span style={{ marginLeft: '15px', fontFamily: 'monospace' }}>Time: {playheadTime.toFixed(2)}s</span>
        </div>
      </div>

      <div ref={mountRef} style={{ width: '100%', height: '300px', border: '1px solid black', backgroundColor: '#eee' }}>
        {!vrmRef.current && !loadError && <div style={{padding: '10px', color: '#555'}}>Load a VRM model using the button above.</div>}
        {/* Error during model load is shown above, this is more for initial state or if model becomes null */}
      </div>

      <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>Dance Timeline (Simple View)</h3>
        {danceBlocks.length === 0 ? (
          <p>Timeline is empty. Add motions using the controls above.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {danceBlocks.map((block) => (
              <li key={block.id} style={{ marginBottom: '5px', padding: '5px', background: '#f0f0f0' }}>
                <strong>ID:</strong> {block.motionId} ({motionLibrary?.getMotionById(block.motionId)?.name}) <br />
                <strong>Start:</strong> {block.startTime.toFixed(1)}s,
                <strong>Duration:</strong> {block.duration.toFixed(1)}s <br />
                {/* Add a remove button later if needed */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VRMViewer;
