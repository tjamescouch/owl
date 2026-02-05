import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const auditor = path.join(__dirname, 'auditor.js');
const root = path.join(__dirname, '..');

function run(specDir, implDir, flags = '') {
  try {
    const output = execSync(
      `node ${auditor} ${specDir} ${implDir} ${flags}`,
      { cwd: root, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return { code: 0, output };
  } catch (e) {
    return { code: e.status, output: e.stdout || '' };
  }
}

describe('auditor', () => {
  it('passes todo-owl against todo', () => {
    const { code, output } = run('todo-owl', 'todo');
    assert.strictEqual(code, 0, `Expected pass but got:\n${output}`);
    assert(output.includes('PASS'));
  });

  it('passes poll-owl against poll', () => {
    const { code, output } = run('poll-owl', 'poll');
    assert.strictEqual(code, 0, `Expected pass but got:\n${output}`);
    assert(output.includes('PASS'));
  });

  it('passes auditor-owl against auditor', () => {
    const { code, output } = run('auditor-owl', 'auditor');
    assert.strictEqual(code, 0, `Expected pass but got:\n${output}`);
    assert(output.includes('PASS'));
  });

  it('outputs json with --json flag', () => {
    const { code, output } = run('todo-owl', 'todo', '--json');
    assert.strictEqual(code, 0);
    const json = JSON.parse(output);
    assert(Array.isArray(json.passed));
    assert(Array.isArray(json.errors));
    assert(Array.isArray(json.warnings));
  });

  it('fails on mismatched spec/impl', () => {
    const { code } = run('todo-owl', 'poll');
    assert.strictEqual(code, 1, 'Expected failure for mismatched spec/impl');
  });
});
