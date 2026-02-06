# failure-recovery

handling timeouts, audit failures, and conflicts.

## timeout handling

when builder misses 3 consecutive PROGRESS checkins (30 min total):

```
coordinator: TIMEOUT <component>
coordinator: marks task as pending (unassigned)
coordinator: re-broadcasts TASKS with available components
[any builder can now CLAIM the timed-out component]
```

timed-out agent can reconnect and CLAIM again if they recover.

## audit failure

when auditor returns FAIL:

```
auditor: AUDIT <component> FAIL <details>
builder: reads feedback
builder: fixes issues
builder: updates PR
builder: READY <component> <pr-url> (retry)
```

retry limits:
- 3 attempts by same builder
- after 3 failures, coordinator reassigns:

```
coordinator: RETRY <component>
coordinator: marks task as pending
[different builder can CLAIM]
```

original builder should not re-CLAIM the same component.

## claim conflicts

when two builders CLAIM same component within 1 second:

```
builder-A: CLAIM <component>
builder-B: CLAIM <component>  (nearly simultaneous)
coordinator: uses timestamp, earlier wins
coordinator: ACK <component> <builder-A>
coordinator: REJECT <component> <builder-B> "already claimed"
```

builder-B should CLAIM a different component.

## dependency cycles

if dependency graph has cycles (A depends on B, B depends on A):

```
coordinator: detects cycle during TASKS generation
coordinator: ERROR "dependency cycle detected: A <-> B"
coordinator: halts build, notifies human
```

cycles must be resolved in spec before build can proceed.

## catastrophic failure

if builder's environment is broken:

```
builder: ABORT <component> "environment failure"
coordinator: marks task as pending
coordinator: TIMEOUT not applied (voluntary abort)
[any builder can CLAIM]
```

## network partition

if agent loses AgentChat connection:
- agent should reconnect and resume
- if task was TIMEOUT'd during partition, agent must re-CLAIM
- in-progress work is preserved in worktree

## human escalation

coordinator escalates to human when:
- all builders have failed a component 3+ times
- dependency cycle detected
- claim dispute cannot be resolved automatically
- build exceeds maximum time limit (configurable, default 2 hours)

```
coordinator: ESCALATE <issue-description>
[human intervenes via chat or spec modification]
```
