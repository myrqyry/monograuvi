import React, { useRef, useEffect } from 'react';
import { initWebGL, renderVisuals, cleanupWebGLResources } from '../utils/WebGLUtils';

const Canvas = ({ audioData, visualElements }) => {
    const canvasRef = useRef(null);
    const webglRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const { renderer, scene, camera } = initWebGL(canvas);
        webglRef.current = { renderer, scene, camera };

        let animationFrameId;

        const render = () => {
            if (webglRef.current) {
                renderVisuals(webglRef.current.renderer, webglRef.current.scene, webglRef.current.camera, visualElements);
                animationFrameId = requestAnimationFrame(render);
            }
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            if (webglRef.current) {
                cleanupWebGLResources(webglRef.current.renderer);
            }
        };
    }, []);

    useEffect(() => {
        if (webglRef.current) {
            renderVisuals(webglRef.current.renderer, webglRef.current.scene, webglRef.current.camera, visualElements);
        }
    }, [audioData, visualElements]);

    return (
        <div>
            <canvas ref={canvasRef} width={800} height={600} />
        </div>
    );
};

export default Canvas;
