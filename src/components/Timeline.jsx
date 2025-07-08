import React, { useRef, useEffect, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import useStore from '../store'; // Import Zustand store
import { AddNodeCommand } from '../utils/commands'; // Import AddNodeCommand

const Timeline = ({ audioUrl }) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const { graph, addNode: zustandAddNode, removeNode: zustandRemoveNode, executeCommand } = useStore(
    (state) => ({
      graph: state.graph,
      addNode: state.addNode,
      removeNode: state.removeNode,
      executeCommand: state.executeCommand, // Assuming you have an executeCommand action in your store
    })
  );

  // Helper to add a command to a global command stack if available, or execute directly
  // This might need to be centralized if not already done.
  const dispatchCommand = useCallback((command) => {
    if (executeCommand) { // Ideal: use a command manager from the store
      executeCommand(command);
    } else { // Fallback: execute directly (no undo/redo through a central manager)
      console.warn("executeCommand not found in Zustand store. Executing command directly.");
      command.execute();
    }
  }, [executeCommand]);


  useEffect(() => {
    if (waveformRef.current && graph && wavesurfer.current) { // Ensure graph and wavesurfer are available
        // Listener for time updates during playback
        const onAudioprocess = (time) => {
            const playheadNodes = graph.findNodesByType("global/playhead");
            playheadNodes.forEach(node => {
                if (node.onTimelineUpdate) {
                    node.onTimelineUpdate(time);
                } else if (node.updateTime) { // Fallback if onTimelineUpdate is not defined
                    node.updateTime(time);
                }
            });
            // Also update Zustand store for global time, if needed elsewhere
            useStore.getState().setCurrentTime(time);
        };

        // Listener for when user seeks
        const onSeek = (progress) => {
            const time = wavesurfer.current.getDuration() * progress;
            const playheadNodes = graph.findNodesByType("global/playhead");
            playheadNodes.forEach(node => {
                 if (node.onTimelineUpdate) {
                    node.onTimelineUpdate(time);
                } else if (node.updateTime) {
                    node.updateTime(time);
                }
            });
            useStore.getState().setCurrentTime(time);
        };

        wavesurfer.current.on('audioprocess', onAudioprocess);
        wavesurfer.current.on('seek', onSeek);

        // Cleanup listeners
        return () => {
            if (wavesurfer.current) {
                wavesurfer.current.un('audioprocess', onAudioprocess);
                wavesurfer.current.un('seek', onSeek);
            }
        };
    }
  }, [graph, audioUrl, dispatchCommand, zustandAddNode, zustandRemoveNode]); // Added dependencies

  useEffect(() => {
    if (waveformRef.current && graph) {
      // If wavesurfer instance exists, destroy it before creating a new one
      // This is important if audioUrl changes
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }

      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'violet',
        progressColor: 'purple',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        height: 100,
        responsive: true,
        plugins: [
          RegionsPlugin.create({
            dragSelection: {
              slop: 5,
            },
          }),
        ],
      });

      const wsRegions = wavesurfer.current.plugins[0]; // Assuming RegionsPlugin is the first plugin

      const getBPM = () => {
        if (graph) {
          const playheadNodes = graph.findNodesByType("global/playhead");
          if (playheadNodes.length > 0 && playheadNodes[0].properties.currentBPM) {
            return playheadNodes[0].properties.currentBPM;
          }
        }
        return 120; // Default BPM if not found
      };

      const snapToBeat = (time, bpm, subdivision = 4) => { // subdivision (e.g., 4 for 1/4 notes)
        if (bpm <= 0) return time;
        const beatInterval = 60.0 / bpm / (subdivision / 4); // e.g. for 1/4 notes, subdivision is 4 so divisor is 1. for 1/8 notes, subdivision is 8 so divisor is 2
        return Math.round(time / beatInterval) * beatInterval;
      };

      wsRegions.on('region-created', (region) => {
        const bpm = getBPM();
        const snappedStart = snapToBeat(region.start, bpm);
        let snappedEnd = snapToBeat(region.end, bpm);

        // Ensure snappedEnd is after snappedStart and has a minimum duration (e.g., one beat interval)
        const beatInterval = 60.0 / bpm;
        if (snappedEnd <= snappedStart) {
          snappedEnd = snappedStart + beatInterval;
        }

        // Update region with snapped values
        region.setOptions({ start: snappedStart, end: snappedEnd });

        console.log(`Region created (snapped): Start: ${snappedStart}, End: ${snappedEnd}`, region);

        const duration = snappedEnd - snappedStart;
        const nodeData = {
          type: 'animation/dancemotion', // Registered type for DanceMotionNode
          pos: [Math.random() * 500 + 100, Math.random() * 300 + 100], // Random position for now
          properties: {
            startTime: parseFloat(snappedStart.toFixed(3)),
            duration: parseFloat(duration.toFixed(3)),
            motionId: 'default_dance', // Default motion ID
            intensity: 0.7,
          },
          // We can assign a temporary ID or let LiteGraph handle it
          // id: `dance_node_${Date.now()}`
        };

        const command = new AddNodeCommand(
          graph,
          zustandAddNode,
          zustandRemoveNode,
          nodeData
        );
        dispatchCommand(command);

        // Optional: Update region content or color
        region.setContent(`Dance: ${nodeData.properties.motionId} (${nodeData.properties.duration}s)`);
        region.setOptions({ color: 'rgba(255, 165, 0, 0.3)' }); // Orange color for dance blocks
      });

      wsRegions.on('region-update-end', (region) => {
        const bpm = getBPM();
        const snappedStart = snapToBeat(region.start, bpm);
        let snappedEnd = snapToBeat(region.end, bpm);

        const beatInterval = 60.0 / bpm;
        if (snappedEnd <= snappedStart) {
          snappedEnd = snappedStart + beatInterval;
        }

        region.setOptions({ start: snappedStart, end: snappedEnd });
        console.log(`Region updated (snapped): Start: ${snappedStart}, End: ${snappedEnd}`);

        // Here, we might need to find the associated DanceMotionNode and update its properties
        // This requires a link between region.id and node.id, or searching nodes by properties.
        // For now, this only snaps the visual region. The node would need a separate update mechanism
        // or be recreated. Recreating might be simpler if undo/redo handles it well.
        // Let's assume for now the user might need to manually adjust node properties after resizing a region,
        // or we can enhance this later by storing region.id in node properties.
        // A simpler approach for now: if a node was created for this region, update it.
        // This assumes a 1-to-1 mapping and that the region-created logic already made the node.
        // We'd need to store the created node's ID in the region or vice-versa.
        // Example: region.customData = { nodeId: node.id }
        // Then here: const nodeId = region.customData.nodeId; /* ... update node ... */
      });


      // Example: Add a button for explicit region creation (kept for testing)
      const handleAddRegionButton = () => {
        const currentTime = wavesurfer.current.getCurrentTime();
        // This will also trigger 'region-created' if successful
        wsRegions.addRegion({
          start: currentTime,
          end: currentTime + 2, // Default 2s duration for button-added regions
          content: 'New Dance Block',
          color: 'rgba(0, 100, 255, 0.3)',
        });
      };
      // Attach this to the button if you still have it
      // For now, I'll remove the old addRegion and handleAddRegion as the button will use wsRegions.addRegion

      // Listeners for playhead updates
      const onAudioprocess = (time) => {
        const playheadNodes = graph.findNodesByType("global/playhead");
        playheadNodes.forEach(node => {
          if (node.onTimelineUpdate) node.onTimelineUpdate(time);
          else if (node.updateTime) node.updateTime(time);
        });
        useStore.getState().setCurrentTime(time);
      };

      const onSeek = (progress) => {
        const time = wavesurfer.current.getDuration() * progress;
        const playheadNodes = graph.findNodesByType("global/playhead");
        playheadNodes.forEach(node => {
          if (node.onTimelineUpdate) node.onTimelineUpdate(time);
          else if (node.updateTime) node.updateTime(time);
        });
        useStore.getState().setCurrentTime(time);
      };

      wavesurfer.current.on('audioprocess', onAudioprocess);
      wavesurfer.current.on('seek', onSeek);


      if (audioUrl) {
        wavesurfer.current.load(audioUrl);
        wavesurfer.current.on('error', (error) => {
          console.error('Error loading audio:', error);
          alert('Failed to load audio. Please check the URL or your network connection.');
        });
      }

      // Cleanup function
      return () => {
        if (wavesurfer.current) {
          // Unsubscribe from events to prevent memory leaks
          wavesurfer.current.un('audioprocess', onAudioprocess);
          wavesurfer.current.un('seek', onSeek);
          wavesurfer.current.un('region-created'); // Assuming wsRegions.on also needs cleanup, though it's part of the plugin
                                                 // It's safer to destroy the whole instance.
          wavesurfer.current.destroy();
          wavesurfer.current = null; // Ensure it's nullified for next effect run
        }
      };
    }
  }, [audioUrl, graph, dispatchCommand, zustandAddNode, zustandRemoveNode]); // Added dependencies to the main useEffect

  // This button was for testing, it can be re-added if a manual "add dance block" button is desired
  // For now, primary creation is via drag-selection on the timeline.
  // const handleAddDanceBlockButton = () => {
  //   if (wavesurfer.current && wavesurfer.current.plugins[0]) {
  //     const wsRegions = wavesurfer.current.plugins[0];
  //     const currentTime = wavesurfer.current.getCurrentTime();
  //     wsRegions.addRegion({
  //       start: currentTime,
  //       end: currentTime + 2, // Default 2s duration
  //       content: 'New Dance Block via Button',
  //       color: 'rgba(0, 100, 255, 0.3)',
  //     });
  //   }
  // };

  return (
    <div className="timeline-container">
      <div ref={waveformRef}></div>
      {/* <button onClick={handleAddDanceBlockButton} className="add-region-button">
        Add Dance Block
      </button> */}
    </div>
  );
};

export default Timeline;
