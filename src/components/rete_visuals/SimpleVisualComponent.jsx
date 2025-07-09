import React from 'react';

// This component will be rendered as the body of the SimpleVisualReteNode
// It receives `data` which is the node instance itself.
export function SimpleVisualComponent({ data: node }) {
  // Access customData from the node instance
  const intensity = node.customData?.intensity || 0; // Default to 0 if undefined
  const baseColor = node.customData?.baseColor || 'blue'; // Default color

  // Calculate color based on intensity.
  // For simplicity, we'll make it brighter or a slightly different shade.
  // Example: Make it more opaque or change lightness based on intensity.
  // Here, we'll use intensity to modulate the alpha of an RGBA color.
  // Or, more simply, change its size or a specific style.

  const size = 50 + intensity * 50; // Square size from 50px to 100px

  // Interpolate color: for example, from black to the baseColor
  const r = baseColor === 'red' || baseColor === 'yellow' || baseColor === 'purple' ? Math.floor(255 * intensity) : 0;
  const g = baseColor === 'green' || baseColor === 'yellow' ? Math.floor(255 * intensity) : 0;
  const b = baseColor === 'blue' || baseColor === 'purple' ? Math.floor(255 * intensity) : 0;

  const dynamicColor = `rgb(${r},${g},${b})`;

  // If we want to use the baseColor more directly and just change opacity:
  // const dynamicColorWithOpacity = `rgba(${baseColor === 'red' ? 255 : 0}, ${baseColor === 'green' ? 255 : 0}, ${baseColor === 'blue' ? 255 : 0}, ${intensity})`;

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: dynamicColor,
        border: '1px solid #555',
        borderRadius: '4px',
        margin: '10px auto', // Center it a bit
        transition: 'width 0.1s, height 0.1s, background-color 0.1s' // Smooth transitions
      }}
      title={`Intensity: ${intensity.toFixed(2)}`}
    >
      {/* Visual representation here */}
      {/* <p style={{color: 'white', fontSize: '10px', textAlign: 'center'}}>Val: {intensity.toFixed(2)}</p> */}
    </div>
  );
}

export default SimpleVisualComponent;
