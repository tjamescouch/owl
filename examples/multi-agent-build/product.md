# multi-agent-build

a protocol for parallel software construction by multiple AI agents.

agents coordinate via chat to claim components from an owl spec, build them in isolated environments, and merge validated implementations.

## components

- [coordinator](components/coordinator.md) - parses spec, creates task graph, manages assignments
- [builder](components/builder.md) - implements one component in isolated environment
- [auditor](components/auditor.md) - validates implementation against spec

## behaviors

- [build-flow](behaviors/build-flow.md) - full sequence from spec to merged code
- [failure-recovery](behaviors/failure-recovery.md) - timeouts, audit failures, conflicts

## constraints

see [constraints.md](constraints.md)
