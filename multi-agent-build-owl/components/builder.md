# builder

The builder agent constructs a single component from an owl spec in an isolated environment.

## purpose

Build one component to spec, run local validation, and signal completion. The builder works autonomously within its scope but coordinates with the system via chat protocol.

## interfaces

### receives
- `ASSIGN <component> <worktree-path> <spec-path>` - task assignment from coordinator
- `AUDIT <component> FAIL <feedback>` - retry signal with specific feedback

### emits
- `CLAIM <component>` - request to work on a component
- `READY <component> <branch>` - component built and locally validated
- `BLOCKED <component> <dependency>` - waiting for another component
- `FAIL <component> <reason>` - build or validation failed

## behavior

1. **Claim phase**
   - Builder emits `CLAIM <component>` to request work
   - Waits for `ASSIGN` from coordinator
   - If no assignment within timeout, may claim different component

2. **Setup phase**
   - Receives worktree path and component spec
   - Changes to worktree directory
   - Reads component spec and constraints

3. **Build phase**
   - Implements the component per spec
   - Follows all constraints from constraints.md
   - If blocked on dependency: emits `BLOCKED`, waits for dependency `READY`

4. **Validation phase**
   - Runs local tests if specified in spec
   - Runs auditor against own component
   - If validation fails: emits `FAIL` with reason

5. **Completion phase**
   - Commits work to feature branch
   - Emits `READY <component> <branch>`
   - Awaits final `AUDIT` result from coordinator

6. **Retry phase** (if audit fails)
   - Receives `AUDIT <component> FAIL <feedback>`
   - Applies feedback, rebuilds
   - Returns to validation phase
   - Max 1 retry, then escalates to human

## constraints

- Must work only within assigned worktree
- Must not modify files outside component scope
- Must follow constraints.md from the project spec
- Must emit status messages for all state transitions
- Must include tests if component spec requires them
