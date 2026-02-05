# build-flow

The complete sequence from owl spec to integrated codebase.

## phases

### 1. initialization

```
Coordinator:
  1. Read owl spec (product.md, components/*.md, constraints.md)
  2. Parse dependency graph from component interfaces
  3. Create git worktrees for each component
  4. Announce available components on #build
```

### 2. claiming

```
Builder:
  1. Connect to #build
  2. Emit CLAIM <component> for desired work

Coordinator:
  1. On CLAIM, check if component available
  2. If available: emit ASSIGN <component> <worktree-path>
  3. If taken: emit REJECTED <component>
  4. Track assignments in state
```

### 3. building

```
Builder:
  1. Receive ASSIGN, navigate to worktree
  2. Read component spec from provided path
  3. Check dependencies - if unmet, emit BLOCKED <component> <dep>
  4. Build component per spec
  5. Run local tests and auditor
  6. On success: commit, emit READY <component> <branch>
  7. On failure: emit FAIL <component> <reason>

Coordinator:
  1. On READY, queue component for audit
  2. On BLOCKED, track and notify when dependency READYs
  3. On FAIL, log and optionally reassign
```

### 4. auditing

```
Coordinator:
  1. For each READY component, invoke auditor
  2. Auditor checks implementation against spec

Auditor:
  1. Emit AUDIT <component> PASS if compliant
  2. Emit AUDIT <component> FAIL <findings> if not

Coordinator:
  1. On PASS, mark component as audited
  2. On FAIL, forward findings to builder for retry
```

### 5. integration

```
Coordinator:
  1. When all components AUDIT PASS, invoke integrator

Integrator:
  1. Merge branches in dependency order (deps first)
  2. Run integration tests if defined
  3. Emit INTEGRATED on success
  4. Emit INTEGRATION_FAIL <reason> on failure

Coordinator:
  1. On INTEGRATED, announce completion
  2. On INTEGRATION_FAIL, escalate to human
```

## sequence diagram

```
Human          Coordinator      Builder-A       Builder-B       Auditor
  |                |                |               |              |
  |--owl spec----->|                |               |              |
  |                |--worktrees---->|               |              |
  |                |                |               |              |
  |                |<--CLAIM api----|               |              |
  |                |---ASSIGN api-->|               |              |
  |                |                |               |              |
  |                |<---------------+--CLAIM web----|              |
  |                |----------------+--ASSIGN web-->|              |
  |                |                |               |              |
  |                |                |--build------->|              |
  |                |<--READY api----|               |--BLOCKED---->|
  |                |                |               |              |
  |                |----invoke------|---------------|------------->|
  |                |<---AUDIT PASS--|---------------|--------------|
  |                |                |               |              |
  |                |----unblock-----|-------------->|              |
  |                |                |               |--build------>|
  |                |<---------------|--READY web----|              |
  |                |                |               |              |
  |                |----invoke------|---------------|------------->|
  |                |<---AUDIT PASS--|---------------|--------------|
  |                |                |               |              |
  |                |----integrate-->|               |              |
  |<--INTEGRATED---|                |               |              |
```
