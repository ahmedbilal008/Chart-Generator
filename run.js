const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if Python is installed
function checkPythonInstallation() {
  try {
    const pythonProcess = spawn('python', ['--version']);
    
    return new Promise((resolve) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Python is installed');
          resolve(true);
        } else {
          console.error('❌ Python is not installed or not in PATH');
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('❌ Error checking Python installation:', error.message);
    return Promise.resolve(false);
  }
}

// Check if backend directory exists
function checkBackendDirectory() {
  const backendDir = path.join(__dirname, 'backend');
  if (!fs.existsSync(backendDir)) {
    console.error('❌ Backend directory not found:', backendDir);
    return false;
  }
  
  const requirementsFile = path.join(backendDir, 'requirements.txt');
  if (!fs.existsSync(requirementsFile)) {
    console.error('❌ requirements.txt not found in backend directory');
    return false;
  }
  
  console.log('✅ Backend directory and requirements.txt found');
  return true;
}

// Function to run a command in a specific directory
function runCommand(command, args, cwd, name) {
  console.log(`🚀 Starting ${name}...`);
  
  const proc = spawn(command, args, {
    cwd,
    shell: true,
    stdio: 'inherit'
  });

  proc.on('error', (error) => {
    console.error(`❌ Error running ${name}: ${error.message}`);
  });

  proc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ ${name} exited with code ${code}`);
    }
  });

  return proc;
}

// Main function to start both servers
async function startServers() {
  console.log('🔍 Checking environment...');
  
  // Check Python installation
  const pythonInstalled = await checkPythonInstallation();
  if (!pythonInstalled) {
    console.error('❌ Python is required to run the backend server.');
    console.error('Please install Python and try again.');
    process.exit(1);
  }
  
  // Check backend directory
  const backendDirExists = checkBackendDirectory();
  if (!backendDirExists) {
    console.error('❌ Backend directory setup is incorrect.');
    console.error('Please make sure the backend directory exists and contains requirements.txt.');
    process.exit(1);
  }
  
  // Start the backend server
  console.log('\n📡 Starting Python backend server...');
  const backendProc = runCommand('python', ['run.py'], path.join(__dirname, 'backend'), 'Backend server');

  // Wait a bit for the backend to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Start the frontend development server
  console.log('\n🖥️ Starting Next.js frontend server...');
  const frontendProc = runCommand('npm', ['run', 'dev'], __dirname, 'Frontend server');

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backendProc.kill('SIGINT');
    frontendProc.kill('SIGINT');
    process.exit(0);
  });

  console.log('\n✨ Both servers are running:');
  console.log('- Backend: http://localhost:8000');
  console.log('- Frontend: http://localhost:3000');
  console.log('\n🔄 Press Ctrl+C to stop both servers.\n');
}

// Start the servers
startServers().catch(error => {
  console.error('❌ Error starting servers:', error);
  process.exit(1);
}); 