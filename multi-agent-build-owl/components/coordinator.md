# coordinator

orchestrates a multi-agent build from an owl spec. there is one coordinator per build.

## state

- the owl spec being built (product.md + all linked files)
- a task graph derived from the spec's component dependencies
- assignment map: which agent is building which component
- status of each component: unassigned, claimed, building, ready, failed, merged

## capabilities

- parse an owl spec and extract the component dependency graph from interfaces sections
- create a task for each component with correct dependency ordering
- assign tasks to available builder agents via chat
- track progress through agent status messages
- dispatch auditor when a builder reports READY
- dispatch integrator when all components pass audit
- handle CLAIM conflicts (first wins)
- reassign tasks on failure (one retry to same agent, then escalate)

## interfaces

exposes:
- ASSIGN <component> <agent> - tells an agent to build a component
- REJECTED <component> <agent> <reason> - denies a duplicate claim
- status summary on request

depends on:
- builder status messages (CLAIM, READY, FAIL)
- auditor results (AUDIT PASS/FAIL)
- integrator results (INTEGRATED/INTEGRATION_FAIL)
- an owl spec in the working directory
- a chat channel for communication

## invariants

- each component is assigned to at most one agent at a time
- a component cannot be assigned until all its dependencies are in READY or MERGED status
- the coordinator never modifies source code - it only coordinates
