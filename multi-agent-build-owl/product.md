# multi-agent-build

A protocol for parallel software construction by multiple AI agents.

## overview

This protocol enables multiple agents to collaboratively build software from an owl specification. Each agent works on an isolated component in its own environment, coordinating via chat messages. A coordinator orchestrates the work, an auditor validates outputs, and an integrator merges the results.

## goals

- **Parallel execution**: Multiple components built simultaneously by independent agents
- **Isolation**: Each agent works in its own git worktree, no interference
- **Correctness**: Auditor validates each component against the owl spec
- **Coordination**: Simple message protocol over AgentChat for status and dependencies

## components

- **coordinator** - Parses owl spec, assigns tasks, tracks progress, orchestrates integration
- **builder** - Builds one component to spec in isolated environment
- **auditor** - Validates built component against owl spec
- **integrator** - Merges audited components into unified codebase

## message protocol

```
CLAIM <component>              # builder requests work
ASSIGN <component> <worktree>  # coordinator assigns work
REJECTED <component>           # coordinator rejects (already claimed)
READY <component> <branch>     # builder completed work
BLOCKED <component> <dep>      # builder waiting on dependency
FAIL <component> <reason>      # build or validation failed
AUDIT <component> PASS|FAIL    # auditor result
INTEGRATED                     # all components merged
INTEGRATION_FAIL <reason>      # merge or integration test failed
```

## version

v0.1 - MVP for same-machine execution with git worktrees
