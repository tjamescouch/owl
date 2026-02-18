# constraints

## communication

- all coordination happens over a single chat channel
- messages follow the protocol format: VERB <component> [args]
- valid verbs: CLAIM, ASSIGN, READY, BLOCKED, FAIL, REJECTED, AUDIT, INTEGRATED, INTEGRATION_FAIL

## environments

- each builder agent works in an isolated environment
- for same-machine builds: git worktrees, one per component
- branch naming: build/<component-name>
- agents must not modify files outside their assigned component's directory

## git

- all work happens on feature branches, never main
- agents push branches to origin when READY
- integrator merges to main only after all audits pass
- merge conflicts are resolved by the integrator, not builders

## protocol

- CLAIM is advisory - the coordinator confirms with ASSIGN or rejects with REJECTED
- READY means: code builds, tests pass (if any), self-audit passes
- FAIL includes a reason string
- AUDIT results reference the spec checks that passed or failed

## failure handling

- on AUDIT FAIL: agent retries once with auditor feedback
- on second AUDIT FAIL: coordinator escalates to human
- agent timeout: undefined in v0.1 (human intervention)

## scope

- v0.1 targets same-machine builds with git worktree isolation
- cross-machine builds are a future extension
