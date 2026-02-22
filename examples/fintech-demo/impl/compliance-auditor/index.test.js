const assert = require('node:test');
const { audit } = require('./index'); // Assume export added

assert('basic audit', () => {
  const result = audit('./spec', './impl');
  assert.strictEqual(typeof result, 'object');
  assert(result.passed === false); // Expect some issues in mock
});

console.log('Tests passed');