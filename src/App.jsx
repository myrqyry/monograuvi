// src/App.jsx
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import NodeGraph from './components/NodeGraph';
import NodeLibrary from './components/NodeLibrary';
import MusicPlayer from './components/MusicPlayer';
import ThemeSelector from './components/ThemeSelector';
import WaveformTimeline from './components/WaveformTimeline';
import useStore from './store';
import './index.css';

function App() {
  const [libraryVisible, setLibraryVisible] = useState(true);
  const [theme, setTheme] = useState('catppuccin-mocha');
  const audioRef = useRef(null);
  const setAudioContext = useStore(state => state.setAudioContext);

  const [audioContext, setLocalAudioContext] = useState(null);

  const initializeAudioContext = () => {
    if (!audioContext) {
      const newAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      setLocalAudioContext(newAudioContext);
      setAudioContext(newAudioContext);
    }
  };

  return (
    <div className={`app-container theme-${theme}`}>
      <header className="app-header">
        <div className="flex items-center">
          <button 
            onClick={initializeAudioContext}
            className="initialize-audio-btn"
          >
            Initialize Audio
          </button>
          <button 
            onClick={() => setLibraryVisible(!libraryVisible)}
            className="toggle-library-btn"
          >
            {libraryVisible ? (
              <i className="ri-layout-left-line"></i>
            ) : (
              <i className="ri-layout-grid-line"></i>
            )}
          </button>
          <h1 className="app-title">monograuvi</h1>
        </div>
        <ThemeSelector currentTheme={theme} onChangeTheme={setTheme} />
      </header>

      <div className="main-content">
        {libraryVisible && (
          <div className="node-library-panel">
            <NodeLibrary />
          </div>
        )}
        <div className={`graph-area ${libraryVisible ? '' : 'full-width'}`}>
          <NodeGraph audioRef={audioRef} />
        </div>
      </div>

      <div className="control-bar-container">
        <div className="combined-controls">
          <MusicPlayer 
            audioRef={audioRef} 
            onAudioLoad={() => {}} 
          />
        </div>
      </div>
    </div>
  );
}

export default App;
