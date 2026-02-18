#!/usr/bin/env node
/**
 * owl auditor - check spec coverage against implementation
 *
 * Usage: node auditor.js <spec-dir> [impl-dir] [--json] [--strict]
 */

import fs from 'fs';
import path from 'path';

// --- CLI ---

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

// --- Parsing helpers ---

/** Extract top-level bullet points only (ignores indented sub-bullets). */
function extractBulletPoints(content) {
  return content.split('\n')
    .filter(line => /^- /.test(line))
    .map(line => line.substring(2));
}

/** Extract bullet points under a ## heading. */
function extractSection(content, section) {
  const regex = new RegExp(`## ${section}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'i');
  const match = content.match(regex);
  if (!match) return [];
  return extractBulletPoints(match[1]);
}

/** Parse markdown links from a product.md section: [name](path) */
function extractLinks(content, section) {
  const links = [];
  const re = new RegExp(`## ${section}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'i');
  const match = content.match(re);
  if (!match) return links;
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m;
  while ((m = linkRe.exec(match[1])) !== null) {
    links.push({ name: m[1], path: m[2] });
  }
  return links;
}

// --- Spec parser ---

function parseSpec(dir) {
  const spec = {
    product: null,
    productLinks: [],
    behaviorLinks: [],
    components: [],
    behaviors: [],
    constraints: [],
  };

  const productPath = path.join(dir, 'product.md');
  if (fs.existsSync(productPath)) {
    spec.product = fs.readFileSync(productPath, 'utf-8');
    spec.productLinks = extractLinks(spec.product, 'components');
    spec.behaviorLinks = extractLinks(spec.product, 'behaviors');
  }

  const constraintsPath = path.join(dir, 'constraints.md');
  if (fs.existsSync(constraintsPath)) {
    spec.constraints = extractBulletPoints(
      fs.readFileSync(constraintsPath, 'utf-8')
    );
  }

  const componentsDir = path.join(dir, 'components');
  if (fs.existsSync(componentsDir)) {
    for (const file of fs.readdirSync(componentsDir)) {
      if (!file.endsWith('.md')) continue;
      const name = file.replace('.md', '');
      const content = fs.readFileSync(path.join(componentsDir, file), 'utf-8');
      spec.components.push({
        name,
        capabilities: extractSection(content, 'capabilities'),
        interfaces: extractSection(content, 'interfaces'),
        invariants: extractSection(content, 'invariants'),
        state: extractSection(content, 'state'),
      });
    }
  }

  const behaviorsDir = path.join(dir, 'behaviors');
  if (fs.existsSync(behaviorsDir)) {
    for (const file of fs.readdirSync(behaviorsDir)) {
      if (!file.endsWith('.md')) continue;
      const name = file.replace('.md', '');
      const content = fs.readFileSync(path.join(behaviorsDir, file), 'utf-8');
      spec.behaviors.push({
        name,
        flow: extractSection(content, 'flow'),
        failureModes: extractSection(content, 'failure modes'),
      });
    }
  }

  return spec;
}

// --- Implementation analyzer ---

function analyzeImpl(dir) {
  const impl = { files: [], structure: {}, sourceContent: new Map() };

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
        if (/\.(js|jsx|ts|tsx|json|mjs)$/.test(entry)) {
          try {
            impl.sourceContent.set(rel, fs.readFileSync(full, 'utf-8'));
          } catch { /* skip unreadable */ }
        }
      }
    }
  }

  walk(dir);
  return impl;
}

/** Concatenate source content for files under given directory prefixes. */
function getComponentSource(impl, dirNames) {
  const chunks = [];
  for (const [rel, content] of impl.sourceContent) {
    if (dirNames.some(d => rel.startsWith(d + '/') || rel.startsWith(d + path.sep))) {
      chunks.push(content);
    }
  }
  return chunks.join('\n');
}

/** Concatenate all source content. */
function getAllSource(impl) {
  return [...impl.sourceContent.values()].join('\n');
}

// --- Name mapping ---

function componentDirNames(name) {
  const names = new Set([name]);
  if (name === 'api') names.add('backend');
  if (name === 'web') names.add('frontend');
  return [...names];
}

function findComponentDirs(comp, impl) {
  const candidates = componentDirNames(comp.name);
  return candidates.filter(d =>
    impl.files.some(f => f.startsWith(d + '/') || f.startsWith(d + path.sep))
  );
}

// --- Capability keyword extraction ---

function capabilityKeywords(capability) {
  const lower = capability.toLowerCase();
  const keywords = [];

  // Backtick-quoted identifiers
  const backtickRe = /`([^`]+)`/g;
  let m;
  while ((m = backtickRe.exec(lower)) !== null) {
    keywords.push({ type: 'identifier', value: m[1] });
  }

  // Route patterns in the text
  const routeMatch = lower.match(/(get|post|put|patch|delete)\s+(\/\S+)/);
  if (routeMatch) {
    keywords.push({ type: 'route', method: routeMatch[1], path: routeMatch[2] });
    return keywords; // route is sufficient
  }

  // Meaningful content words
  const stopwords = new Set([
    'a', 'an', 'the', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'by',
    'with', 'as', 'is', 'it', 'can', 'do', 'does', 'all', 'be', 'from',
    'that', 'this', 'each', 'per', 'if', 'has', 'its', 'via', 'not',
  ]);
  const words = lower.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w =>
    w.length > 2 && !stopwords.has(w)
  );
  if (words.length > 0) {
    keywords.push({ type: 'words', value: words });
  }

  return keywords;
}

/** Check if a capability's keywords appear in source code. */
function capabilityFound(cap, source) {
  const kws = capabilityKeywords(cap);
  if (kws.length === 0) return true; // nothing to check

  for (const kw of kws) {
    const lower = source.toLowerCase();
    if (kw.type === 'identifier') {
      if (lower.includes(kw.value)) return true;
    } else if (kw.type === 'route') {
      const basePath = kw.path.replace(/:[^/]+/g, '').replace(/\/\//g, '/').replace(/\/+$/, '');
      if (lower.includes(kw.path)) return true;
      if (basePath.length > 1 && lower.includes(basePath)) return true;
    } else if (kw.type === 'words') {
      const hits = kw.value.filter(w => lower.includes(w));
      if (hits.length >= Math.ceil(kw.value.length * 0.5)) return true;
    }
  }

  return false;
}

// --- Audit ---

function audit(spec, impl) {
  const results = { errors: [], warnings: [], passed: [] };
  const seen = new Set();

  function add(level, msg) {
    if (seen.has(msg)) return;
    seen.add(msg);
    results[level].push(msg);
  }

  // 1. Spec structure
  if (!spec.product) {
    add('errors', 'Missing product.md');
  }

  for (const link of spec.productLinks) {
    if (!fs.existsSync(path.join(specDir, link.path))) {
      add('errors', `Broken link in product.md: ${link.name} -> ${link.path}`);
    }
  }

  for (const link of spec.behaviorLinks) {
    if (!fs.existsSync(path.join(specDir, link.path))) {
      add('errors', `Broken link in product.md: ${link.name} -> ${link.path}`);
    }
  }

  const linkedNames = new Set(spec.productLinks.map(l => l.name));
  for (const comp of spec.components) {
    if (linkedNames.size > 0 && !linkedNames.has(comp.name)) {
      add('warnings', `Component '${comp.name}' exists but is not linked from product.md`);
    }
  }

  // 2. Component checks
  const isSingleComponent = spec.components.length === 1;

  for (const comp of spec.components) {
    const matchedDirs = findComponentDirs(comp, impl);
    const foundRootFiles = impl.files.some(f =>
      !f.includes('/') && !f.includes(path.sep) && /\.(js|ts|mjs)$/.test(f)
    );

    // Directory existence
    if (matchedDirs.length > 0) {
      add('passed', `Component '${comp.name}' has implementation directory`);
    } else if (isSingleComponent && foundRootFiles) {
      add('passed', `Component '${comp.name}' has implementation files`);
    } else {
      add('errors', `Component '${comp.name}' - no matching directory found`);
      continue;
    }

    // package.json
    const dirs = matchedDirs.length > 0 ? matchedDirs : [''];
    const hasPackageJson = impl.files.some(f =>
      dirs.some(d => d ? (f.startsWith(d + '/') || f.startsWith(d + path.sep)) : !f.includes('/'))
      && f.endsWith('package.json')
    );
    if (hasPackageJson) {
      add('passed', `Component '${comp.name}' has package.json`);
    } else if (isSingleComponent && foundRootFiles) {
      add('passed', `Component '${comp.name}' is single-file (no package.json needed)`);
    } else {
      add('warnings', `Component '${comp.name}' - no package.json found`);
    }

    // Capability coverage
    const source = matchedDirs.length > 0
      ? getComponentSource(impl, matchedDirs)
      : getAllSource(impl);

    if (source && comp.capabilities.length > 0) {
      let matched = 0;
      const missed = [];

      for (const cap of comp.capabilities) {
        if (capabilityFound(cap, source)) {
          matched++;
        } else {
          missed.push(cap);
        }
      }

      const total = comp.capabilities.length;
      const pct = Math.round((matched / total) * 100);

      if (pct === 100) {
        add('passed', `Component '${comp.name}' capabilities: ${matched}/${total} keywords found`);
      } else if (pct >= 50) {
        add('warnings', `Component '${comp.name}' capabilities: ${matched}/${total} keywords found`);
        for (const m of missed) add('warnings', `  missing: "${m}"`);
      } else {
        add('errors', `Component '${comp.name}' capabilities: ${matched}/${total} keywords found`);
        for (const m of missed) add('errors', `  missing: "${m}"`);
      }
    }

    // Interface endpoint checks
    const endpoints = comp.interfaces.filter(i =>
      /`?(GET|POST|PUT|PATCH|DELETE)\s/i.test(i)
    );
    for (const iface of endpoints) {
      const match = iface.match(/`?(GET|POST|PUT|PATCH|DELETE)\s+(\S+?)`?(?:\s|$)/i);
      if (!match) continue;
      const [, method, routePath] = match;
      const basePath = routePath.replace(/`/g, '').replace(/:[^/]+/g, '').replace(/\/\//g, '/').replace(/\/+$/, '');
      const originalPath = routePath.replace(/`/g, '');
      if ((basePath.length > 1 && source.includes(basePath)) || source.includes(originalPath)) {
        add('passed', `Interface '${method.toUpperCase()} ${routePath}' found in implementation`);
      } else {
        add('warnings', `Interface '${method.toUpperCase()} ${routePath}' not found in implementation`);
      }
    }
  }

  // 3. Behavior checks
  for (const behavior of spec.behaviors) {
    if (behavior.flow.length === 0) continue;
    const allSource = getAllSource(impl);
    if (!allSource) continue;

    const flowText = behavior.flow.join(' ').toLowerCase();
    const words = flowText.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3);
    const unique = [...new Set(words)];
    const hits = unique.filter(w => allSource.toLowerCase().includes(w));
    const pct = unique.length > 0 ? Math.round((hits.length / unique.length) * 100) : 0;

    if (pct >= 50) {
      add('passed', `Behavior '${behavior.name}' flow keywords: ${hits.length}/${unique.length} found`);
    } else {
      add('warnings', `Behavior '${behavior.name}' flow keywords: ${hits.length}/${unique.length} found`);
    }
  }

  // 4. Constraint checks
  const checkedStacks = new Set();

  for (const constraint of spec.constraints) {
    const lower = constraint.toLowerCase();

    // Port constraints
    const portMatch = lower.match(/(?:on |port\s*)(\d{4,5})/);
    if (portMatch) {
      const port = portMatch[1];
      let found = false;
      for (const [, content] of impl.sourceContent) {
        const portRe = new RegExp(
          `(?:listen\\s*\\(\\s*${port}` +
          `|port[:\\s=]+\\s*${port}` +
          `|PORT.*${port}` +
          `|${port}\\s*[,;)])`,
        );
        if (portRe.test(content)) { found = true; break; }
      }
      add(found ? 'passed' : 'warnings', `Constraint: port ${port} ${found ? 'found' : 'not found'} in code`);
    }

    // Stack constraints (deduplicated)
    const stacks = ['react', 'express', 'vite', 'apollo', 'graphql'];
    for (const stack of stacks) {
      if (!lower.includes(stack)) continue;
      if (checkedStacks.has(stack)) continue;
      checkedStacks.add(stack);

      let found = false;
      for (const [rel, content] of impl.sourceContent) {
        if (!rel.endsWith('package.json')) continue;
        try {
          const pkg = JSON.parse(content);
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };
          if (Object.keys(deps).some(d => d.toLowerCase().includes(stack))) {
            found = true;
            break;
          }
        } catch { /* skip */ }
      }

      add(
        found ? 'passed' : 'errors',
        `Constraint: ${stack} ${found ? 'found' : 'required but not found'} in dependencies`,
      );
    }
  }

  return results;
}

// --- Run ---

const spec = parseSpec(specDir);
const impl = analyzeImpl(implDir);
const results = audit(spec, impl);

// --- Output ---

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

if (results.errors.length) {
  process.exit(1);
} else if (results.warnings.length && strict) {
  process.exit(2);
} else {
  process.exit(0);
}
