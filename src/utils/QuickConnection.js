/* eslint no-tabs: 0 */
/* eslint import/prefer-default-export:0 */
/* eslint no-underscore-dangle:0 */
/* eslint no-plusplus:0 */
/* eslint prefer-rest-params:0 */
/* eslint operator-linebreak:0 */
/* eslint no-unneeded-ternary:0 */
/* global LGraphCanvas */
/* global LiteGraph */

export class QuickConnection {
  constructor() {
    this.insideConnection = null;
    this.enabled = true;
    this.useInputsWithLinks = false;
    this.release_link_on_empty_shows_menu = true;
    this.connectDotOnly = true;
    this.doNotAcceptType = /^\*$/;
    this.boxAlpha = 0.7;
    this.boxBackground = '#000';
    this.highlightedNodes = [];
    this.originalNodeColors = new Map();
  }

  initListeners(canvas) {
    this.graph = canvas.graph;
    this.canvas = canvas;
    if (!this.canvas.canvas) {
      console.error('no canvas', this.canvas); // eslint-disable-line no-console
    } else {
      this.canvas.canvas.addEventListener('litegraph:canvas', (e) => {
        const { detail } = e;
        if (!this.release_link_on_empty_shows_menu
          && detail && detail.subType === 'empty-release'
        ) {
          e.stopPropagation();
        }
      });
    }

    this.isComfyUI = this.canvas.connecting_links !== undefined;

    this.addOnCanvas('onDrawOverlay', (ctx) => this.onDrawOverlay(ctx));
    this.addOnCanvas('processMouseDown', (e) => this.onMouseDown(e));
    this.addOnCanvas('processMouseUp', (e) => this.onMouseUp(e));
  }

  addOnCanvas(name, func) {
    const obj = this.canvas;
    const oldFunc = obj[name];
    obj[name] = function callFunc() {
      if (oldFunc) {
        oldFunc.apply(obj, arguments);
      }
      return func.apply(obj, arguments);
    };
  }

  findAcceptingNodes(fromConnection, fromNode, findInput) {
    const accepting = [];
    if (this.doNotAcceptType.exec(fromConnection.type)) {
      return accepting;
    }
    const addToAccepting = (arr, node) => {
      if (node.mode === 4) {
        return;
      }
      if (node.id === fromNode.id) {
        return;
      }
      for (let c = 0; c < arr.length; ++c) {
        const input = arr[c];
        if (!input.link || this.useInputsWithLinks) {
          const accept = LiteGraph.isValidConnection(
            input.type,
            fromConnection.type,
          );
          if (accept && !this.doNotAcceptType.exec(input.type)) {
            accepting.push({
              node,
              connection: input,
              connection_slot_index: c,
            });
          }
        }
      }
    };

    const nodes = this.graph._nodes;
    for (let i = 0; i < nodes.length; ++i) {
      const node = nodes[i];
      if (node.inputs && findInput) {
        addToAccepting(node.inputs, node);
      }
      if (node.outputs && !findInput) {
        addToAccepting(node.outputs, node);
      }
    }

    accepting.sort((a, b) => a.node.pos[1] - b.node.pos[1]);
    return accepting;
  }

  onDrawOverlay(ctx) {
    if (!this.enabled) {
      return;
    }
    if (!this.canvas || !this.canvas.graph_mouse) {
      console.error('no canvas or mouse yet', this.canvas); // eslint-disable-line no-console
      return;
    }

    this.insideConnection = null;
    this.acceptingNodes = null; // Cache for accepting nodes

    const connectionInfo = this.getCurrentConnection();

    if (connectionInfo) {
      const {
        node, input, output, slot,
      } = connectionInfo;
      if (!input && !output) {
        return;
      }

      ctx.save();
      this.canvas.ds.toCanvasContext(ctx);

      const slotPos = new Float32Array(2);

      const isInput = input ? true : false;
      const connecting = isInput ? input : output;
      const connectionSlot = slot;

      const pos = node.getConnectionPos(isInput, connectionSlot, slotPos);

      // Use precomputed accepting nodes
      if (!this.acceptingNodes) {
        console.warn('Accepting nodes cache is empty. Ensure onMouseDown is triggered.');
        return;
      }

      let scale = 1 / this.canvas.ds.scale;
      if (scale < 1.0) {
        scale = 1.0;
      }

      const SLOT_HEIGHT_MULTIPLIER_X = 6;
      const SLOT_HEIGHT_MULTIPLIER_Y = 8;
      const linkCloseArea = [
        pos[0] - (LiteGraph.NODE_SLOT_HEIGHT * SLOT_HEIGHT_MULTIPLIER_X * scale),
        pos[1] - LiteGraph.NODE_SLOT_HEIGHT,
        LiteGraph.NODE_SLOT_HEIGHT * SLOT_HEIGHT_MULTIPLIER_Y * scale,
        LiteGraph.NODE_SLOT_HEIGHT * (this.acceptingNodes.length + 1) * scale,
      ];
      if (!isInput) {
        const SLOT_HEIGHT_MULTIPLIER_X_REDUCED = 2;
        linkCloseArea[0] = pos[0] - ((LiteGraph.NODE_SLOT_HEIGHT * SLOT_HEIGHT_MULTIPLIER_X_REDUCED) * scale);
      }

      const isInsideClosePosition = LiteGraph.isInsideRectangle(
        this.canvas.graph_mouse[0],
        this.canvas.graph_mouse[1],
        linkCloseArea[0],
        linkCloseArea[1],
        linkCloseArea[2],
        linkCloseArea[3],
      );

      if (isInsideClosePosition) {
        this.updateHighlightedNodes();
      } else {
        this.clearHighlights();
      }

      ctx.restore();
    } else {
      this.clearHighlights();
    }
  }

  getCurrentConnection() {
    if (this.canvas.connecting_node) {
      return {
        node: this.canvas.connecting_node,
        input: this.canvas.connecting_input,
        slot: this.canvas.connecting_slot,
        output: this.canvas.connecting_output,
      };
    }
    return null;
  }

  updateHighlightedNodes() {
    if (!this.acceptingNodes) {
      return;
    }

    const newHighlightedNodes = [];
    this.acceptingNodes.forEach((acceptingNode) => {
      if (!this.originalNodeColors.has(acceptingNode.node.id)) {
        this.originalNodeColors.set(acceptingNode.node.id, acceptingNode.node.bgcolor);
      }
      acceptingNode.node.bgcolor = '#6a6'; // Highlight color
      newHighlightedNodes.push(acceptingNode.node);
    });

    // Clear previous highlights
    this.clearHighlights();

    // Update highlighted nodes
    this.highlightedNodes = newHighlightedNodes;
    this.canvas.draw(true, true); // Mark canvas for redraw
  }

  clearHighlights() {
    if (this.highlightedNodes.length) {
      this.highlightedNodes.forEach(node => {
        if (this.originalNodeColors.has(node.id)) {
          node.bgcolor = this.originalNodeColors.get(node.id);
          this.originalNodeColors.delete(node.id);
        }
      });
      this.highlightedNodes = [];
      if (this.canvas.ds && this.canvas.ds.redrawArea) {
        // Redraw only affected areas if supported
        this.highlightedNodes.forEach(node => {
          const nodeArea = {
            x: node.pos[0],
            y: node.pos[1],
            width: node.size[0],
            height: node.size[1],
          };
          this.canvas.ds.redrawArea(nodeArea);
        });
      } else {
        this.canvas.draw(true, true); // Fallback to full redraw
      }
    }
  }

  onMouseDown(e) {
    if (!this.enabled || !this.canvas.connecting_node) {
      return;
    }

    const connectionInfo = this.getCurrentConnection();
    if (connectionInfo) {
      const { node, input, output } = connectionInfo;
      if (input || output) {
        const isInput = !!input;
        this.acceptingNodes = this.findAcceptingNodes(
          isInput ? input : output,
          node,
          !isInput,
        );
      }
    }
  }

  onMouseUp(e) {
    if (!this.enabled || !this.canvas.connecting_node) {
      return;
    }

    const connectionInfo = this.getCurrentConnection();
    if (connectionInfo) {
      const { node } = connectionInfo;
      const isInput = !!connectionInfo.input;
      const pos = this.canvas.graph_mouse;

      if (this.acceptingNodes && this.acceptingNodes.length) {
        // Find the closest accepting node
        let closestNode = null;
        let closestDist = Infinity;

        this.acceptingNodes.forEach(acceptingNode => {
          const destPos = new Float32Array(2);
          acceptingNode.node.getConnectionPos(!isInput, acceptingNode.connection_slot_index, destPos);
          const dist = LiteGraph.distance(pos, destPos);
          if (dist < closestDist) {
            closestDist = dist;
            closestNode = acceptingNode;
          }
        });

        const SNAPPING_THRESHOLD_PX = 50;
        if (closestNode && closestDist < SNAPPING_THRESHOLD_PX) { // Snapping threshold
          const fromNode = connectionInfo.node;
          const fromSlot = connectionInfo.slot;
          const toNode = closestNode.node;
          const toSlot = closestNode.connection_slot_index;

          if (connectionInfo.output) {
            fromNode.connect(fromSlot, toNode, toSlot);
          } else {
            toNode.connect(toSlot, fromNode, fromSlot);
          }
        }
      }
    }
    this.acceptingNodes = null;
  }
}
