#!/usr/bin/env node

async function displayLogo() {
  try {
    // Add colors to console first
    require('colors');
    
    // Check if we're in a TTY environment
    const isTTY = process.stdout.isTTY;
    if (!isTTY) {
      console.log('\n  MONOGRAUVI\n');
      console.log('  A music visualization and automation platform'.cyan.italic);
      console.log('  '.gray + 'Starting development server...'.dim + '\n');
      return;
    }
    
    try {
      // Try to use dynamic import for ESM compatibility
      const ohMyLogo = await import('oh-my-logo');
      const { render } = ohMyLogo;
      
      // Define our custom logo text and styling
      const logoText = 'MONOGRAUVI';
      
      // Display the logo with a nice gradient
      console.log('\n'.repeat(2));
      
      // Use a simpler configuration that's more likely to work
      await render(logoText, {
        palette: ['#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#FF6B6B'],
        font: 'Simple',  // Changed from 'Standard' to 'Simple' for better compatibility
        direction: 'horizontal',  // Changed from 'diagonal' to 'horizontal'
        space: false,     // Disable extra spacing
        debug: false,     // Disable debug mode
      });
      
      // Add some spacing and a subtitle
      console.log('\n'.repeat(2));
      console.log('  A music visualization and automation platform'.cyan.italic);
      console.log('  '.gray + 'Development server started'.dim);
      console.log('\n'.repeat(1));
      
    } catch (logoError) {
      // Fallback if oh-my-logo fails
      console.log('\n  MONOGRAUVI\n'.rainbow);
      console.log('  A music visualization and automation platform'.cyan.italic);
      console.log('  '.gray + 'Development server started'.dim + '\n');
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('  [Note: Fancy logo disabled. For best experience, ensure your terminal supports ANSI colors]'.dim);
      }
    }
    
  } catch (error) {
    // Final fallback if everything else fails
    console.log('\n  MONOGRAUVI\n');
    console.log('  A music visualization and automation platform');
    console.log('  Development server started\n');
    
    if (process.env.NODE_ENV !== 'production') {
      console.error('  [Debug: Logo error -', error.message + ']'.dim);
    }
  }
}

// Export the displayLogo function so it can be called after backend starts
module.exports = { displayLogo };

// If this file is run directly, show the logo immediately
if (require.main === module) {
  displayLogo().catch(() => {
    // If all else fails, just show a simple message
    console.log('\n  MONOGRAUVI - Started\n');
  });
}
