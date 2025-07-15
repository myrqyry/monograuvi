// src/App.jsx
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import ReteEditorComponent from './components/ReteEditor'; // Import Rete Editor
import NodeLibrary from './components/NodeLibrary';
import MotionLibraryDisplay from './components/MotionLibraryDisplay';
import MusicPlayer from './components/MusicPlayer';
import ThemeSelector from './components/ThemeSelector';
import WaveformTimeline from './components/WaveformTimeline';
import useStore from './store';
import './index.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Lazy load VRMViewer component
const LazyVRMViewer = React.lazy(() => import('./components/VRMViewer'));

function App() {
  const [libraryVisible, setLibraryVisible] = useState(true);
  const [isVRMViewerVisible, setIsVRMViewerVisible] = useState(false); // Start with VRM viewer hidden
  const [hasVRMNode, setHasVRMNode] = useState(false); // Track if VRM node is added
  const [theme, setTheme] = useState('catppuccin-mocha');
  const audioRef = useRef(null);
  const [audioContext, setLocalAudioContext] = useState(null);

  const toggleVRMViewerVisibility = () => {
    setIsVRMViewerVisible(prev => !prev);
  };

  return (
    <> {/* Use Fragment to allow ToastContainer at the same level as app-container */}
      <div className={`app-container theme-${theme}`}>
        <header className="app-header">
          <div className="flex items-center">
          <button 
            onClick={() => setLibraryVisible(!libraryVisible)}
            className="toggle-library-btn"
            title={libraryVisible ? "Hide Node Library" : "Show Node Library"}
          >
            {libraryVisible ? (
              <i className="ri-layout-left-line"></i>
            ) : (
              <i className="ri-layout-grid-line"></i>
            )}
          </button>
          <button
            onClick={toggleVRMViewerVisibility}
            className="toggle-vrm-viewer-btn" // Added a class for potential specific styling
            title={isVRMViewerVisible ? "Hide VRM Viewer" : "Show VRM Viewer"}
          >
            {isVRMViewerVisible ? (
              <i className="ri-user-voice-fill"></i> // Icon for when VRM viewer is visible
            ) : (
              <i className="ri-user-voice-line"></i> // Icon for when VRM viewer is hidden
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
            <MotionLibraryDisplay /> {/* Added this line */}
          </div>
        )}
        <div className={`graph-area ${libraryVisible ? '' : 'full-width'} ${!isVRMViewerVisible ? 'vrm-closed-expand' : ''}`}>
          <ReteEditorComponent /> {/* Render Rete.js editor */}
        </div>
        {isVRMViewerVisible && (
          <div className="vrm-viewer-area">
            <React.Suspense fallback={<div className="vrm-loading">Loading VRM Viewer...</div>}>
              <LazyVRMViewer toggleVisibility={toggleVRMViewerVisibility} />
            </React.Suspense>
          </div>
        )}
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
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored" // Or "light", "dark" depending on your app's theme system
    />
    </>
  );
}

export default App;
