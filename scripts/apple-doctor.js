#!/usr/bin/env node

const https = require('https');
const http = require('http');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function getStatusSymbol(status) {
  switch (status) {
    case 'ok':
      return colorize('✓', 'green');
    case 'warn':
      return colorize('⚠', 'yellow');
    case 'fail':
      return colorize('✗', 'red');
    default:
      return '•';
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'ok':
      return 'green';
    case 'warn':
      return 'yellow';
    case 'fail':
      return 'red';
    default:
      return 'gray';
  }
}

async function fetchDoctorData() {
  const url = process.env.APP_URL || 'http://localhost:3000';
  const endpoint = `${url}/api/admin/apple/doctor`;
  
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(endpoint, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(json);
          } else {
            reject(new Error(json.error || `HTTP ${res.statusCode}`));
          }
        } catch (error) {
          reject(new Error('Failed to parse response'));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function printSection(title, items) {
  console.log(`\n${colorize(title.toUpperCase(), 'bold')}`);
  console.log(colorize('─'.repeat(50), 'gray'));
  
  for (const item of items) {
    const symbol = getStatusSymbol(item.status);
    const name = colorize(item.name, getStatusColor(item.status));
    const details = colorize(item.details, 'gray');
    console.log(`  ${symbol} ${name}`);
    console.log(`    ${details}`);
  }
}

function printSummary(data) {
  console.log(`\n${colorize('SUMMARY', 'bold')}`);
  console.log(colorize('─'.repeat(50), 'gray'));
  
  // Find key values from certificate section
  const certSection = data.sections.certificate || [];
  const teamId = certSection.find(i => i.name === 'Certificate OU')?.details || 'Not found';
  const passTypeId = process.env.APPLE_PASS_TYPE_IDENTIFIER || 'Not set';
  const cn = certSection.find(i => i.name === 'Certificate CN')?.details || 'Not found';
  const fingerprint = certSection.find(i => i.name === 'SHA-1 Fingerprint')?.details || 'Not found';
  
  // Find signing results
  const signingSection = data.sections.signing || [];
  const passSize = signingSection.find(i => i.name === 'Pass Size')?.details || 'N/A';
  const passSha = signingSection.find(i => i.name === 'Pass SHA-256')?.details || 'N/A';
  
  console.log(`  ${colorize('Team ID:', 'cyan')} ${teamId}`);
  console.log(`  ${colorize('Pass Type ID:', 'cyan')} ${passTypeId}`);
  console.log(`  ${colorize('Certificate CN:', 'cyan')} ${cn}`);
  console.log(`  ${colorize('Fingerprint:', 'cyan')} ${fingerprint}`);
  console.log(`  ${colorize('Test Pass Size:', 'cyan')} ${passSize}`);
  console.log(`  ${colorize('Test Pass SHA:', 'cyan')} ${passSha}`);
  
  // Count statuses
  let okCount = 0;
  let warnCount = 0;
  let failCount = 0;
  
  for (const section of Object.values(data.sections)) {
    for (const item of section) {
      if (item.status === 'ok') okCount++;
      else if (item.status === 'warn') warnCount++;
      else if (item.status === 'fail') failCount++;
    }
  }
  
  console.log(`\n  ${colorize('Status:', 'bold')} ${colorize(`${okCount} OK`, 'green')} | ${colorize(`${warnCount} WARN`, 'yellow')} | ${colorize(`${failCount} FAIL`, 'red')}`);
  
  if (failCount === 0 && warnCount === 0) {
    console.log(`\n  ${colorize('✓ All checks passed!', 'green')}`);
  } else if (failCount > 0) {
    console.log(`\n  ${colorize('✗ Some checks failed. Review the details above.', 'red')}`);
  } else {
    console.log(`\n  ${colorize('⚠ Some warnings detected. Review the details above.', 'yellow')}`);
  }
}

async function main() {
  console.log(colorize('🍎 Apple Wallet Doctor', 'bold'));
  console.log(colorize('Checking Apple Wallet configuration...', 'gray'));
  
  try {
    const data = await fetchDoctorData();
    
    // Print each section
    printSection('Environment Variables', data.sections.env);
    printSection('Certificate', data.sections.certificate);
    printSection('Signing Test', data.sections.signing);
    printSection('Routes', data.sections.routes);
    
    // Print summary
    printSummary(data);
    
    console.log(`\n${colorize(`Timestamp: ${new Date(data.timestamp).toLocaleString()}`, 'gray')}\n`);
    
    // Exit with appropriate code
    const hasFailures = Object.values(data.sections).some(section =>
      section.some(item => item.status === 'fail')
    );
    process.exit(hasFailures ? 1 : 0);
    
  } catch (error) {
    console.error(`\n${colorize('ERROR:', 'red')} ${error.message}`);
    console.error(colorize('\nMake sure the server is running (pnpm dev) and APP_EMULATOR_SECRET is set.', 'gray'));
    process.exit(1);
  }
}

main();