# failure

how the protocol handles things going wrong.

## audit failure

1. auditor sends AUDIT <component> FAIL with itemized findings
2. coordinator forwards findings to the builder
3. builder incorporates feedback and rebuilds
4. builder re-runs self-audit, sends READY again when passing
5. coordinator dispatches auditor for second pass
6. if second audit passes: normal flow resumes
7. if second audit fails: coordinator escalates to human

a builder gets one retry. two consecutive audit failures for the same component require human intervention.

## build failure

1. builder encounters an error it cannot resolve
2. builder sends FAIL <component> <reason>
3. coordinator may reassign to the same builder with guidance, or escalate to human
4. if reassigned: builder gets a fresh worktree and starts over
5. if escalated: coordinator pauses the component and continues with others where possible

## agent timeout

undefined in v0.1. if an agent stops responding, human intervention is required.

future versions may add:
- heartbeat messages (PING/PONG)
- configurable timeout per component
- automatic task reclamation and reassignment

## integration failure

1. integrator sends INTEGRATION_FAIL <reason>
2. coordinator identifies which components conflict
3. coordinator may request builders to adjust interfaces
4. builders update their components and re-run through audit
5. integrator retries merge

if integration failure persists, coordinator escalates to human.

## cascade effects

- if a dependency component fails, all components blocked on it remain BLOCKED
- coordinator does not cancel blocked components - they wait until the dependency is resolved or human intervenes
- independent components continue building regardless of failures in unrelated components
