# auditor

Validates a built component against its owl spec.

## purpose

Verify that a builder's implementation matches the component specification. Provides independent validation as a trust-but-verify check.

## interfaces

### receives
- Invocation from coordinator with component name, spec path, branch

### emits
- `AUDIT <component> PASS` - implementation matches spec
- `AUDIT <component> FAIL <findings>` - itemized list of failures

## checks performed

### structural
- Expected files/directories exist
- Dependencies declared in package.json/etc match constraints
- Entry points present

### interface compliance
- Exposed endpoints/functions exist
- Required dependencies imported correctly
- API signatures match spec

### constraint compliance
- Tech stack matches constraints.md
- No forbidden dependencies
- Code organization follows spec

## behavior

1. Receive audit request from coordinator
2. Checkout component branch
3. Read component spec
4. Run structural checks
5. Run interface checks
6. Run constraint checks
7. Aggregate results
8. Emit PASS if all checks pass, FAIL with findings otherwise

## constraints

- Auditor is read-only - never modifies code
- Audit result is deterministic for same code + spec
- Findings are specific and actionable
- Can reuse existing `auditor/auditor.js` from owl repo
