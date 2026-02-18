# integrator

merges completed, audited components into a unified codebase. invoked by the coordinator after all components pass audit.

## capabilities

- merge component branches into main in dependency order
- resolve merge conflicts (prefer newer component code for non-overlapping files)
- run integration tests if defined
- verify cross-component interfaces actually connect (e.g., frontend calls the right API endpoints)

## interfaces

exposes:
- INTEGRATED - all components merged successfully
- INTEGRATION_FAIL <reason> - merge or integration test failed

depends on:
- all component branches in READY status with AUDIT PASS
- invoked by coordinator after all audits pass

## invariants

- only merges branches that have passed audit
- merges in dependency order (dependencies first)
- does not modify component code beyond conflict resolution
