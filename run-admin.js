#!/usr/bin/env node

const { exec } = require('child_process');
const http = require('http');

console.log('🚀 Starting Perk Wallet Admin Interface...\n');

// Function to check if port is available
function checkPort(port, callback) {
  const server = http.createServer();
  server.listen(port, (err) => {
    server.close();
    callback(!err);
  });
  server.on('error', () => callback(false));
}

// Find available port
function findAvailablePort(startPort = 3000) {
  return new Promise((resolve) => {
    checkPort(startPort, (available) => {
      if (available) {
        resolve(startPort);
      } else {
        resolve(findAvailablePort(startPort + 1));
      }
    });
  });
}

async function startServer() {
  try {
    const port = await findAvailablePort(3000);
    
    console.log(`✅ Found available port: ${port}`);
    console.log('📦 Installing dependencies...\n');
    
    // Install dependencies if needed
    exec('npm install', (err) => {
      if (err) {
        console.error('❌ Error installing dependencies:', err);
        return;
      }
      
      console.log('🔄 Starting development server...\n');
      
      // Start the Next.js server
      const server = exec(`npm run dev -- --port ${port}`, (err) => {
        if (err) {
          console.error('❌ Error starting server:', err);
          return;
        }
      });
      
      server.stdout.on('data', (data) => {
        console.log(data.toString());
        
        // Look for the "Ready" message
        if (data.includes('Ready')) {
          console.log('\\n🎉 Admin Interface is ready!');
          console.log('\\n📖 Instructions:');
          console.log(`   1. Open: http://localhost:${port}/admin/emulator`);
          console.log('   2. Select "super_admin" role');
          console.log('   3. Click "Impersonate"');
          console.log('   4. You\'ll be redirected to the admin dashboard\\n');
          console.log('🔧 Make sure APP_EMULATOR_SECRET is set in .env.local');
          console.log('   APP_EMULATOR_SECRET=your-secret-key\\n');
        }
      });
      
      server.stderr.on('data', (data) => {
        console.error(data.toString());
      });
      
      // Handle Ctrl+C
      process.on('SIGINT', () => {
        console.log('\\n🛑 Shutting down server...');
        server.kill();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

startServer();