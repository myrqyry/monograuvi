import React, { useEffect, useRef } from 'react';
import { NodeEditor } from 'rete';
import { ReactPlugin, Presets } from 'rete-react-plugin';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin, ClassicPreset as ConnectionClassicPreset } from 'rete-connection-plugin';
import { HistoryPlugin, ClassicPreset as HistoryClassicPreset } from 'rete-history-plugin';
import { ContextMenuPlugin, Presets as ContextMenuPresets } from 'rete-context-menu-plugin';
import { LfoReteNode } from '../nodes/rete/LfoReteNode';
import useStore from '../store';
import NumberControlComponent from './rete_controls/NumberControlComponent';
import SelectControlComponent from './rete_controls/SelectControlComponent';
import CheckboxControlComponent from './rete_controls/CheckboxControlComponent'; // Import Checkbox control

export function ReteEditorComponent() {
  const editorContainerRef = useRef(null);

  const addReteNodeToStore = useStore(state => state.addReteNode);
  const removeReteNodeFromStore = useStore(state => state.removeReteNode);
  const updateReteNodePositionInStore = useStore(state => state.updateReteNodePosition);
  const updateReteNodeDataInStore = useStore(state => state.updateReteNodeData);
  const addReteConnectionToStore = useStore(state => state.addReteConnection);
  const removeReteConnectionFromStore = useStore(state => state.removeReteConnection);
  const setReteGraphState = useStore(state => state.setReteGraphState);

  const historyRef = useRef(null);

  useEffect(() => {
    if (!editorContainerRef.current) return;

    const editor = new NodeEditor();
    const area = new AreaPlugin(editorContainerRef.current);
    const connection = new ConnectionPlugin();
    const render = new ReactPlugin();
    const history = new HistoryPlugin();
    historyRef.current = history;

    const handleNodePropertyChangeForZustand = (nodeId, propertyKey, newValue) => {
      updateReteNodeDataInStore(nodeId, { [propertyKey]: newValue });
    };

    const contextMenu = new ContextMenuPlugin({
      items: ContextMenuPresets.classic.setup([
        ['LFO Node', async () => {
          const node = new LfoReteNode({ frequency: 1, waveform: 'sine', sync: false }); // Added sync default
          if (typeof node.setAreaPlugin === 'function') node.setAreaPlugin(area);
          if (typeof node.setOnPropertyChangeForSync === 'function') node.setOnPropertyChangeForSync(handleNodePropertyChangeForZustand);
          return node;
        }],
      ]),
    });
    area.use(contextMenu);

    AreaExtensions.selectableNodes(area, AreaExtensions.classic.select(), {
      accumulating: AreaExtensions.classic.accumulatingNewTag(),
    });
    AreaExtensions.history({ H: HistoryPlugin, keyboard: true })(area);

    render.addPreset(Presets.classic.setup({
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

          if (controlConfig.type === 'number') {
            return <NumberControlComponent data={propsForComponent} />;
          }
          if (controlConfig.type === 'enum') {
            return <SelectControlComponent data={propsForComponent} />;
          }
          if (controlConfig.type === 'boolean') { // Use CheckboxControlComponent
            return <CheckboxControlComponent data={propsForComponent} />;
          }
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
          if (typeof node.setAreaPlugin === 'function') node.setAreaPlugin(area);
          if (typeof node.setOnPropertyChangeForSync === 'function') node.setOnPropertyChangeForSync(handleNodePropertyChangeForZustand);

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
        if (context.type === 'noderemoved') {
          removeReteNodeFromStore(context.data.id);
        }
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
        if (context.type === 'connectionremoved') {
          removeReteConnectionFromStore(context.data.id);
        }
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

    (async () => {
      const initialLfoNode = new LfoReteNode({ frequency: 0.5, waveform: 'triangle', sync: false }); // Added sync default
      if (typeof initialLfoNode.setAreaPlugin === 'function') initialLfoNode.setAreaPlugin(area);
      if (typeof initialLfoNode.setOnPropertyChangeForSync === 'function') initialLfoNode.setOnPropertyChangeForSync(handleNodePropertyChangeForZustand);

      await editor.addNode(initialLfoNode);
      await area.translate(initialLfoNode.id, { x: 100, y: 100 });

      syncGraphToStore();
      history.record();

      setTimeout(() => AreaExtensions.zoomAt(area, editor.getNodes()), 100);
    })();

    return () => {
      subs.forEach(unsubscribe => unsubscribe());
      history.off('change', syncGraphToStore);
      if (area && typeof area.destroy === 'function') area.destroy();
      if (editor && typeof editor.destroy === 'function') editor.destroy();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '800px', border: '1px solid #ccc', position: 'relative' }}>
      <div ref={editorContainerRef} style={{ width: '100%', height: '100%' }}>
        {/* Rete.js canvas */}
      </div>
    </div>
  );
}

export default ReteEditorComponent;
