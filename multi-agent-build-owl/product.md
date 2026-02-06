# multi-agent build

a protocol for parallel software construction by multiple agents, coordinated through chat and driven by owl specs.

a coordinator agent reads an owl spec, decomposes it into component tasks, assigns each to a builder agent with an isolated environment, and orchestrates the build through completion.

## components

- [coordinator](components/coordinator.md) - reads spec, creates task graph, assigns and monitors agents
- [builder](components/builder.md) - builds one component to spec in an isolated environment
- [auditor](components/auditor.md) - validates a built component against its owl spec
- [integrator](components/integrator.md) - merges completed components and runs integration checks

## behaviors

- [build-flow](behaviors/build-flow.md) - full sequence from spec to merged code
- [failure](behaviors/failure.md) - handling build failures, audit failures, and agent timeouts

## constraints

see [constraints.md](constraints.md)
