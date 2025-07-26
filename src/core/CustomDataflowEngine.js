import { DataflowEngine } from 'rete-engine';

export class CustomDataflowEngine extends DataflowEngine {
  async execute(graph, context = {}) {
    const { currentTime } = context;
    for (const node of graph.nodes) {
      if (typeof node.data === 'function') {
        node.data = node.data.bind(node);
      }
    }
    return super.execute(graph, { ...context, currentTime });
  }
}
