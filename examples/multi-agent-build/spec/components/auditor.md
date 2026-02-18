# auditor

validates a built component against its owl spec. invoked by the coordinator after a builder reports READY.

## capabilities

- read the component's owl spec (state, capabilities, interfaces, invariants)
- inspect the built implementation (file structure, dependencies, code)
- check structural compliance: expected files, dependencies, endpoints exist
- check behavioral compliance where possible: interfaces match, invariants upheld
- produce a pass/fail result with itemized findings

## interfaces

exposes:
- AUDIT <component> PASS - all checks passed
- AUDIT <component> FAIL <findings> - itemized list of failures

depends on:
- the component's owl spec file
- the built code on a git branch
- invoked by coordinator after builder reports READY

## invariants

- auditor is read-only - never modifies code or spec
- audit result is deterministic for the same code + spec pair
