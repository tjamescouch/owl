# integrator

Merges completed, audited components into a unified codebase.

## purpose

Combine independently built components into a working system. Verify cross-component integration works correctly.

## interfaces

### receives
- Invocation from coordinator when all components audited
- List of component branches in dependency order

### emits
- `INTEGRATED` - all components merged and integration tests pass
- `INTEGRATION_FAIL <reason>` - merge conflict or integration test failure

## behavior

### merge phase
1. Receive list of audited component branches
2. Sort by dependency order (dependencies merged first)
3. For each branch:
   - Merge into main
   - Resolve conflicts (prefer component code for its own files)
   - If conflict unresolvable: emit `INTEGRATION_FAIL`

### verification phase
1. Run integration tests if defined in spec
2. Verify cross-component interfaces connect:
   - Frontend calls correct API endpoints
   - Shared types/contracts match
3. If verification fails: emit `INTEGRATION_FAIL`

### completion
1. All merges successful + tests pass
2. Emit `INTEGRATED`
3. Optionally tag release

## constraints

- Only merges branches that have passed audit
- Merges in dependency order
- Does not modify component code beyond conflict resolution
- Integration tests defined in owl spec or project config
