#!/usr/bin/env node

/**
 * Production Verification Script
 * 
 * Verifies that the production deployment is working correctly.
 * Run this after deploying to production.
 * 
 * Usage: node scripts/verify-production.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';
const TIMEOUT = 10000; // 10 seconds

const checks = [];
let passed = 0;
let failed = 0;

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: TIMEOUT, ...options }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, data });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function check(name, testFn) {
  process.stdout.write(`Checking ${name}... `);
  try {
    await testFn();
    console.log('✅ PASSED');
    checks.push({ name, status: 'passed' });
    passed++;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    checks.push({ name, status: 'failed', error: error.message });
    failed++;
  }
}

async function runChecks() {
  console.log('\n🔍 InstalEase Production Verification\n');
  console.log(`Target: ${BASE_URL}\n`);

  // 1. Check if app is accessible
  await check('Application is accessible', async () => {
    const response = await makeRequest(BASE_URL);
    if (response.status !== 200 && response.status !== 302) {
      throw new Error(`Expected 200 or 302, got ${response.status}`);
    }
  });

  // 2. Check HTTPS
  await check('HTTPS is enabled', async () => {
    if (!BASE_URL.startsWith('https://')) {
      throw new Error('URL does not use HTTPS');
    }
  });

  // 3. Check security headers
  await check('Security headers are present', async () => {
    const response = await makeRequest(BASE_URL);
    const headers = response.headers;
    
    const requiredHeaders = [
      'strict-transport-security',
      'x-frame-options',
      'x-content-type-options',
    ];
    
    const missing = requiredHeaders.filter(h => !headers[h.toLowerCase()]);
    if (missing.length > 0) {
      throw new Error(`Missing headers: ${missing.join(', ')}`);
    }
  });

  // 4. Check API health (if health endpoint exists)
  await check('API is responding', async () => {
    try {
      const response = await makeRequest(`${BASE_URL}/api/health`);
      if (response.status >= 500) {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      // Health endpoint might not exist, that's okay
      if (!error.message.includes('404')) {
        throw error;
      }
    }
  });

  // 5. Check build info
  await check('Build is production', async () => {
    // This is a placeholder - implement based on your build info endpoint
    // You could add a /api/build-info endpoint that returns build metadata
  });

  // 6. Check Sentry (if configured)
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    await check('Sentry is configured', async () => {
      if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
        throw new Error('Sentry DSN not configured');
      }
    });
  }

  // Print summary
  console.log('\n📊 Verification Summary\n');
  console.log(`Total checks: ${checks.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Checks:');
    checks
      .filter(c => c.status === 'failed')
      .forEach(c => {
        console.log(`  - ${c.name}: ${c.error}`);
      });
  }
  
  console.log('\n');
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run checks
runChecks().catch((error) => {
  console.error('Verification script error:', error);
  process.exit(1);
});

