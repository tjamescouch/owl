# builder

implements one component from the owl spec in an isolated environment.

## state

- assigned component name
- worktree path
- branch name
- build status (setup|coding|testing|ready)
- dependency status (which deps are ready)

## capabilities

- create git worktree for isolated development
- read component spec and understand requirements
- implement component following constraints
- run tests to validate implementation
- create PR when complete
- respond to audit feedback and iterate

## interfaces

exposes (via AgentChat):
- `CLAIM <component>` - request to build this component
- `PROGRESS <component> <pct>` - periodic heartbeat with progress
- `BLOCKED <component> <dep>` - waiting for dependency
- `READY <component> <pr-url>` - implementation complete
- `ABORT <component> <reason>` - giving up, reclaim task

depends on:
- coordinator: ACK for assignment, MERGED for dependencies
- auditor: AUDIT result for iteration
- owl spec: component requirements

## invariants

- must send PROGRESS at least every 10 minutes
- must not modify files outside component boundary
- must create branch `build/<component-name>`
- must run tests before sending READY
- must respond to AUDIT FAIL with fix or ABORT
