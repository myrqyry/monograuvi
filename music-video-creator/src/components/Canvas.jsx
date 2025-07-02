import React, { useRef, useEffect } from 'react';
import { initWebGL, renderVisuals } from '../utils/WebGLUtils';

const Canvas = ({ audioData, visualElements }) => {
    const canvasRef = useRef(null);
    const glRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const gl = initWebGL(canvas);
        glRef.current = gl;

        const render = () => {
            if (gl) {
                renderVisuals(gl, audioData, visualElements);
                requestAnimationFrame(render);
            }
        };

        render();

        return () => {
            if (gl) {
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
        };
    }, [audioData, visualElements]);

    return <canvas ref={canvasRef} width={800} height={600} />;
};

export default Canvas;