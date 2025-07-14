// Monograuvi Logo Configuration for oh-my-logo
module.exports = {
  // Logo text
  text: [
    '  ███╗   ███╗ ██████╗ ███╗   ██╗ ██████╗  ██████╗ ██████╗  █████╗ ██╗   ██╗██╗   ██╗██╗',
    '  ████╗ ████║██╔═══██╗████╗  ██║██╔═══██╗██╔════╝ ██╔══██╗██╔══██╗██║   ██║██║   ██║██║',
    '  ██╔████╔██║██║   ██║██╔██╗ ██║██║   ██║██║  ███╗██████╔╝███████║██║   ██║██║   ██║██║',
    '  ██║╚██╔╝██║██║   ██║██║╚██╗██║██║   ██║██║   ██║██╔══██╗██╔══██║╚██╗ ██╔╝╚██╗ ██╔╝██║',
    '  ██║ ╚═╝ ██║╚██████╔╝██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║██║  ██║ ╚████╔╝  ╚████╔╝ ██║',
    '  ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝    ╚═══╝  ╚═╝',
    '  ',                                                                                    
    '  A music visualization and automation platform',
    '  ',
    '  Starting up...',
  ],
  // Animation settings
  animation: {
    // Make the animation slower and more fluid
    interval: 0.05,  // Time between frames in seconds
    frameDuration: 0.05,  // Time each frame is displayed
    // Add a slight delay at the end of the animation
    endDelay: 1.5,
  },
  // Color scheme
  colors: [
    '#FF6B6B',  // Soft red
    '#4ECDC4',  // Teal
    '#45B7D1',  // Light blue
    '#96CEB4',  // Mint
    '#FFEEAD',  // Light yellow
    '#FF9E7D',  // Peach
    '#D4A5A5',  // Dusty pink
    '#9B8B8B',  // Gray
  ],
  // Animation effects
  effects: [
    'topIn',    // Characters fall from top
    'leftIn',   // Characters slide in from left
    'rightIn',  // Characters slide in from right
    'bottomIn', // Characters slide in from bottom
    'fadeIn',   // Characters fade in
    'colorize', // Apply colors to characters
  ],
  // Randomness to make it more dynamic
  randomize: {
    effects: true,  // Randomly choose effects
    colors: true,   // Randomly assign colors
  },
  // Add a border around the logo
  border: {
    type: 'double',
    color: '#4ECDC4',
  },
  // Add some padding
  padding: 1,
  // Center the logo
  margin: 'auto',
  // Make the animation loop until stopped
  loop: false,
};
