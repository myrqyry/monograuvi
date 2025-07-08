import React, { useRef, useEffect, useState, useCallback } from 'react';
import useStore from '../store';

const WaveformTimeline = ({ 
  height = 60,
  className = '',
  onSeek 
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTrigger, setDragTrigger] = useState(null);
  const [hoveredTrigger, setHoveredTrigger] = useState(null);
  // --- Wire dragging and node menu state ---
  const [isDraggingWire, setIsDraggingWire] = useState(false);
  const [wireStart, setWireStart] = useState(null);
  const [wireEnd, setWireEnd] = useState(null);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0, time: 0, canvasX: 0, canvasY: 0 });
  
  // Store state
  const {
    audioBuffer,
    currentTime,
    duration,
    isPlaying,
    triggers,
    addTrigger, // Will be used by handleDroppedNode
    removeTrigger,
    updateTrigger,
    // For snapping to beat, we might need BPM. Assuming it will be in audioMetadata.
    // audioMetadata, // Example: { tempo: 120, key: 'C', duration: 180 }
  } = useStore(state => ({
    audioBuffer: state.audioBuffer,
    currentTime: state.currentTime,
    duration: state.duration,
    isPlaying: state.isPlaying,
    triggers: state.triggers,
    addTrigger: state.addTrigger,
    removeTrigger: state.removeTrigger,
    updateTrigger: state.updateTrigger,
    // audioMetadata: state.audioMetadata, // Uncomment when audioMetadata is populated
  }));

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Draw waveform on canvas
  const drawWaveform = useCallback((canvas, ctx, buffer) => {
    if (!buffer) return;
    
    const { width, height } = canvas;
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set waveform style
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    
    // Draw waveform bars
    for (let x = 0; x < width; x++) {
      const start = x * step;
      const end = Math.min(start + step, data.length);
      let min = 1, max = -1;
      
      for (let i = start; i < end; i++) {
        const sample = data[i];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }
      
      const minY = (1 + min) * amp;
      const maxY = (1 + max) * amp;
      const barHeight = maxY - minY;
      
      if (barHeight > 0) {
        ctx.fillRect(x, minY, 1, barHeight);
      }
    }
  }, []);

  // Draw triggers on canvas
  const drawTriggers = useCallback((canvas, ctx) => {
    if (!duration || triggers.length === 0) return;
    
    const { width, height } = canvas;
    
    triggers.forEach(trigger => {
      const x = (trigger.time / duration) * width;
      const isHovered = hoveredTrigger === trigger.id;
      const isDragged = dragTrigger?.id === trigger.id;
      
      // Trigger line
      ctx.strokeStyle = isHovered || isDragged ? 
        'rgba(203, 166, 247, 1)' : 'rgba(244, 63, 94, 0.8)';
      ctx.lineWidth = isHovered || isDragged ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      // Trigger marker (top)
      const markerSize = isHovered || isDragged ? 8 : 6;
      ctx.fillStyle = isHovered || isDragged ? 
        'rgba(203, 166, 247, 1)' : 'rgba(244, 63, 94, 1)';
      ctx.beginPath();
      ctx.arc(x, markerSize / 2, markerSize / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Time label
      if (isHovered || isDragged) {
        const timeText = formatTime(trigger.time);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeText, x, height - 4);
      }
    });
  }, [triggers, duration, hoveredTrigger, dragTrigger]);

  // Draw playhead
  const drawPlayhead = useCallback((canvas, ctx) => {
    if (!duration) return;
    
    const { width, height } = canvas;
    const x = (currentTime / duration) * width;
    
    // Playhead line
    ctx.strokeStyle = isPlaying ? 
      'rgba(166, 227, 161, 1)' : 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    
    // Playhead indicator
    ctx.fillStyle = isPlaying ? 
      'rgba(166, 227, 161, 1)' : 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(x - 4, 0);
    ctx.lineTo(x + 4, 0);
    ctx.lineTo(x, 8);
    ctx.closePath();
    ctx.fill();
  }, [currentTime, duration, isPlaying]);

  // Draw wire when dragging
  const drawWire = useCallback((canvas, ctx) => {
    if (!isDraggingWire || !wireStart || !wireEnd) return;
    
    const rect = canvas.getBoundingClientRect();
    const startX = (wireStart.time / duration) * canvas.width / window.devicePixelRatio;
    const startY = canvas.height / (2 * window.devicePixelRatio);
    
    // Convert global coordinates to canvas coordinates
    const endX = (wireEnd.x - rect.left);
    const endY = (wireEnd.y - rect.top);
    
    // Draw wire
    ctx.strokeStyle = 'rgba(203, 166, 247, 0.8)';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [isDraggingWire, wireStart, wireEnd, duration]);

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Draw components
    if (audioBuffer) {
      drawWaveform(canvas, ctx, audioBuffer);
    }
    drawTriggers(canvas, ctx);
    drawPlayhead(canvas, ctx);
    drawWire(canvas, ctx);
  }, [audioBuffer, drawWaveform, drawTriggers, drawPlayhead, drawWire]);

  // Convert pixel position to time
  const pixelToTime = useCallback((x) => {
    const canvas = canvasRef.current;
    if (!canvas || !duration) return 0;
    
    const rect = canvas.getBoundingClientRect();
    // Ensure x is relative to the canvas, not the viewport
    const relativeX = x - rect.left;
    const normalizedX = relativeX / rect.width;
    return Math.max(0, Math.min(duration, normalizedX * duration));
  }, [duration]);

  const snapToNearestBeat = useCallback((time) => {
    // Basic snapping to 0.25s intervals if BPM is not available
    // TODO: Enhance with BPM from store if available:
    // const bpm = audioMetadata?.tempo;
    // if (bpm && bpm > 0) {
    //   const beatDuration = 60 / bpm;
    //   const quarterBeatDuration = beatDuration / 4; // Snap to 16th notes, for example
    //   return Math.round(time / quarterBeatDuration) * quarterBeatDuration;
    // }
    const snapInterval = 0.25; // Snap to quarter seconds
    return Math.round(time / snapInterval) * snapInterval;
  }, [/* audioMetadata */]); // Add audioMetadata to dependencies if used

  const graph = useStore(state => state.graph); // Get graph instance from store

  const handleDroppedNode = useCallback((time, nodeData) => {
    console.log('Node dropped at time:', time, 'with data:', nodeData);

    if (!graph || !window.LiteGraph) {
      console.error("LiteGraph instance or graph not available to create node.");
      return;
    }

    // 1. Add a marker/visual for the dropped node
    // The existing addTrigger action can be used.
    // We might want to make the trigger type more specific.
    const triggerPayload = {
      id: crypto.randomUUID(), // Ensure a unique ID for the trigger
      time,
      type: 'motion-node-trigger', // Specific type for these triggers
      data: { ...nodeData, title: `Motion: ${nodeData.motionId}` },
      // Potentially link this trigger to the node ID once created
    };
    addTrigger(triggerPayload);
    console.log("Added trigger for dropped node:", triggerPayload);

    // 2. Create and configure the LiteGraph node
    const liteNodeType = nodeData.type; // e.g., "animation/dancemotion"
    const newNode = window.LiteGraph.createNode(liteNodeType);

    if (!newNode) {
      console.error(`Failed to create LiteGraph node of type: ${liteNodeType}`);
      // Optionally remove the trigger if node creation fails
      // removeTrigger(triggerPayload.id);
      return;
    }

    // Configure the new node
    // The DanceMotionNode's onPropertyChanged and internal logic should handle store updates for danceBlocks
    if (nodeData.motionId) {
      newNode.setProperty('motionId', nodeData.motionId);
    }
    newNode.setProperty('startTime', time);
    // Duration will be set by DanceMotionNode based on motionId

    // Position the new node in the graph (simple positioning for now)
    // This could be improved with access to graphCanvas.ds (view transform)
    // or by having a dedicated node placement strategy.
    const lastNode = graph._nodes.length > 0 ? graph._nodes[graph._nodes.length - 1] : null;
    if (lastNode && lastNode.pos) {
      newNode.pos = [lastNode.pos[0] + lastNode.size[0] + 30, lastNode.pos[1]];
    } else {
      newNode.pos = [100, 100]; // Default position if no other nodes
    }

    // Add to graph
    graph.add(newNode);
    console.log(`Added LiteGraph node: ${newNode.title} (ID: ${newNode.id}) at [${newNode.pos[0]}, ${newNode.pos[1]}]`);

    // Optional: Link trigger to node ID after node is added and has an ID
    // updateTrigger(triggerPayload.id, { nodeId: newNode.id });

  }, [graph, addTrigger /*, removeTrigger, updateTrigger */]); // Add remove/updateTrigger if used for rollback

  // Find trigger at position
  const findTriggerAtPosition = useCallback((x) => {
    const canvas = canvasRef.current;
    if (!canvas || !duration) return null;
    
    const rect = canvas.getBoundingClientRect();
    const time = pixelToTime(x);
    const tolerance = 8 / rect.width * duration; // 8px tolerance
    
    return triggers.find(trigger => 
      Math.abs(trigger.time - time) <= tolerance
    );
  }, [triggers, duration, pixelToTime]);

  // Handle mouse down
  const handleMouseDown = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const trigger = findTriggerAtPosition(x);
    
    if (trigger) {
      // Start dragging trigger
      setIsDragging(true);
      setDragTrigger(trigger);
      e.preventDefault();
    }
  }, [findTriggerAtPosition]);

  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    if (isDragging && dragTrigger) {
      // Update trigger position
      const newTime = pixelToTime(x);
      updateTrigger(dragTrigger.id, { time: newTime });
    } else {
      // Update hover state
      const trigger = findTriggerAtPosition(x);
      setHoveredTrigger(trigger?.id || null);
      
      // Update cursor
      if (canvasRef.current) {
        canvasRef.current.style.cursor = trigger ? 'grab' : 'crosshair';
      }
    }
  }, [isDragging, dragTrigger, pixelToTime, updateTrigger, findTriggerAtPosition]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragTrigger(null);
  }, []);

  // Handle click (cue/seek)
  const handleClick = useCallback((e) => {
    if (isDragging) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = pixelToTime(x);
    const trigger = findTriggerAtPosition(x);
    
    if (e.shiftKey && trigger) {
      // Remove trigger with Shift+click
      removeTrigger(trigger.id);
    } else if (!trigger) {
      // Normal click = cue/seek to that position
      if (onSeek) {
        onSeek(time);
      }
    }
  }, [isDragging, pixelToTime, findTriggerAtPosition, removeTrigger, onSeek]);

  // Set up event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mouseleave', () => {
      setHoveredTrigger(null);
      setIsDragging(false);
      setDragTrigger(null);
    });
    
    // Global mouse up for drag operations
    document.addEventListener('mouseup', handleMouseUp);
    
    // Global mouse move for wire dragging
    const handleGlobalMouseMove = (e) => {
      if (isDraggingWire) {
        setWireEnd({ x: e.clientX, y: e.clientY });
      }
    };
    
    document.addEventListener('mousemove', handleGlobalMouseMove);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('click', handleClick);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleClick, isDraggingWire]);

  // Render on changes
  useEffect(() => {
    render();
  }, [render]);

  // Render on animation frame for smooth playhead
  useEffect(() => {
    let animationId;
    
    const animate = () => {
      render();
      animationId = requestAnimationFrame(animate);
    };
    
    if (isPlaying) {
      animationId = requestAnimationFrame(animate);
    } else {
      render();
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPlaying, render]);

  return (
    <div 
      ref={containerRef}
      className={`waveform-timeline ${className}`}
      style={{ height: `${height}px`, width: '100%' }}
      onDrop={(e) => {
        e.preventDefault(); // Prevent default browser behavior for drop
        const data = e.dataTransfer.getData('application/monograuvi-node');
        if (data) {
          try {
            const nodeData = JSON.parse(data);
            // Use e.clientX directly as pixelToTime now expects viewport-relative X
            const time = pixelToTime(e.clientX);
            const snappedTime = snapToNearestBeat(time);

            handleDroppedNode(snappedTime, nodeData);
          } catch (error) {
            console.error("Failed to parse dropped node data:", error);
          }
        }
      }}
      onDragOver={(e) => {
        e.preventDefault(); // Necessary to allow drop
        e.dataTransfer.dropEffect = 'copy'; // Show a copy cursor
      }}
    >
      <canvas
        ref={canvasRef}
        className="waveform-canvas"
        style={{ 
          width: '100%', 
          height: '100%',
          cursor: 'crosshair'
        }}
      />
      
      {/* Help text */}
      <div className="timeline-help">
        <span>Click to cue • Hold to create node • Drag to wire • Shift+click trigger to remove</span>
      </div>

      {/* Node Creation Menu */}
      {showNodeMenu && (
        <div 
          className="node-creation-menu"
          style={{
            position: 'fixed',
            left: menuPosition.x,
            top: menuPosition.y,
            zIndex: 1000,
            background: 'var(--bg-mantle)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
            Create Node Output
          </div>
          <div 
            style={{
              padding: '6px 8px',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => {
              addTrigger(menuPosition.time);
              setShowNodeMenu(false);
            }}
            onMouseEnter={(e) => e.target.style.background = 'var(--bg-crust)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            <i className="ri-play-circle-line"></i>
            Audio Trigger
          </div>
          <div 
            style={{
              padding: '6px 8px',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseDown={(e) => {
              setIsDraggingWire(true);
              setWireStart({ 
                time: menuPosition.time,
                x: menuPosition.canvasX,
                y: menuPosition.canvasY 
              });
              setShowNodeMenu(false);
              e.preventDefault();
            }}
            onMouseEnter={(e) => e.target.style.background = 'var(--bg-crust)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            <i className="ri-share-forward-line"></i>
            Output Node (drag to connect)
          </div>
          <div 
            style={{
              padding: '6px 8px',
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setShowNodeMenu(false)}
            onMouseEnter={(e) => e.target.style.background = 'var(--bg-crust)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            <i className="ri-close-line"></i>
            Cancel
          </div>
        </div>
      )}
    </div>
  );
};

export default WaveformTimeline;
