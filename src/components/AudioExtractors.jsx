import React from 'react';
import { useState, useEffect } from 'react';
import FFTAnalyzer from '../audio/FFTAnalyzer';
import BeatDetector from '../audio/BeatDetector';
import PitchDetector from '../audio/PitchDetector';

const AudioExtractors = ({ onSelectExtractor }) => {
    const [extractors, setExtractors] = useState([]);

    useEffect(() => {
        const availableExtractors = [
            { id: 'fft-analyzer', name: 'FFT Analyzer', component: FFTAnalyzer },
            { id: 'beat-detector', name: 'Beat Detector', component: BeatDetector },
            { id: 'pitch-detector', name: 'Pitch Detector', component: PitchDetector },
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
                {extractors.map((extractor) => (
                    <li key={extractor.id} onClick={() => handleSelect(extractor)}>
                        {extractor.name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AudioExtractors;
