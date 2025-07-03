// src/App.jsx
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import NodeGraph from './components/NodeGraph';
import NodeLibrary from './components/NodeLibrary';
import MusicPlayer from './components/MusicPlayer';
import ThemeSelector from './components/ThemeSelector';
import Timeline from './components/Timeline';
import useStore from './store';
import './index.css';

function App() {
  const [libraryVisible, setLibraryVisible] = useState(true);
  const [theme, setTheme] = useState('catppuccin-mocha');
  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null);
  const setAudioContext = useStore(state => state.setAudioContext);

  useEffect(() => {
    // Initialize audio context when app loads
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(audioContext);
    
    return () => {
      if (audioContext) audioContext.close();
    };
  }, []);

  return (
    <div className={`app-container theme-${theme}`}>
      <header className="app-header">
        <div className="flex items-center">
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
          <MusicPlayer audioRef={audioRef} onAudioLoad={setAudioUrl} />
          <Timeline audioUrl={audioUrl} />
        </div>
      </div>
    </div>
  );
}

export default App;
