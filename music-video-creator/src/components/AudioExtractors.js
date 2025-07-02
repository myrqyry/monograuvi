import React from 'react';
import { useState, useEffect } from 'react';
import FFTAnalyzer from '../audio/FFTAnalyzer';
import BeatDetector from '../audio/BeatDetector';
import PitchDetector from '../audio/PitchDetector';

const AudioExtractors = ({ onSelectExtractor }) => {
    const [extractors, setExtractors] = useState([]);

    useEffect(() => {
        const availableExtractors = [
            { name: 'FFT Analyzer', component: FFTAnalyzer },
            { name: 'Beat Detector', component: BeatDetector },
            { name: 'Pitch Detector', component: PitchDetector },
        ];
        setExtractors(availableExtractors);
    }, []);

    const handleSelect = (extractor) => {
        onSelectExtractor(extractor);
    };

    return (
        <div className="audio-extractors">
            <h2>Audio Feature Extractors</h2>
            <ul>
                {extractors.map((extractor, index) => (
                    <li key={index} onClick={() => handleSelect(extractor)}>
                        {extractor.name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AudioExtractors;