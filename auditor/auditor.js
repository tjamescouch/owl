#!/usr/bin/env node
/**
 * owl auditor - check spec coverage against implementation
 *
 * Usage: node auditor.js <spec-dir> [impl-dir] [--format cli|json] [--strict]
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const flags = args.filter(a => a.startsWith('--'));
const positional = args.filter(a => !a.startsWith('--'));

const specDir = positional[0];
const implDir = positional[1] || '.';
const format = flags.includes('--json') ? 'json' : 'cli';
const strict = flags.includes('--strict');

if (!specDir) {
  console.error('Usage: auditor.js <spec-dir> [impl-dir] [--json] [--strict]');
  process.exit(1);
}

// Parse owl spec
function parseSpec(dir) {
  const spec = { components: [], constraints: [], product: null };

  // Read product.md
  const productPath = path.join(dir, 'product.md');
  if (fs.existsSync(productPath)) {
    spec.product = fs.readFileSync(productPath, 'utf-8');
  }

  // Read constraints.md
  const constraintsPath = path.join(dir, 'constraints.md');
  if (fs.existsSync(constraintsPath)) {
    const content = fs.readFileSync(constraintsPath, 'utf-8');
    spec.constraints = extractBulletPoints(content);
  }

  // Read components
  const componentsDir = path.join(dir, 'components');
  if (fs.existsSync(componentsDir)) {
    for (const file of fs.readdirSync(componentsDir)) {
      if (file.endsWith('.md')) {
        const name = file.replace('.md', '');
        const content = fs.readFileSync(path.join(componentsDir, file), 'utf-8');
        spec.components.push({
          name,
          capabilities: extractSection(content, 'capabilities'),
          interfaces: extractSection(content, 'interfaces'),
          invariants: extractSection(content, 'invariants'),
        });
      }
    }
  }

  return spec;
}

function extractBulletPoints(content) {
  return content.split('\n')
    .filter(line => line.trim().startsWith('- '))
    .map(line => line.trim().substring(2));
}

function extractSection(content, section) {
  const regex = new RegExp(`## ${section}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'i');
  const match = content.match(regex);
  if (!match) return [];
  return extractBulletPoints(match[1]);
}

// Analyze implementation
function analyzeImpl(dir) {
  const impl = { files: [], structure: {} };

  function walk(d, prefix = '') {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d)) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      const full = path.join(d, entry);
      const rel = path.join(prefix, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        impl.structure[rel] = 'dir';
        walk(full, rel);
      } else {
        impl.files.push(rel);
        impl.structure[rel] = 'file';
      }
    }
  }

  walk(dir);
  return impl;
}

// Simple heuristic checks
function audit(spec, impl) {
  const results = { errors: [], warnings: [], passed: [] };

  // Check each component has corresponding directory or files
  for (const comp of spec.components) {
    const possibleDirs = [comp.name, `${comp.name}end`, comp.name.replace('api', 'backend').replace('web', 'frontend')];
    const foundDir = possibleDirs.some(d =>
      impl.files.some(f => f.startsWith(d + '/') || f.startsWith(d + path.sep))
    );

    // Also check for single-file CLI tools (files at root matching component or spec name)
    const specName = path.basename(specDir).replace('-owl', '');
    const foundRootFiles = impl.files.some(f =>
      !f.includes('/') && !f.includes(path.sep) && f.endsWith('.js')
    );
    const isSingleComponent = spec.components.length === 1;

    if (foundDir) {
      results.passed.push(`Component '${comp.name}' has implementation directory`);
    } else if (isSingleComponent && foundRootFiles) {
      results.passed.push(`Component '${comp.name}' has implementation files`);
    } else {
      results.errors.push(`Component '${comp.name}' - no matching directory found`);
    }

    // Check for package.json (skip for single-file CLI tools)
    const nameVariants = [comp.name, comp.name.replace('api', 'backend'), comp.name.replace('web', 'frontend')];
    const hasPackageJson = impl.files.some(f =>
      nameVariants.some(n => f.startsWith(n + '/') || f.startsWith(n + path.sep)) && f.endsWith('package.json')
    );
    if (hasPackageJson) {
      results.passed.push(`Component '${comp.name}' has package.json`);
    } else if (isSingleComponent && foundRootFiles) {
      // Single-file CLI tools don't need package.json
      results.passed.push(`Component '${comp.name}' is single-file (no package.json needed)`);
    } else {
      results.warnings.push(`Component '${comp.name}' - no package.json found`);
    }
  }

  // Check constraints (simple keyword matching)
  for (const constraint of spec.constraints) {
    const lower = constraint.toLowerCase();

    // Port constraints
    const portMatch = lower.match(/port (\d+)/);
    if (portMatch) {
      const port = portMatch[1];
      const hasPort = impl.files.some(f => {
        if (!f.endsWith('.js') && !f.endsWith('.json')) return false;
        try {
          const content = fs.readFileSync(path.join(implDir, f), 'utf-8');
          return content.includes(port);
        } catch { return false; }
      });
      if (hasPort) {
        results.passed.push(`Constraint: port ${port} found in code`);
      } else {
        results.warnings.push(`Constraint: port ${port} not found in code`);
      }
    }

    // Stack constraints (react, express, etc - not node, it's a runtime)
    const stacks = ['react', 'express', 'vite', 'apollo'];
    for (const stack of stacks) {
      if (lower.includes(stack)) {
        const hasStack = impl.files.some(f => {
          if (!f.endsWith('package.json')) return false;
          try {
            const pkg = JSON.parse(fs.readFileSync(path.join(implDir, f), 'utf-8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            return Object.keys(deps).some(d => d.toLowerCase().includes(stack));
          } catch { return false; }
        });
        if (hasStack) {
          results.passed.push(`Constraint: ${stack} found in dependencies`);
        } else {
          results.errors.push(`Constraint: ${stack} required but not found in dependencies`);
        }
      }
    }
  }

  return results;
}

// Run audit
const spec = parseSpec(specDir);
const impl = analyzeImpl(implDir);
const results = audit(spec, impl);

// Output
if (format === 'json') {
  console.log(JSON.stringify(results, null, 2));
} else {
  console.log('\n🦉 Owl Auditor\n');
  console.log(`Spec: ${specDir}`);
  console.log(`Impl: ${implDir}\n`);

  if (results.passed.length) {
    console.log('✅ Passed:');
    results.passed.forEach(p => console.log(`   ${p}`));
    console.log();
  }

  if (results.warnings.length) {
    console.log('⚠️  Warnings:');
    results.warnings.forEach(w => console.log(`   ${w}`));
    console.log();
  }

  if (results.errors.length) {
    console.log('❌ Errors:');
    results.errors.forEach(e => console.log(`   ${e}`));
    console.log();
  }

  const total = results.passed.length + results.warnings.length + results.errors.length;
  console.log(`Summary: ${results.passed.length}/${total} checks passed`);

  if (results.errors.length) {
    console.log('\nResult: FAIL');
  } else if (results.warnings.length && strict) {
    console.log('\nResult: FAIL (strict mode)');
  } else {
    console.log('\nResult: PASS');
  }
}

// Exit code
if (results.errors.length) {
  process.exit(1);
} else if (results.warnings.length && strict) {
  process.exit(2);
} else {
  process.exit(0);
}
