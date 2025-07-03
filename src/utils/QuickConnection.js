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

    this.isComfyUI = this.canvas.connecting_links !== undefined ? true : false;

    this.addOnCanvas('onDrawOverlay', (ctx) => this.onDrawOverlay(ctx));
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

      if (!this.acceptingNodes) {
        this.acceptingNodes = this.findAcceptingNodes(
          connecting,
          node,
          !isInput,
        );
      }

      let scale = 1 / this.canvas.ds.scale;
      if (scale < 1.0) {
        scale = 1.0;
      }

      const linkCloseArea = [
        pos[0] - (LiteGraph.NODE_SLOT_HEIGHT * 6 * scale),
        pos[1] - LiteGraph.NODE_SLOT_HEIGHT,
        LiteGraph.NODE_SLOT_HEIGHT * 8 * scale,
        LiteGraph.NODE_SLOT_HEIGHT * (this.acceptingNodes.length + 1) * scale,
      ];
      if (!isInput) {
        linkCloseArea[0] = pos[0] - ((LiteGraph.NODE_SLOT_HEIGHT * 2) * scale);
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
        this.highlightedNodes = [];
        this.acceptingNodes.forEach((acceptingNode) => {
          // Highlight compatible nodes
          if (!this.originalNodeColors.has(acceptingNode.node.id)) {
            this.originalNodeColors.set(acceptingNode.node.id, acceptingNode.node.bgcolor);
          }
          acceptingNode.node.bgcolor = '#6a6'; // Highlight color
          this.highlightedNodes.push(acceptingNode.node);

          const destPos = new Float32Array(2);
          acceptingNode.node.getConnectionPos(
            !isInput,
            acceptingNode.connection_slot_index,
            destPos,
          );
          ctx.beginPath();
          ctx.moveTo(pos[0], pos[1]);
          
          // Draw right-angled connection with a curve
          const halfWayX = pos[0] + (destPos[0] - pos[0]) / 2;
          ctx.bezierCurveTo(halfWayX, pos[1], halfWayX, destPos[1], destPos[0], destPos[1]);

          ctx.strokeStyle = '#7f7'; // Highlighted connection color
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.closePath();
        });
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

  clearHighlights() {
    if (this.highlightedNodes.length) {
      this.highlightedNodes.forEach(node => {
        if (this.originalNodeColors.has(node.id)) {
          node.bgcolor = this.originalNodeColors.get(node.id);
          this.originalNodeColors.delete(node.id);
        }
      });
      this.highlightedNodes = [];
      this.canvas.draw(true, true); // Redraw canvas
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

        if (closestNode && closestDist < 50) { // 50px threshold for snapping
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
