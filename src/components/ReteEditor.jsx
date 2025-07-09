import React, { useEffect, useRef } from 'react';
import { NodeEditor } from 'rete';
import { ReactPlugin, Presets, ReactArea2D } from 'rete-react-plugin';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin, ClassicPreset as ConnectionClassicPreset } from 'rete-connection-plugin';
import { HistoryPlugin, ClassicPreset as HistoryClassicPreset } from 'rete-history-plugin';
import { ContextMenuPlugin, Presets as ContextMenuPresets } from 'rete-context-menu-plugin';
import { DataflowEngine } from 'rete-engine';
import { LfoReteNode } from '../nodes/rete/LfoReteNode';
import { EnvelopeReteNode } from '../nodes/rete/EnvelopeReteNode';
import { AudioFilterReteNode } from '../nodes/rete/AudioFilterReteNode';
import { SimpleVisualReteNode } from '../nodes/rete/SimpleVisualReteNode';
import { AudioSourceReteNode } from '../nodes/rete/AudioSourceReteNode';
import useStore from '../store';
import NumberControlComponent from './rete_controls/NumberControlComponent';
import SelectControlComponent from './rete_controls/SelectControlComponent';
import CheckboxControlComponent from './rete_controls/CheckboxControlComponent';
import TextControlComponent from './rete_controls/TextControlComponent';
import SimpleVisualComponent from './rete_visuals/SimpleVisualComponent';

function CustomNodeWrapper(props) {
  const { data } = props;
  if (data instanceof SimpleVisualReteNode) {
    return (
      <Presets.classic.Node {...props}>
        <SimpleVisualComponent data={data} />
      </Presets.classic.Node>
    );
  }
  return <Presets.classic.Node {...props} />;
}


export function ReteEditorComponent() {
  const editorContainerRef = useRef(null);

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
    if (!editorContainerRef.current) return null;
    keepProcessingRef.current = true; // Ensure processing is enabled on setup

    const editor = new NodeEditor();
    editorRef.current = editor;
    const area = new AreaPlugin(editorContainerRef.current);
    const connection = new ConnectionPlugin();
    const render = new ReactPlugin();
    const history = new HistoryPlugin();
    historyRef.current = history;

    const engine = new DataflowEngine({
        resolve(id) { return editor.getNode(id) || null; }
    });
    dataflowEngineRef.current = engine;

    const handleNodePropertyChangeForZustand = (nodeId, propertyKey, newValue) => {
      updateReteNodeDataInStore(nodeId, { [propertyKey]: newValue });
    };

    const setupNewNode = (nodeInstance) => {
      if (typeof nodeInstance.setAreaPlugin === 'function') nodeInstance.setAreaPlugin(area);
      if (typeof nodeInstance.setOnPropertyChangeForSync === 'function') nodeInstance.setOnPropertyChangeForSync(handleNodePropertyChangeForZustand);
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
        ['Audio Source Node', () => setupNewNode(new AudioSourceReteNode({isPlaying: false, volume: 0.5}))],
        ['LFO Node', () => setupNewNode(new LfoReteNode({ frequency: 1, waveform: 'sine', sync: false }))],
        ['Envelope Node', () => setupNewNode(new EnvelopeReteNode())],
        ['Audio Filter Node', () => setupNewNode(new AudioFilterReteNode())],
        ['Simple Visual Node', () => setupNewNode(new SimpleVisualReteNode())],
      ]),
    });
    area.use(contextMenu);

    AreaExtensions.selectableNodes(area, AreaExtensions.classic.select(), {
      accumulating: AreaExtensions.classic.accumulatingNewTag(),
    });
    AreaExtensions.history({ H: HistoryPlugin, keyboard: true })(area);

    render.addPreset(Presets.classic.setup({
      node: CustomNodeWrapper,
      control(data) {
        const node = data.element;
        const controlKey = data.payload.key;
        if (node && node.controlStore && node.controlStore[controlKey]) {
          const controlConfig = node.controlStore[controlKey];
          const propsForComponent = {
            value: node.getProperty(controlKey),
            label: controlConfig.label,
            onChange: (newValue) => {
              node.setPropertyAndRecord(controlKey, newValue, historyRef.current);
            },
            options: controlConfig.options,
            controlKey: controlKey,
          };
          if (controlConfig.type === 'number') return <NumberControlComponent data={propsForComponent} />;
          if (controlConfig.type === 'enum') return <SelectControlComponent data={propsForComponent} />;
          if (controlConfig.type === 'boolean') return <CheckboxControlComponent data={propsForComponent} />;
          if (controlConfig.type === 'string') return <TextControlComponent data={propsForComponent} />;
        }
        return Presets.classic.Control;
      }
    }));

    history.addPreset(HistoryClassicPreset.setup());

    editor.use(area);
    area.use(connection);
    area.use(render);
    area.use(history);
    connection.addPreset(ConnectionClassicPreset.setup());

    const subs = [
      editor.addPipe(context => {
        if (context.type === 'nodecreated') {
          const node = context.data;
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

    history.on('change', syncGraphToStore);

    const processLoop = async () => {
      if (!keepProcessingRef.current || !editorRef.current || !dataflowEngineRef.current) return;
      await handleProcessGraph();
      animationFrameIdRef.current = requestAnimationFrame(processLoop);
    };

    (async () => {
      const initialAudioSourceNode = setupNewNode(new AudioSourceReteNode({isPlaying: false, volume: 0.6, audioUrl: './assets/presets/FPreview.mp3'}));
      await editor.addNode(initialAudioSourceNode);
      await area.translate(initialAudioSourceNode.id, { x: 50, y: 100 });

      const initialVisualNode = setupNewNode(new SimpleVisualReteNode({ baseColor: 'red' }));
      await editor.addNode(initialVisualNode);
      await area.translate(initialVisualNode.id, { x: 350, y: 100 });

      syncGraphToStore();
      history.record();

      setTimeout(() => {
        AreaExtensions.zoomAt(area, editor.getNodes());
        // Processing loop will be started by the audioContext effect if context is available
      }, 100);
    })();

    return () => {
      keepProcessingRef.current = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      subs.forEach(unsubscribe => unsubscribe());
      history.off('change', syncGraphToStore);
      if (dataflowEngineRef.current) dataflowEngineRef.current.reset();
      if (area && typeof area.destroy === 'function') area.destroy();
      if (editor && typeof editor.destroy === 'function') editor.destroy();
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

export default ReteEditorComponent;
