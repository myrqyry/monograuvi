import React, { useEffect, useRef } from 'react';
import { initManager } from '../core/InitializationManager';
import { audioContextManager } from '../core/AudioContextManager';
import { NodeEditor } from 'rete';
import { ReactPlugin, Presets } from 'rete-react-plugin';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin';
import { HistoryPlugin, HistoryExtensions } from 'rete-history-plugin';
import { ContextMenuPlugin, Presets as ContextMenuPresets } from 'rete-context-menu-plugin';
import { DataflowEngine } from 'rete-engine';
import { ClassicPreset } from 'rete';
import { LfoReteNode } from '../nodes/rete/LfoReteNode';
import { EnvelopeReteNode } from '../nodes/rete/EnvelopeReteNode';
import { AudioFilterReteNode } from '../nodes/rete/AudioFilterReteNode';
import { AudioSourceReteNode } from '../nodes/rete/AudioSourceReteNode';
import { LyricTranscriberReteNode } from '../nodes/rete/LyricTranscriberReteNode';
import { PlayheadReteNode } from '../nodes/rete/PlayheadReteNode';
import { DanceMotionReteNode } from '../nodes/rete/DanceMotionReteNode';
import { ParticleSystemReteNode } from '../nodes/rete/ParticleSystemReteNode';
import { WaveformReteNode } from '../nodes/rete/WaveformReteNode';
import { SpectrumVisualizerReteNode } from '../nodes/rete/SpectrumVisualizerReteNode';
import { ShaderEffectReteNode } from '../nodes/rete/ShaderEffectReteNode';
import { GeometryRendererReteNode } from '../nodes/rete/GeometryRendererReteNode';
import { TextAnimatorReteNode } from '../nodes/rete/TextAnimatorReteNode';
import { VideoEffectReteNode } from '../nodes/rete/VideoEffectReteNode';
import { KaleidoscopeReteNode } from '../nodes/rete/KaleidoscopeReteNode';
import { MandalaReteNode } from '../nodes/rete/MandalaReteNode';
import { FlowFieldReteNode } from '../nodes/rete/FlowFieldReteNode';
import { SequencerReteNode } from '../nodes/rete/SequencerReteNode';
import { RandomReteNode } from '../nodes/rete/RandomReteNode';
import { ExpressionReteNode } from '../nodes/rete/ExpressionReteNode';
import { MidiReteNode } from '../nodes/rete/MidiReteNode';
import { ClockReteNode } from '../nodes/rete/ClockReteNode';
import { TriggerReteNode } from '../nodes/rete/TriggerReteNode';
import { VideoRenderReteNode } from '../nodes/rete/VideoRenderReteNode';
import { AudioRenderReteNode } from '../nodes/rete/AudioRenderReteNode';
import { StreamOutputReteNode } from '../nodes/rete/StreamOutputReteNode';
import { FileExportReteNode } from '../nodes/rete/FileExportReteNode';
import { PreviewReteNode } from '../nodes/rete/PreviewReteNode';
import { SocialExportReteNode } from '../nodes/rete/SocialExportReteNode';
import { RealTimeReteNode } from '../nodes/rete/RealTimeReteNode';
import { UnrealBloomReteNode } from "../nodes/rete/UnrealBloomReteNode"; // Corrected import - this was uncommented in prev version

// Three.js Node Imports
import { BoxGeometryNode } from '../threejs/geometry/BoxGeometryNode';
import { SphereGeometryNode } from '../threejs/geometry/SphereGeometryNode';
import { MeshStandardMaterialNode } from '../threejs/materials/MeshStandardMaterialNode';
import { MeshBasicMaterialNode } from '../threejs/materials/MeshBasicMaterialNode';
import { ShaderMaterialNode } from '../threejs/materials/ShaderMaterialNode';
import { AmbientLightNode } from '../threejs/lighting/AmbientLightNode';
import { DirectionalLightNode } from '../threejs/lighting/DirectionalLightNode';
import { PointLightNode } from '../threejs/lighting/PointLightNode';
import { SceneNode } from '../threejs/core/SceneNode';
import { PerspectiveCameraNode } from '../threejs/core/CameraNode'; // Renamed from CameraNode for clarity
import { MeshNode } from '../threejs/core/MeshNode';
import { AnimationNode } from '../threejs/core/AnimationNode';
import { UnrealBloomPassNode } from '../threejs/postprocessing/UnrealBloomPassNode';
import { EffectComposerNode } from '../threejs/postprocessing/EffectComposerNode';
import { SceneRendererNode } from '../threejs/core/SceneRendererNode';
import { RendererNode } from '../threejs/core/RendererNode';

import useStore from '../store';
import NumberControlComponent from './rete_controls/NumberControlComponent';
import SelectControlComponent from './rete_controls/SelectControlComponent';
import CheckboxControlComponent from './rete_controls/CheckboxControlComponent';
import TextControlComponent from './rete_controls/TextControlComponent';
import SimpleVisualComponent from './rete_visuals/SimpleVisualComponent';

// A generic CustomNodeWrapper that can be extended
function CustomNodeWrapper(props) {
  return <Presets.classic.Node {...props} />;
}


export function ReteEditor() {
  const editorContainerRef = useRef(null);
  const setEditorType = useStore(state => state.setEditorType);
  const appAudioContext = useStore(state => state.audioContext);
  const audioContextStatus = useStore(state => state.audioContextStatus);

  const addReteNodeToStore = useStore(state => state.addReteNode);
  const removeReteNodeFromStore = useStore(state => state.removeReteNode);
  const updateReteNodePositionInStore = useStore(state => state.updateReteNodePosition);
  const updateReteNodeDataInStore = useStore(state => state.updateReteNodeData);
  const addReteConnectionToStore = useStore(state => state.addReteConnection);
  const removeReteConnectionFromStore = useStore(state => state.removeReteConnection);
  const setReteGraphState = useStore(state => state.setReteGraphState);

  // New: Initialization state
  const [initState, setInitState] = React.useState('PENDING');
  const [initError, setInitError] = React.useState(null);

  const historyRef = useRef(null);
  const editorRef = useRef(null);
  const dataflowEngineRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const keepProcessingRef = useRef(true);


  const handleProcessGraph = async () => {
    if (editorRef.current && dataflowEngineRef.current) {
      if (!editorRef.current?.toJSON) {
        console.error("ReteEditor: editorRef.current is not a valid NodeEditor instance or toJSON is unavailable.");
        return;
      }
      const graphData = editorRef.current?.toJSON?.();
      if (!graphData) {
        console.error("ReteEditor: Failed to retrieve graph data. editorRef.current is invalid or uninitialized.");
        return;
      }
      try {
        dataflowEngineRef.current.reset();
        await dataflowEngineRef.current.execute(graphData);
      } catch (e) {
        console.error("Error processing graph:", e);
      }
    }
  };

  // Phased initialization effect
  React.useEffect(() => {
    let mounted = true;
    setInitState('INITIALIZING');

    async function initialize() {
      try {
        setEditorType('rete');
        keepProcessingRef.current = true;

        // Phase 1: Create editor and plugins (without waiting for AudioContext)
        const editor = new NodeEditor();
        const area = new AreaPlugin(editorContainerRef.current);
        const connection = new ConnectionPlugin();
        const render = new ReactPlugin();
        const history = new HistoryPlugin();

        editorRef.current = editor;
        historyRef.current = history;

        editor.use(area);

        const handleNodePropertyChangeForZustand = (nodeId, propertyKey, newValue) => {
          updateReteNodeDataInStore(nodeId, { [propertyKey]: newValue });
        };

        // Node setup with dependency injection
        const setupNewNode = (nodeInstance) => {
          if (typeof nodeInstance.setAreaPlugin === 'function') nodeInstance.setAreaPlugin(area);
          if (typeof nodeInstance.setOnPropertyChangeForSync === 'function') nodeInstance.setOnPropertyChangeForSync(handleNodePropertyChangeForZustand);
          if (typeof nodeInstance.setHistoryRef === 'function') nodeInstance.setHistoryRef(history);

          // Inject AudioContext from manager
          if (typeof nodeInstance.setAudioContext === 'function') {
            const ctx = audioContextManager.getContext();
            if (ctx) {
              nodeInstance.setAudioContext(ctx);
            } else {
              // Don't return null. Let the node be created, but in an error state.
              // The node's implementation should handle this state visually.
              nodeInstance.errorState = "AudioContext not ready. Please click 'Enable Audio'.";
            }
          }
          return nodeInstance;
        };

        const contextMenu = new ContextMenuPlugin({
          items: ContextMenuPresets.classic.setup([
            ['Global/Playhead', () => setupNewNode(new PlayheadReteNode())],
            ['Animation/Dance Motion', () => setupNewNode(new DanceMotionReteNode())],
            ['Audio/Audio Source', () => setupNewNode(new AudioSourceReteNode({ isPlaying: false, volume: 0.5 }))],
            ['Audio/Lyric Transcriber', () => setupNewNode(new LyricTranscriberReteNode())],
            ['Audio/Audio Filter', () => setupNewNode(new AudioFilterReteNode())],
            ['Control/LFO', () => setupNewNode(new LfoReteNode({ frequency: 1, waveform: 'sine', sync: false }))],
            ['Control/Envelope', () => setupNewNode(new EnvelopeReteNode())],
            ['Control/Sequencer', () => setupNewNode(new SequencerReteNode())],
            ['Control/Random', () => setupNewNode(new RandomReteNode())],
            ['Control/Expression', () => setupNewNode(new ExpressionReteNode())],
            ['Control/MIDI', () => setupNewNode(new MidiReteNode())],
            ['Control/Clock', () => setupNewNode(new ClockReteNode())],
            ['Control/Trigger', () => setupNewNode(new TriggerReteNode())],
            ['Visual/Particle System', () => setupNewNode(new ParticleSystemReteNode())],
            ['Visual/Waveform', () => setupNewNode(new WaveformReteNode())],
            ['Visual/Spectrum Visualizer', () => setupNewNode(new SpectrumVisualizerReteNode())],
            ['Visual/Shader Effect', () => setupNewNode(new ShaderEffectReteNode())],
            ['Visual/3D Geometry', () => setupNewNode(new GeometryRendererReteNode())],
            ['Visual/Text Animator', () => setupNewNode(new TextAnimatorReteNode())],
            ['Visual/Video Effect', () => setupNewNode(new VideoEffectReteNode())],
            ['Visual/Kaleidoscope', () => setupNewNode(new KaleidoscopeReteNode())],
            ['Visual/Mandala', () => setupNewNode(new MandalaReteNode())],
            ['Visual/Flow Field', () => setupNewNode(new FlowFieldReteNode())],
            ['Visual/Unreal Bloom', () => setupNewNode(new UnrealBloomPassNode())],
            ['Three.js/Core/Renderer', () => setupNewNode(new RendererNode())],
            ['Three.js/Core/Scene', () => setupNewNode(new SceneNode())],
            ['Three.js/Core/Camera', () => setupNewNode(new PerspectiveCameraNode())],
            ['Three.js/Core/Mesh', () => setupNewNode(new MeshNode())],
            ['Three.js/Core/Animation', () => setupNewNode(new AnimationNode())],
            ['Three.js/Core/Scene Renderer', () => setupNewNode(new SceneRendererNode())],
            ['Three.js/Geometry/Box', () => setupNewNode(new BoxGeometryNode())],
            ['Three.js/Geometry/Sphere', () => setupNewNode(new SphereGeometryNode())],
            ['Three.js/Material/Standard', () => setupNewNode(new MeshStandardMaterialNode())],
            ['Three.js/Material/Basic', () => setupNewNode(new MeshBasicMaterialNode())],
            ['Three.js/Material/Shader', () => setupNewNode(new ShaderMaterialNode())],
            ['Three.js/Lighting/Ambient', () => setupNewNode(new AmbientLightNode())],
            ['Three.js/Lighting/Directional', () => setupNewNode(new DirectionalLightNode())],
            ['Three.js/Lighting/Point', () => setupNewNode(new PointLightNode())],
            ['Three.js/PostProcessing/Unreal Bloom', () => setupNewNode(new UnrealBloomPassNode())],
            ['Three.js/PostProcessing/Effect Composer', () => setupNewNode(new EffectComposerNode())],
          ]),
        });

        area.use(contextMenu);
        area.use(connection);
        area.use(render);
        area.use(history);

        connection.addPreset(ConnectionPresets.classic.setup());
        render.addPreset(Presets.classic.setup({
          customize: {
            node(data) {
              return CustomNodeWrapper;
            },
          }
        }));

        HistoryExtensions.keyboard(history);

        const engine = new DataflowEngine({
          resolve(id) { return editor.getNode(id) || null; }
        });
        dataflowEngineRef.current = engine;

        // Set up node selection and other extensions
        const selector = AreaExtensions.selector();
        const accumulating = AreaExtensions.accumulateOnCtrl();
        AreaExtensions.selectableNodes(area, selector, { accumulating });
        AreaExtensions.snapGrid(area, { size: 15 });

        const subs = [
          editor.addPipe(context => {
            if (context.type === 'nodecreated') {
              const node = context.data;
              if (typeof node.onNodeAdded === 'function') {
                node.onNodeAdded();
              }
              setTimeout(async () => {
                try {
                  if (area.addNode) {
                    await area.addNode(node);
                  }
                  const nodeView = area.nodeViews.get(node.id);
                  const position = nodeView ? { ...nodeView.position } : { x: Math.random() * 600, y: Math.random() * 400 };
                  addReteNodeToStore({
                    id: node.id, label: node.label, type: node.constructor.name,
                    position: position,
                    customData: (node.customData && typeof node.customData === 'object') ? { ...node.customData } : {},
                  });
                } catch (e) { console.error("Error during nodecreated sync:", e); }
              }, 0);
            }
            return context;
          }),
          editor.addPipe(context => {
            if (context.type === 'noderemoved') removeReteNodeFromStore(context.data.id);
            return context;
          }),
          area.addPipe(context => {
            if (context.type === 'nodedragged') {
              const nodeView = area.nodeViews.get(context.data.id);
              if (nodeView) updateReteNodePositionInStore(context.data.id, { ...nodeView.position });
            }
            return context;
          }),
          editor.addPipe(context => {
            if (context.type === 'connectioncreated') {
              const c = context.data;
              addReteConnectionToStore({
                id: c.id, source: c.source, sourceOutput: c.sourceOutput,
                target: c.target, targetInput: c.targetInput,
              });
            }
            return context;
          }),
          editor.addPipe(context => {
            if (context.type === 'connectionremoved') removeReteConnectionFromStore(context.data.id);
            return context;
          })
        ];

        const syncGraphToStore = () => {
          const currentGraphSnapshot = editor?.toJSON?.();
          if (!currentGraphSnapshot) {
            console.error("ReteEditor: Failed to retrieve current graph snapshot. editor is invalid or uninitialized.");
            return;
          }
          const nodesForStore = {};
          currentGraphSnapshot.nodes.forEach(n => {
            const nodeInstance = editor.getNode(n.id);
            const nodeView = area.nodeViews.get(n.id);
            nodesForStore[n.id] = {
              id: n.id, label: n.label,
              type: nodeInstance ? nodeInstance.constructor.name : 'UnknownNode',
              position: nodeView ? { ...nodeView.position } : {x:0, y:0},
              customData: (nodeInstance && typeof nodeInstance.customData === 'object') ? { ...nodeInstance.customData } : {}
            };
          });
          const connectionsForStore = currentGraphSnapshot.connections.map(c => ({
            id: c.id, source: c.source, sourceOutput: c.sourceOutput,
            target: c.target, targetInput: c.targetInput,
          }));
          setReteGraphState({ nodes: nodesForStore, connections: connectionsForStore });
        };

        // Listen for node and connection changes to sync with store
        const unsubscribeNodes = editor.addPipe(context => {
          const syncEvents = [
            'nodecreated', 'noderemoved', 'noderemoving',
            'connectioncreated', 'connectionremoved', 'connectionremoving',
            'nodetranslated'
          ];
          if (syncEvents.includes(context.type)) {
            syncGraphToStore();
          }
          return context;
        });

        // Initial nodes (deferred if dependencies missing)
        const initialAudioSourceNode = setupNewNode(new AudioSourceReteNode({isPlaying: false, volume: 0.6, audioUrl: './assets/presets/FPreview.mp3'}));
        if (initialAudioSourceNode) {
          if (editor?.addNode) {
            await editor.addNode(initialAudioSourceNode);
          }
        }
        if (initialAudioSourceNode) {
          await area.translate(initialAudioSourceNode.id, { x: 50, y: 100 });
        }

        const initialVisualNode = setupNewNode(new ParticleSystemReteNode());
        if (initialVisualNode) {
          if (editor?.addNode) {
            await editor.addNode(initialVisualNode);
          }
        }
        if (initialVisualNode) {
          await area.translate(initialVisualNode.id, { x: 350, y: 100 });
        }

        syncGraphToStore();
        history.record();

        setTimeout(() => {
          if (editor.getNodes().length > 0) {
            AreaExtensions.zoomAt(area, editor.getNodes());
          }
        }, 100);

        // Mark editor and plugins as ready
        initManager.setComponentReady('reteEditor', editor);
        initManager.setComponentReady('plugins', { area, connection, render, history });

        setInitState('READY');
      } catch (err) {
        setInitError(err.message || 'Initialization failed');
        setInitState('ERROR');
      }
    }

    initialize();

    return () => {
      mounted = false;
      keepProcessingRef.current = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      // Clean up event listeners
      // ... (same as before)
    };
  }, []);


  // Effect for starting/stopping processing loop based on audioContext availability
  useEffect(() => {
    if (appAudioContext && editorRef.current && dataflowEngineRef.current && !animationFrameIdRef.current) {
      console.log("ReteEditor: AudioContext available, starting processing loop.");
      keepProcessingRef.current = true;

      // Ensure existing nodes get the audio context if they missed it
      editorRef.current.getNodes().forEach(node => {
        if (typeof node.setAudioContext === 'function' && !node.audioContext) {
          node.setAudioContext(appAudioContext);
          // If node was waiting for context to load audio, trigger it now
          if (node instanceof AudioSourceReteNode && node.getProperty('audioUrl') && !node.audioBuffer) {
            node.loadAudio(node.getProperty('audioUrl'));
          }
        }
      });

      const processLoop = async () => {
        if (!keepProcessingRef.current) return;
        await handleProcessGraph();
        animationFrameIdRef.current = requestAnimationFrame(processLoop);
      };
      animationFrameIdRef.current = requestAnimationFrame(processLoop);
    } else if (!appAudioContext && animationFrameIdRef.current) {
      console.log("ReteEditor: AudioContext lost, stopping processing loop.");
      keepProcessingRef.current = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }

    // Cleanup for this effect specifically related to the loop
    return () => {
        keepProcessingRef.current = false;
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
    };
  }, [appAudioContext]); // Re-run this effect when appAudioContext changes

  const handleEnableAudio = async () => {
    try {
      await audioContextManager.requestAndCreateContext();
    } catch (error) {
      console.error("Failed to enable audio:", error);
      setInitError("Could not start audio. Please check browser permissions.");
      setInitState('ERROR');
    }
  };

  return (
    <div style={{ width: '100%', height: '800px', border: '1px solid #ccc', position: 'relative' }}>
      {(initState === 'PENDING' || initState === 'INITIALIZING') && (
        <div className="rete-editor-loading" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', zIndex: 10 }}>
          <div>
            <div className="loading-spinner" style={{ marginBottom: 16 }} />
            <p>Initializing audio-visual editor...</p>
          </div>
        </div>
      )}
      {initState === 'READY' && (audioContextStatus === 'uninitialized' || audioContextStatus === 'suspended') && (
        <div className="rete-audio-prompt" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 20 }}>
          <button onClick={handleEnableAudio} style={{padding: '12px 24px', fontSize: '18px', cursor: 'pointer'}}>
            Click to Enable Audio
          </button>
        </div>
      )}
      {initState === 'ERROR' && (
        <div className="rete-editor-error" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fee', zIndex: 10 }}>
          <div>
            <p style={{ color: '#c00' }}>Failed to initialize editor: {initError}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      )}
      <div ref={editorContainerRef} style={{ width: '100%', height: '100%' }}>
        {/* Rete.js canvas is rendered here */}
      </div>
    </div>
  );
}

export default ReteEditor; // Keep default export for backward compatibility
