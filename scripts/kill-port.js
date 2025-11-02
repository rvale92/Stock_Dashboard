#!/usr/bin/env node
// Helper script to kill processes on a specific port

const port = process.argv[2] || '3000';

const { exec } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';

let command;
if (isWindows) {
  command = `netstat -ano | findstr :${port}`;
} else {
  command = `lsof -ti:${port}`;
}

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.log(`✅ Port ${port} is free`);
    process.exit(0);
  }

  const pids = stdout.trim().split('\n').filter(Boolean);
  
  if (pids.length === 0) {
    console.log(`✅ Port ${port} is free`);
    process.exit(0);
  }

  console.log(`🔍 Found ${pids.length} process(es) using port ${port}`);
  
  pids.forEach(pid => {
    const cleanPid = pid.trim();
    console.log(`   Killing PID: ${cleanPid}`);
    
    if (isWindows) {
      exec(`taskkill /PID ${cleanPid} /F`, (err) => {
        if (err) console.error(`   ❌ Failed to kill ${cleanPid}`);
        else console.log(`   ✅ Killed ${cleanPid}`);
      });
    } else {
      exec(`kill -9 ${cleanPid}`, (err) => {
        if (err) console.error(`   ❌ Failed to kill ${cleanPid}`);
        else console.log(`   ✅ Killed ${cleanPid}`);
      });
    }
  });
  
  setTimeout(() => {
    console.log(`✅ Port ${port} should be free now`);
  }, 1000);
});

