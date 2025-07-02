import React, { useState } from 'react';
import './node-graph.css';
import AudioExtractors from './AudioExtractors';
import VisualElements from './VisualElements';

const NodeGraph = () => {
    const [audioNodes, setAudioNodes] = useState([]);
    const [visualNodes, setVisualNodes] = useState([]);

    const addAudioNode = (node) => {
        setAudioNodes([...audioNodes, node]);
    };

    const addVisualNode = (node) => {
        setVisualNodes([...visualNodes, node]);
    };

    return (
        <div className="node-graph">
            <div className="audio-extractors">
                <h2>Audio Feature Extractors</h2>
                <AudioExtractors onAddNode={addAudioNode} />
            </div>
            <div className="visual-elements">
                <h2>Visual Elements</h2>
                <VisualElements onAddNode={addVisualNode} />
            </div>
            <div className="node-connections">
                {/* Render connections between audioNodes and visualNodes here */}
            </div>
        </div>
    );
};

export default NodeGraph;