# coordinator

The coordinator orchestrates multi-agent builds from owl specs.

## purpose

Parse owl specs into a task graph, assign components to builder agents, track progress, invoke auditing, and manage integration. The single point of coordination for a build.

## interfaces

### receives
- `CLAIM <component>` - builder requests to work on component
- `READY <component> <branch>` - builder completed work
- `BLOCKED <component> <dep>` - builder waiting on dependency
- `FAIL <component> <reason>` - builder failed
- `AUDIT <component> PASS|FAIL` - auditor result
- `INTEGRATED` / `INTEGRATION_FAIL` - integrator result

### emits
- `ASSIGN <component> <worktree> <spec-path>` - task assignment
- `REJECTED <component>` - component already claimed
- `UNBLOCKED <component>` - dependency now available

## state

```
components: Map<name, {
  status: 'available' | 'claimed' | 'building' | 'ready' | 'audited' | 'integrated',
  assignee: agent-id | null,
  branch: string | null,
  dependencies: string[],
  blockedBy: string[]
}>
```

## behavior

### initialization
1. Parse owl spec directory
2. Extract components from `components/*.md`
3. Build dependency graph from `interfaces.depends on` sections
4. Create git worktree per component
5. Set all components to `available`
6. Announce on build channel

### claim handling
1. On `CLAIM <component>`:
   - If available: set status=claimed, emit `ASSIGN`
   - If not available: emit `REJECTED`

### progress tracking
1. On `READY`: set status=ready, queue for audit
2. On `BLOCKED`: track blocker, notify when blocker READYs
3. On `FAIL`: log, optionally reassign (v0.2)

### audit orchestration
1. For each ready component, invoke auditor
2. On `AUDIT PASS`: set status=audited
3. On `AUDIT FAIL`: forward feedback to builder

### integration trigger
1. When all components audited: invoke integrator
2. On `INTEGRATED`: announce success, cleanup worktrees
3. On `INTEGRATION_FAIL`: escalate to human

## constraints

- Single coordinator per build
- Coordinator does not build - only orchestrates
- State persisted to allow recovery (v0.2)
