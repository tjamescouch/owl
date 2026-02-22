#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const md = require('markdown-it')();

// Mock regulatory database
const regs = {
  'KYC': 'Verify user identity with government ID',
  'AML': 'Monitor transactions for suspicious activity',
  'GDPR': 'Ensure data privacy and erasure rights'
};

function parseSpec(specDir) {
  const productPath = path.join(specDir, 'product.md');
  if (!fs.existsSync(productPath)) throw new Error('product.md not found');
  
  const content = fs.readFileSync(productPath, 'utf8');
  const tokens = md.parse(content, {});
  // Simplified: extract components mentioning compliance
  return tokens.filter(t => t.type === 'inline' && t.content.includes('compliance'));
}

function scanCode(codeDir) {
  // Mock scan: check for encryption mentions
  const files = fs.readdirSync(codeDir, { recursive: true });
  const violations = files.filter(f => !f.includes('encrypt') && f.endsWith('.js'));
  return violations;
}

function audit(specDir, codeDir) {
  try {
    const spec = parseSpec(specDir);
    const codeIssues = scanCode(codeDir || specDir); // Default to spec dir if no code
    
    const report = {
      passed: spec.length > 0 && codeIssues.length === 0,
      findings: codeIssues.map(issue => ({ type: 'missing-encryption', file: issue })),
      score: Math.max(0, 100 - codeIssues.length * 10)
    };
    
    console.log(JSON.stringify(report, null, 2));
    return report;
  } catch (err) {
    console.error('Audit failed:', err.message);
    process.exit(1);
  }
}

const [,, specDir, codeDir] = process.argv;
if (!specDir) {
  console.log('Usage: node index.js <spec-dir> [code-dir]');
  process.exit(1);
}

audit(specDir, codeDir);