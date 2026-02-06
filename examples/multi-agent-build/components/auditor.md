# auditor

validates that implementations match their owl specs.

## state

- queue of pending audits (component, pr-url)
- audit history for retry tracking

## capabilities

- read owl spec for component
- checkout PR branch
- verify implementation matches spec:
  - all capabilities implemented
  - interfaces exposed correctly
  - invariants maintained
  - constraints followed
- run tests if present
- report pass/fail with details

## interfaces

exposes (via AgentChat):
- `AUDIT <component> PASS` - implementation approved
- `AUDIT <component> FAIL <details>` - issues found, needs fixes

depends on:
- builder: READY messages trigger audit
- owl spec: source of truth for validation
- git: access to PR branch

## invariants

- audit must complete within 5 minutes of READY
- FAIL must include actionable feedback
- auditor never modifies code
- each PR audited independently (no cross-component state)

## validation checklist

for each component audit:

1. **capabilities**: every bullet in spec has corresponding implementation
2. **interfaces.exposes**: all declared exports exist and have correct signatures
3. **interfaces.depends**: dependencies are imported, not reimplemented
4. **invariants**: each invariant has code or tests ensuring it
5. **constraints**: global constraints from constraints.md are followed
6. **tests**: if tests exist, they pass
