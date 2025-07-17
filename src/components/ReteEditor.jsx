import React, { useEffect, useRef } from 'react';
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

  const addReteNodeToStore = useStore(state => state.addReteNode);
  const removeReteNodeFromStore = useStore(state => state.removeReteNode);
  const updateReteNodePositionInStore = useStore(state => state.updateReteNodePosition);
  const updateReteNodeDataInStore = useStore(state => state.updateReteNodeData);
  const addReteConnectionToStore = useStore(state => state.addReteConnection);
  const removeReteConnectionFromStore = useStore(state => state.removeReteConnection);
  const setReteGraphState = useStore(state => state.setReteGraphState);
  const appAudioContext = useStore(state => state.audioContext); // Use hook to get audioContext

  const historyRef = useRef(null);
  const editorRef = useRef(null);
  const dataflowEngineRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const keepProcessingRef = useRef(true); // To control the animation loop

  const handleProcessGraph = async () => {
    if (editorRef.current && dataflowEngineRef.current) {
      if (!editorRef.current?.toJSON) {
      console.error("ReteEditor: editorRef.current is not a valid NodeEditor instance or toJSON is unavailable.");
      return;
    }
    const graphData = editorRef.current.toJSON();
      try {
        dataflowEngineRef.current.reset();
        await dataflowEngineRef.current.execute(graphData);
      } catch (e) {
        console.error("Error processing graph:", e);
      }
    }
  };

  // Effect for initializing and cleaning up the Rete editor
  useEffect(() => {
    if (!editorContainerRef.current) return;

    setEditorType('rete');
    keepProcessingRef.current = true;

    const editor = new NodeEditor();
    const area = new AreaPlugin(editorContainerRef.current);
    const connection = new ConnectionPlugin();
    const render = new ReactPlugin();
    const history = new HistoryPlugin();

    editorRef.current = editor;
    historyRef.current = history;

    // This is the crucial part: editor must use the area plugin
    // BEFORE the area plugin uses other plugins. This establishes the parent scope.
    editor.use(area);

    const handleNodePropertyChangeForZustand = (nodeId, propertyKey, newValue) => {
      updateReteNodeDataInStore(nodeId, { [propertyKey]: newValue });
    };

    const setupNewNode = (nodeInstance) => {
      // General setup for all nodes
      if (typeof nodeInstance.setAreaPlugin === 'function') nodeInstance.setAreaPlugin(area);
      if (typeof nodeInstance.setOnPropertyChangeForSync === 'function') nodeInstance.setOnPropertyChangeForSync(handleNodePropertyChangeForZustand);
      if (typeof nodeInstance.setHistoryRef === 'function') nodeInstance.setHistoryRef(history);

      // Specific setup
      if (typeof nodeInstance.setAudioContext === 'function') {
        if (appAudioContext) { // appAudioContext is from useStore hook now
          nodeInstance.setAudioContext(appAudioContext);
        } else {
          console.warn("ReteEditor: AudioContext not yet available for node:", nodeInstance.label);
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
      ]),
    });

    // Now, register plugins with the area
    area.use(contextMenu);
    area.use(connection);
    area.use(render);
    area.use(history);

    // Configure plugins
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
              await area.area.renderNode(node);
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
        const currentGraphSnapshot = editor.toJSON();
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

    const processLoop = async () => {
      if (!keepProcessingRef.current || !editorRef.current || !dataflowEngineRef.current) return;
      await handleProcessGraph();
      animationFrameIdRef.current = requestAnimationFrame(processLoop);
    };

    (async () => {
      const initialAudioSourceNode = setupNewNode(new AudioSourceReteNode({isPlaying: false, volume: 0.6, audioUrl: './assets/presets/FPreview.mp3'}));
      await editor.addNode(initialAudioSourceNode);
      await area.translate(initialAudioSourceNode.id, { x: 50, y: 100 });

      const initialVisualNode = setupNewNode(new ParticleSystemReteNode());
      await editor.addNode(initialVisualNode);
      await area.translate(initialVisualNode.id, { x: 350, y: 100 });

      syncGraphToStore();
      history.record();

      setTimeout(() => {
        if (editor.getNodes().length > 0) {
            AreaExtensions.zoomAt(area, editor.getNodes());
        }
        // Processing loop will be started by the audioContext effect if context is available
      }, 100);
    })();

    return () => {
      // Stop processing loop first
      keepProcessingRef.current = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      
      // Clean up event listeners
      subs.forEach(unsub => {
        try {
          unsub();
        } catch (e) {
          console.warn("Error during event listener cleanup:", e);
        }
      });
      
      if (unsubscribeNodes) {
        try {
          unsubscribeNodes();
        } catch (e) {
          console.warn("Error during node subscription cleanup:", e);
        }
      }

      // Destroy instances in reverse order of creation
      try {
        if (history) {
          history.destroy();
          historyRef.current = null;
        }
        if (render) render.destroy();
        if (connection) connection.destroy();
        if (area) area.destroy();
        if (editor) {
          editor.destroy();
          editorRef.current = null;
        }
        dataflowEngineRef.current = null;
      } catch (e) {
        console.warn("Error during plugin cleanup:", e);
      }
    };

  }, []); // Initial setup effect, runs once

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

  return (
    <div style={{ width: '100%', height: '800px', border: '1px solid #ccc', position: 'relative' }}>
      <div ref={editorContainerRef} style={{ width: '100%', height: '100%' }}>
        {/* Rete.js canvas */}
      </div>
    </div>
  );
}

export default ReteEditor; // Keep default export for backward compatibility
