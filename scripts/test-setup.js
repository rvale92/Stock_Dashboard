#!/usr/bin/env node
// Test script to verify proxy and React setup

const { exec } = require('child_process');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const log = (color, message) => {
  console.log(`${color}${message}${colors.reset}`);
};

const testEndpoint = (url, description) => {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          log(colors.green, `✅ ${description}`);
          resolve(true);
        } else {
          log(colors.red, `❌ ${description} - Status: ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      log(colors.red, `❌ ${description} - Error: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      log(colors.red, `❌ ${description} - Timeout`);
      resolve(false);
    });
  });
};

log(colors.cyan, '\n🧪 Testing Stock Dashboard Setup\n');

// Wait a bit for servers to start
setTimeout(async () => {
  log(colors.yellow, 'Waiting 3 seconds for servers to start...\n');
  
  setTimeout(async () => {
    const results = [];
    
    // Test proxy health
    results.push(await testEndpoint('http://localhost:3001/health', 'Proxy Health Check'));
    
    // Test proxy quote endpoint
    results.push(await testEndpoint('http://localhost:3001/api/quote?symbol=AAPL', 'Proxy Quote Endpoint'));
    
    // Test React app (basic connectivity)
    results.push(await testEndpoint('http://localhost:3000', 'React App (port 3000)'));

    const successCount = results.filter(r => r).length;
    const totalCount = results.length;

    log(colors.cyan, `\n📊 Test Results: ${successCount}/${totalCount} passed\n`);

    if (successCount === totalCount) {
      log(colors.green, '🎉 All tests passed! Setup is working correctly.\n');
      process.exit(0);
    } else {
      log(colors.yellow, '⚠️  Some tests failed. Check server logs for details.\n');
      process.exit(1);
    }
  }, 3000);
}, 2000);

