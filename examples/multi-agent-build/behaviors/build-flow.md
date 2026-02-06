# build-flow

the full sequence from owl spec to merged code.

## phases

### 1. initialization

```
human: provides owl spec directory path
coordinator: parses spec, builds dependency graph
coordinator: broadcasts TASKS <spec-url> to #build
```

### 2. claiming

```
builder-A: CLAIM <component-1>
coordinator: ACK <component-1> <builder-A>
builder-B: CLAIM <component-2>
coordinator: ACK <component-2> <builder-B>
...
```

first-come-first-serve. coordinator rejects duplicate claims.

### 3. building

each builder works independently:

```
builder: creates worktree (git worktree add ../build-X origin/main)
builder: reads component spec
builder: implements to spec
builder: PROGRESS <component> 25%
builder: continues implementing...
builder: PROGRESS <component> 50%
builder: runs tests
builder: PROGRESS <component> 75%
builder: creates PR
builder: READY <component> <pr-url>
```

if blocked on dependency:
```
builder: BLOCKED <component> <dependency>
[waits for MERGED <dependency>]
builder: pulls dependency, continues
```

### 4. auditing

```
auditor: receives READY notification
auditor: checks out PR branch
auditor: validates against spec
auditor: AUDIT <component> PASS
  - or -
auditor: AUDIT <component> FAIL <details>
```

on FAIL, builder iterates (see failure-recovery).

### 5. merging

```
coordinator: receives AUDIT PASS
coordinator: merges PR to main
coordinator: MERGED <component>
[dependent builders unblocked]
```

### 6. completion

```
coordinator: all components MERGED
coordinator: BUILD COMPLETE <spec-url>
```

## sequence diagram

```
Human      Coordinator    Builder-A    Builder-B    Auditor
  |             |             |            |           |
  |--spec-url-->|             |            |           |
  |             |--TASKS----->|            |           |
  |             |--TASKS----------------->|           |
  |             |             |            |           |
  |             |<--CLAIM-api-|            |           |
  |             |---ACK------>|            |           |
  |             |             |<--CLAIM-web|           |
  |             |             |---ACK----->|           |
  |             |             |            |           |
  |             |<--PROGRESS--|            |           |
  |             |             |<--PROGRESS-|           |
  |             |             |            |           |
  |             |<--READY-----|            |           |
  |             |--audit-req--------------->|          |
  |             |             |<--AUDIT-PASS-----------|
  |             |--MERGED---->|            |           |
  |             |--MERGED--------------->|            |
  |             |             |            |           |
  |             |             |<--READY----|           |
  |             |--audit-req--------------->|          |
  |             |             |<--AUDIT-PASS-----------|
  |             |--MERGED--------------->|            |
  |             |             |            |           |
  |<--COMPLETE--|             |            |           |
```
