#!/usr/bin/env node
const { displayLogo } = require('./show-logo');
const axios = require('axios');
const colors = require('colors');

async function waitForBackend() {
  const maxAttempts = 30;  // 30 attempts * 1s = 30s max wait
  const backendUrl = 'http://localhost:8001/health';
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get(backendUrl, { timeout: 1000 });
      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      // Ignore errors and retry
      if (i === 0) {
        console.log('  Waiting for backend to start...'.dim);
      } else if (i % 5 === 0) {
        process.stdout.write('.');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

async function main() {
  let isBackendReady = false;
  
  try {
    isBackendReady = await waitForBackend();
    if (isBackendReady) {
      console.log('\n');  // Add some space after the dots
      await displayLogo();
    } else {
      console.log('\n  Backend is taking too long to start. Showing logo anyway.\n'.yellow);
      await displayLogo();
    }
  } catch (error) {
    console.error('Error in wait-and-show-logo:', error.message);
  }
  
  // Keep the process alive
  if (isBackendReady) {
    console.log('\n  Development server is running!'.green);
    console.log('  - Frontend: '.white + 'http://localhost:5173'.cyan.underline);
    console.log('  - Backend API: '.white + 'http://localhost:8001'.cyan.underline);
    console.log('\n  Press Ctrl+C to stop the server\n'.dim);
    
    // Keep the process alive
    return new Promise(() => {
      // Handle process termination
      process.on('SIGINT', () => {
        console.log('\n  Shutting down development server...'.yellow);
        process.exit(0);
      });
      
      // Keep the event loop busy
      setInterval(() => {
        // This keeps the process alive
      }, 1000 * 60 * 60); // Check every hour (effectively forever)
    });
  }
  
  return isBackendReady;
}

// Start the main process
main().catch(error => {
  console.error('Error in wait-and-show-logo:', error);
  process.exit(1);
});
