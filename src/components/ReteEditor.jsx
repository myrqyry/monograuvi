import React, { useEffect, useRef, useState } from 'react';
import { createEditor, NodeEditor } from 'rete';
import { ReactPlugin, Presets } from 'rete-react-plugin';
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin';
import { ConnectionPlugin, ClassicPreset as ConnectionClassicPreset } from 'rete-connection-plugin';
// We might need a preset for controls, nodes, etc.
// For now, we can use the default ClassicPreset provided by rete-react-plugin for basic nodes.

// A simple example node
class MyNode extends Presets.classic.Node {
  constructor(initial) {
    super('My First Node');
    this.addOutput('value', new Presets.classic.Output(Presets.classic.socket, 'Number'));
    this.addControl('value', new Presets.classic.Control('number', { initial }));
  }
}

export function ReteEditorComponent() {
  const editorRef = useRef(null);
  const [editorInstance, setEditorInstance] = useState(null);

  useEffect(() => {
    if (editorRef.current) {
      const editor = new NodeEditor();
      const area = new AreaPlugin(editorRef.current); // Pass the container element
      const connection = new ConnectionPlugin();
      const render = new ReactPlugin(); // No need to pass container here

      AreaExtensions.selectableNodes(area, AreaExtensions.classic.select(), {
        accumulating: AreaExtensions.classic.accumulatingNewTag(),
      });

      render.addPreset(Presets.classic.setup()); // Use classic preset for nodes and controls

      editor.use(area);
      area.use(connection);
      area.use(render);

      connection.addPreset(ConnectionClassicPreset.setup());

      const node = new MyNode(0);
      editor.addNode(node);

      setEditorInstance(editor);

      // Zoom at origin, this is a common setup step
      AreaExtensions.zoomAt(area, editor.getNodes());

      // Cleanup
      return () => {
        area.destroy();
        editor.destroy();
      };
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '800px', border: '1px solid #ccc' }}>
      <div ref={editorRef} style={{ width: '100%', height: '100%' }}>
        {/* Rete.js will render here via ReactArea.Provider */}
      </div>
    </div>
  );
}

export default ReteEditorComponent;
