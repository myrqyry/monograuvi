import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

const VRMViewer = () => {
  const mountRef = useRef(null);
  const vrmRef = useRef(null); // To store the VRM model
  const mixerRef = useRef(null); // To store the AnimationMixer
  const currentActionRef = useRef(null); // To store the current playing animation action

  // Placeholder for animations
  const animations = useRef({});

  // Create simple procedural animations
  const createPlaceholderAnimations = () => {
    // Simple "wave" animation - moves right arm up and down
    const waveBoneName = 'rightUpperArm'; // Adjust bone name based on your VRM model
    const waveTimes = [0, 0.5, 1, 1.5, 2];
    // Assuming Y-up, Z-front for bone. Rotate around Z axis for waving.
    // VRM models often use a T-pose with arms along X-axis.
    // We'll try rotating the shoulder joint.
    const waveValues = [
      0, 0, 0, 1, // Quaternion for no rotation
      0, 0, Math.sin(Math.PI / 4), Math.cos(Math.PI / 4), // Rotate ~45 deg on Z
      0, 0, 0, 1,
      0, 0, Math.sin(-Math.PI / 4), Math.cos(-Math.PI / 4), // Rotate ~-45 deg on Z
      0, 0, 0, 1,
    ];
    const waveTrack = new THREE.QuaternionKeyframeTrack(`${waveBoneName}.quaternion`, waveTimes, waveValues);
    animations.current['wave'] = new THREE.AnimationClip('wave', 2, [waveTrack]);

    // Simple "nod" animation - head up and down
    const nodBoneName = 'head'; // Adjust bone name
    const nodTimes = [0, 0.5, 1];
    // Rotate around X axis for nodding
    const nodValues = [
      0, 0, 0, 1, // No rotation
      Math.sin(-Math.PI / 12), 0, 0, Math.cos(-Math.PI / 12), // Nod down ~15 deg
      0, 0, 0, 1,
    ];
    const nodTrack = new THREE.QuaternionKeyframeTrack(`${nodBoneName}.quaternion`, nodTimes, nodValues);
    animations.current['nod'] = new THREE.AnimationClip('nod', 1, [nodTrack]);

    animations.current['default_idle'] = new THREE.AnimationClip('default_idle', 1, []); // Empty clip for idle
    animations.current['default_dance'] = animations.current['wave']; // Alias for testing
  };

  useEffect(() => {
    createPlaceholderAnimations();
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

    // GLTF Loader
    const loader = new GLTFLoader();
    loader.register((parser) => {
      return new VRMLoaderPlugin(parser);
    });

    // Load VRM model
    const modelUrl = 'https://pixiv.github.io/three-vrm/packages/three-vrm/models/VRM1_Constraint_Twist_Sample.vrm'; // Replace with your VRM model URL

    loader.load(
      modelUrl,
      (gltf) => {
        const vrm = gltf.userData.vrm;
        scene.add(vrm.scene);
        vrmRef.current = vrm;

        // Initialize AnimationMixer
        mixerRef.current = new THREE.AnimationMixer(vrm.scene);

        // Rotate model to face camera
        VRMUtils.rotateVRM0(vrm);

        console.log('VRM model loaded:', vrm);
        // Ensure an initial animation (e.g., idle) is played if desired
        playMotion('default_idle', 0, 0);

      },
      (progress) => console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%'),
      (error) => console.error('Error loading VRM model:', error)
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
    };
  }, []);

  // playMotion API
  const playMotion = (motionId, startOffset = 0, duration = 0) => {
    if (!mixerRef.current || !vrmRef.current) {
      console.warn('Mixer or VRM model not ready for playMotion.');
      return;
    }

    const clip = animations.current[motionId];
    if (!clip) {
      console.warn(`Animation clip "${motionId}" not found.`);
      return;
    }

    console.log(`playMotion called: motionId=${motionId}, startOffset=${startOffset}, duration=${duration}`);

    // Stop previous animation
    if (currentActionRef.current) {
      currentActionRef.current.fadeOut(0.25); // Fade out over 0.25 seconds
    }

    // Get new action
    const newAction = mixerRef.current.clipAction(clip);

    // Configure and play new action
    newAction.reset(); // Reset to start
    newAction.time = startOffset; // Set start time (if applicable to the animation itself)
    newAction.setLoop(THREE.LoopRepeat, Infinity); // Loop for now, duration handling is tricky

    if (duration > 0) {
      // This is a simplification. True duration limiting with AnimationMixer
      // often involves playing once (LoopOnce) and setting newAction.clampWhenFinished = true,
      // or more complex manual stopping via setTimeout.
      // For looping animations, this duration means "let it play, but the *node* considers it active for this long".
      // If the animation is shorter than duration, it will loop.
      // If longer, this logic doesn't currently stop it early.
      // A more robust solution might involve a setTimeout to stop/fade out the action.
      newAction.setEffectiveTimeScale(1);
      newAction.setEffectiveWeight(1);
      newAction.fadeIn(0.25).play();

      // If we want to strictly enforce duration for non-looping or one-shot effects:
      // newAction.setLoop(THREE.LoopOnce, 1);
      // newAction.clampWhenFinished = true;
      // setTimeout(() => {
      //   if (newAction === currentActionRef.current) { // only stop if it's still the current one
      //      newAction.fadeOut(0.25);
      //   }
      // }, duration * 1000 - 250); // stop a bit early to allow fadeOut

    } else if (motionId === 'default_idle' || duration === 0) { // Special handling for idle or "stop"
        // For idle, just play it. If duration is 0, it implies stopping current motion and going to idle.
        newAction.setEffectiveTimeScale(1);
        newAction.setEffectiveWeight(1);
        newAction.fadeIn(0.25).play();
    }


    currentActionRef.current = newAction;
  };

  // Expose playMotion via ref (one way to do it, could also use context or Zustand)
  // This part might need adjustment based on how DanceMotionNode will access it.
  // For now, let's assume a parent component will hold this ref.
  // Or, we can make it a global function for simplicity in early stages.
  window.playVRMMotion = playMotion; // Make it globally accessible for now

  return <div ref={mountRef} style={{ width: '100%', height: '400px', border: '1px solid black' }} />;
};

export default VRMViewer;
