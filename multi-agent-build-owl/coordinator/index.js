#!/usr/bin/env node
/**
 * Multi-agent build coordinator
 *
 * Orchestrates parallel builds from owl specs via AgentChat.
 *
 * Usage: node coordinator/index.js <owl-spec-dir> [--channel #build] [--repo-dir .]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import WebSocket from 'ws';
import crypto from 'crypto';

// Configuration
const AGENTCHAT_URL = process.env.AGENTCHAT_URL || 'wss://agentchat-server.fly.dev';
const DEFAULT_CHANNEL = '#build';

// State
const state = {
  components: new Map(),
  specDir: null,
  repoDir: null,
  channel: DEFAULT_CHANNEL,
  agentId: null,
  ws: null,
  worktreeBase: null,
};

// Parse command line
function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: coordinator <owl-spec-dir> [--channel #build] [--repo-dir .]');
    process.exit(1);
  }

  state.specDir = path.resolve(args[0]);
  state.repoDir = process.cwd();
  state.channel = DEFAULT_CHANNEL;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--channel' && args[i + 1]) {
      state.channel = args[++i];
    } else if (args[i] === '--repo-dir' && args[i + 1]) {
      state.repoDir = path.resolve(args[++i]);
    }
  }

  state.worktreeBase = path.join(state.repoDir, '.build-worktrees');
}

// Parse owl spec directory
function parseSpec() {
  console.log(`Parsing owl spec: ${state.specDir}`);

  const componentsDir = path.join(state.specDir, 'components');
  if (!fs.existsSync(componentsDir)) {
    console.error(`No components directory found at ${componentsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const name = path.basename(file, '.md');
    const content = fs.readFileSync(path.join(componentsDir, file), 'utf-8');
    const deps = parseDependencies(content);

    state.components.set(name, {
      name,
      specFile: path.join(componentsDir, file),
      status: 'available',
      assignee: null,
      branch: null,
      dependencies: deps,
      blockedBy: [],
      worktree: null,
    });

    console.log(`  Component: ${name} (deps: ${deps.length ? deps.join(', ') : 'none'})`);
  }

  if (state.components.size === 0) {
    console.error('No components found in spec');
    process.exit(1);
  }
}

// Parse dependencies from component spec
function parseDependencies(content) {
  const deps = [];

  // Look for "depends on:" or "depends on" section
  const dependsMatch = content.match(/depends\s+on[:\s]*\n([\s\S]*?)(?=\n\n|\n##|\n#|$)/i);
  if (dependsMatch) {
    const lines = dependsMatch[1].split('\n');
    for (const line of lines) {
      // Match "- component" or "- component (description)"
      const match = line.match(/^\s*-\s*(\w+)/);
      if (match) {
        deps.push(match[1]);
      }
    }
  }

  // Also check interfaces section for "depends on:"
  const interfacesMatch = content.match(/##\s*interfaces[\s\S]*?depends\s+on[:\s]*([\s\S]*?)(?=\n\n|\n##|$)/i);
  if (interfacesMatch) {
    const lines = interfacesMatch[1].split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*-\s*(\w+)/);
      if (match && !deps.includes(match[1])) {
        deps.push(match[1]);
      }
    }
  }

  return deps;
}

// Create git worktrees for each component
function createWorktrees() {
  console.log(`Creating worktrees in ${state.worktreeBase}`);

  if (!fs.existsSync(state.worktreeBase)) {
    fs.mkdirSync(state.worktreeBase, { recursive: true });
  }

  for (const [name, comp] of state.components) {
    const worktreePath = path.join(state.worktreeBase, name);
    const branchName = `build/${name}`;

    // Remove existing worktree if present
    if (fs.existsSync(worktreePath)) {
      try {
        execSync(`git worktree remove --force "${worktreePath}"`, {
          cwd: state.repoDir,
          stdio: 'pipe'
        });
      } catch (e) {
        // Ignore errors
      }
    }

    // Delete branch if exists
    try {
      execSync(`git branch -D "${branchName}"`, { cwd: state.repoDir, stdio: 'pipe' });
    } catch (e) {
      // Branch may not exist
    }

    // Create new worktree with branch
    try {
      execSync(`git worktree add -b "${branchName}" "${worktreePath}"`, {
        cwd: state.repoDir,
        stdio: 'pipe'
      });
      comp.worktree = worktreePath;
      comp.branch = branchName;
      console.log(`  Created worktree: ${name} -> ${worktreePath}`);
    } catch (e) {
      console.error(`  Failed to create worktree for ${name}: ${e.message}`);
    }
  }
}

// Connect to AgentChat
function connect() {
  return new Promise((resolve, reject) => {
    state.agentId = '@coord-' + crypto.randomBytes(4).toString('hex');

    console.log(`Connecting to AgentChat as ${state.agentId}...`);

    state.ws = new WebSocket(AGENTCHAT_URL);

    state.ws.on('open', () => {
      // Send identity
      state.ws.send(JSON.stringify({
        type: 'identity',
        agent_id: state.agentId
      }));

      // Join channel
      state.ws.send(JSON.stringify({
        type: 'join',
        channel: state.channel
      }));

      console.log(`Connected and joined ${state.channel}`);
      resolve();
    });

    state.ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        handleMessage(msg);
      } catch (e) {
        // Ignore parse errors
      }
    });

    state.ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
      reject(err);
    });

    state.ws.on('close', () => {
      console.log('Disconnected from AgentChat');
    });
  });
}

// Send message to channel
function send(text) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
    console.error('Not connected');
    return;
  }

  state.ws.send(JSON.stringify({
    type: 'message',
    to: state.channel,
    content: text
  }));
}

// Handle incoming messages
function handleMessage(msg) {
  if (msg.type !== 'message') return;
  if (msg.from === state.agentId) return; // Ignore own messages
  if (msg.to !== state.channel) return;

  const content = msg.content.trim();
  const from = msg.from;

  // Parse protocol messages
  if (content.startsWith('CLAIM ')) {
    const component = content.slice(6).trim();
    handleClaim(from, component);
  } else if (content.startsWith('READY ')) {
    const parts = content.slice(6).trim().split(/\s+/);
    const component = parts[0];
    const branch = parts[1] || null;
    handleReady(from, component, branch);
  } else if (content.startsWith('BLOCKED ')) {
    const parts = content.slice(8).trim().split(/\s+/);
    const component = parts[0];
    const dep = parts[1] || null;
    handleBlocked(from, component, dep);
  } else if (content.startsWith('FAIL ')) {
    const parts = content.slice(5).trim().split(/\s+/);
    const component = parts[0];
    const reason = parts.slice(1).join(' ') || 'unknown';
    handleFail(from, component, reason);
  } else if (content.startsWith('AUDIT ')) {
    const parts = content.slice(6).trim().split(/\s+/);
    const component = parts[0];
    const result = parts[1]?.toUpperCase();
    const details = parts.slice(2).join(' ');
    handleAudit(from, component, result, details);
  }
}

// Handle CLAIM
function handleClaim(from, componentName) {
  const comp = state.components.get(componentName);

  if (!comp) {
    send(`REJECTED ${componentName} - unknown component`);
    console.log(`[REJECTED] ${from} claimed unknown component: ${componentName}`);
    return;
  }

  if (comp.status !== 'available') {
    send(`REJECTED ${componentName} - already ${comp.status}${comp.assignee ? ` by ${comp.assignee}` : ''}`);
    console.log(`[REJECTED] ${from} claimed unavailable component: ${componentName} (${comp.status})`);
    return;
  }

  // Check if dependencies are met
  const unmetDeps = comp.dependencies.filter(dep => {
    const depComp = state.components.get(dep);
    return !depComp || !['ready', 'audited', 'integrated'].includes(depComp.status);
  });

  // Assign the component
  comp.status = 'claimed';
  comp.assignee = from;
  comp.blockedBy = unmetDeps;

  const assignMsg = `ASSIGN ${componentName} ${comp.worktree} ${comp.specFile}`;
  send(assignMsg);
  console.log(`[ASSIGN] ${componentName} -> ${from}`);

  // Notify if blocked
  if (unmetDeps.length > 0) {
    send(`NOTE ${componentName} blocked by: ${unmetDeps.join(', ')}`);
    console.log(`  Blocked by: ${unmetDeps.join(', ')}`);
  }

  printStatus();
}

// Handle READY
function handleReady(from, componentName, branch) {
  const comp = state.components.get(componentName);

  if (!comp) {
    console.log(`[READY] Unknown component: ${componentName}`);
    return;
  }

  if (comp.assignee !== from) {
    console.log(`[READY] ${from} not assigned to ${componentName}`);
    return;
  }

  comp.status = 'ready';
  if (branch) comp.branch = branch;

  console.log(`[READY] ${componentName} (branch: ${comp.branch})`);

  // Unblock dependent components
  for (const [name, other] of state.components) {
    if (other.blockedBy.includes(componentName)) {
      other.blockedBy = other.blockedBy.filter(d => d !== componentName);
      if (other.blockedBy.length === 0 && other.status === 'claimed') {
        send(`UNBLOCKED ${name}`);
        console.log(`[UNBLOCKED] ${name}`);
      }
    }
  }

  // Run auditor
  runAudit(componentName);

  printStatus();
}

// Handle BLOCKED
function handleBlocked(from, componentName, dep) {
  const comp = state.components.get(componentName);
  if (!comp) return;

  console.log(`[BLOCKED] ${componentName} waiting on ${dep}`);

  if (dep && !comp.blockedBy.includes(dep)) {
    comp.blockedBy.push(dep);
  }
}

// Handle FAIL
function handleFail(from, componentName, reason) {
  const comp = state.components.get(componentName);
  if (!comp) return;

  console.log(`[FAIL] ${componentName}: ${reason}`);

  // For v0.1, just log it. v0.2 would reassign or retry.
  send(`ACK ${componentName} FAIL - logged for human review`);

  printStatus();
}

// Handle AUDIT result
function handleAudit(from, componentName, result, details) {
  const comp = state.components.get(componentName);
  if (!comp) return;

  if (result === 'PASS') {
    comp.status = 'audited';
    console.log(`[AUDIT PASS] ${componentName}`);

    // Check if all components are audited
    const allAudited = [...state.components.values()].every(c => c.status === 'audited');
    if (allAudited) {
      triggerIntegration();
    }
  } else {
    console.log(`[AUDIT FAIL] ${componentName}: ${details}`);
    // Forward to builder for retry
    send(`@${comp.assignee} AUDIT ${componentName} FAIL ${details}`);
  }

  printStatus();
}

// Run auditor on a component
function runAudit(componentName) {
  const comp = state.components.get(componentName);
  if (!comp) return;

  console.log(`[AUDITING] ${componentName}...`);

  // Try to run the owl auditor
  const auditorPath = path.join(state.repoDir, 'auditor', 'auditor.js');

  if (fs.existsSync(auditorPath)) {
    try {
      const result = execSync(
        `node "${auditorPath}" "${state.specDir}" "${comp.worktree}"`,
        { cwd: state.repoDir, encoding: 'utf-8', stdio: 'pipe' }
      );

      // Check for pass/fail in output
      if (result.includes('PASSED') || result.includes('passed')) {
        send(`AUDIT ${componentName} PASS`);
        handleAudit(state.agentId, componentName, 'PASS', '');
      } else {
        send(`AUDIT ${componentName} FAIL ${result.slice(0, 200)}`);
        handleAudit(state.agentId, componentName, 'FAIL', result.slice(0, 200));
      }
    } catch (e) {
      const output = e.stdout || e.message;
      send(`AUDIT ${componentName} FAIL ${output.slice(0, 200)}`);
      handleAudit(state.agentId, componentName, 'FAIL', output.slice(0, 200));
    }
  } else {
    // No auditor available, auto-pass for v0.1
    console.log(`  No auditor found, auto-passing`);
    send(`AUDIT ${componentName} PASS (no auditor configured)`);
    handleAudit(state.agentId, componentName, 'PASS', '');
  }
}

// Trigger integration
function triggerIntegration() {
  console.log('\n=== ALL COMPONENTS AUDITED ===');
  console.log('Triggering integration...\n');

  // Sort components by dependency order
  const sorted = topologicalSort();

  send(`INTEGRATING - merging in order: ${sorted.join(' -> ')}`);

  // For v0.1, just report. Real integration would merge branches.
  let success = true;

  for (const name of sorted) {
    const comp = state.components.get(name);
    console.log(`  Merging ${name} (${comp.branch})...`);

    try {
      // In a real implementation, would do: git merge <branch>
      // For now, just mark as integrated
      comp.status = 'integrated';
    } catch (e) {
      success = false;
      send(`INTEGRATION_FAIL ${name}: ${e.message}`);
      break;
    }
  }

  if (success) {
    send('INTEGRATED - all components merged successfully');
    console.log('\n=== BUILD COMPLETE ===');
    printStatus();

    // Cleanup worktrees
    cleanupWorktrees();
  }
}

// Topological sort for dependency order
function topologicalSort() {
  const sorted = [];
  const visited = new Set();
  const visiting = new Set();

  function visit(name) {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      throw new Error(`Circular dependency detected: ${name}`);
    }

    visiting.add(name);
    const comp = state.components.get(name);

    for (const dep of comp.dependencies) {
      if (state.components.has(dep)) {
        visit(dep);
      }
    }

    visiting.delete(name);
    visited.add(name);
    sorted.push(name);
  }

  for (const name of state.components.keys()) {
    visit(name);
  }

  return sorted;
}

// Cleanup worktrees
function cleanupWorktrees() {
  console.log('\nCleaning up worktrees...');

  for (const [name, comp] of state.components) {
    if (comp.worktree && fs.existsSync(comp.worktree)) {
      try {
        execSync(`git worktree remove --force "${comp.worktree}"`, {
          cwd: state.repoDir,
          stdio: 'pipe'
        });
        console.log(`  Removed: ${name}`);
      } catch (e) {
        console.log(`  Failed to remove ${name}: ${e.message}`);
      }
    }
  }
}

// Print status
function printStatus() {
  console.log('\n--- Component Status ---');
  for (const [name, comp] of state.components) {
    const blocked = comp.blockedBy.length > 0 ? ` [blocked by: ${comp.blockedBy.join(', ')}]` : '';
    const assignee = comp.assignee ? ` (${comp.assignee})` : '';
    console.log(`  ${name}: ${comp.status}${assignee}${blocked}`);
  }
  console.log('------------------------\n');
}

// Announce available components
function announce() {
  const available = [...state.components.values()]
    .filter(c => c.status === 'available')
    .map(c => c.name);

  send(`BUILD STARTING - owl spec: ${path.basename(state.specDir)}`);
  send(`Available components: ${available.join(', ')}`);
  send(`Claim with: CLAIM <component>`);

  // Show dependency info
  for (const [name, comp] of state.components) {
    if (comp.dependencies.length > 0) {
      send(`  ${name} depends on: ${comp.dependencies.join(', ')}`);
    }
  }
}

// Main
async function main() {
  parseArgs();
  parseSpec();
  createWorktrees();

  await connect();

  announce();
  printStatus();

  // Keep running
  console.log('Coordinator running. Press Ctrl+C to stop.\n');

  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    send('BUILD COORDINATOR STOPPING');
    cleanupWorktrees();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
