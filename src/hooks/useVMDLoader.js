import { useState, useCallback } from 'react';
import * as THREE from 'three';
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader';
import { VRM, VRMUtils } from '@pixiv/three-vrm';

export const useVMDLoader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadVMD = useCallback(async (vmdUrl, vrm) => {
    if (!vrm) {
      setError('VRM model not available for VMD loading.');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const loader = new MMDLoader();
      const vmd = await loader.loadAsync(vmdUrl);
      const clip = vmd.clip;

      // Create a new AnimationClip
      const animationClip = VRMUtils.convertVmdToAnimationClip(clip, vrm);

      return animationClip;
    } catch (e) {
      console.error('Error loading VMD:', e);
      setError(`Failed to load VMD: ${e.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { loadVMD, isLoading, error };
};
