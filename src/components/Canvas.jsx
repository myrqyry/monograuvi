import React, { useRef, useEffect } from 'react';
import { initWebGL, renderVisuals, cleanupWebGLResources } from '../utils/WebGLUtils';

const Canvas = ({ audioData, visualElements }) => {
    const canvasRef = useRef(null);
    const glRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const gl = initWebGL(canvas);
        if (!gl) {
            console.error("Failed to initialize WebGL. Your browser may not support it.");
            return;
        }
        glRef.current = gl;

        let animationFrameId;

        const render = () => {
            if (gl) {
                renderVisuals(gl, audioData, visualElements);
                animationFrameId = requestAnimationFrame(render);
            }
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            if (gl) {
                cleanupWebGLResources(gl);
            }
        };
    }, []);

    useEffect(() => {
        const gl = glRef.current;
        if (gl) {
            renderVisuals(gl, audioData, visualElements);
        }
    }, [audioData, visualElements]);

    return (
        <div>
            <canvas ref={canvasRef} width={800} height={600} style={{ display: glRef.current ? 'block' : 'none' }} />
            {!glRef.current && (
                <p style={{ color: 'red', textAlign: 'center' }}>
                    WebGL is not supported or failed to initialize. Please use a compatible browser.
                </p>
            )}
        </div>
    );
};

export default Canvas;
