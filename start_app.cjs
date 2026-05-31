const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Unitoolbox Full Stack...');

const FRONTEND_DIR = path.resolve(__dirname);
const BACKEND_DIR = path.resolve(__dirname, 'backend');

// Helper to start process
const startProcess = (name, command, args, cwd) => {
    console.log(`[${name}] Starting...`);
    const proc = spawn(command, args, {
        cwd,
        shell: true,
        stdio: 'inherit' // Pipe output directly to main console
    });

    proc.on('error', (err) => console.error(`[${name}] Error:`, err));
    proc.on('exit', (code) => console.log(`[${name}] Exited with code ${code}`));
    return proc;
};

// 1. Kill potential zombie processes
try {
    require('child_process').execSync('taskkill /F /IM node.exe', { stdio: 'ignore' });
} catch (e) { }

console.log('🧹 Ports cleared.');

// 2. Start Backend
console.log('📂 Backend Dir:', BACKEND_DIR);
const backend = startProcess('BACKEND', 'node', ['server.js'], BACKEND_DIR);

// 3. Start Frontend (Wait a bit for backend to initialize)
setTimeout(() => {
    console.log('📂 Frontend Dir:', FRONTEND_DIR);
    const frontend = startProcess('FRONTEND', 'npm', ['run', 'dev'], FRONTEND_DIR);
}, 2000);

console.log('✅ Services Launching... Access at http://localhost:3000');
