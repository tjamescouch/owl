# cli

command line interface for auditing owl specs.

## state

- parsed spec (product.md, components/, behaviors/, constraints.md)
- analyzed implementation (file tree, source content cache)
- audit results (passed, warnings, errors)

## capabilities

- parse owl spec directory (product.md, components/, behaviors/, constraints.md)
- analyze implementation directory (file tree + cached source content)
- validate product.md links resolve to spec files
- check component directories exist (with name mapping: api->backend, web->frontend)
- verify package.json per component (bypass for single-file tools)
- check capability coverage via keyword heuristics
- check interface endpoints appear in source
- validate behavior flow keywords against implementation
- validate stack constraints against package.json dependencies (deduplicated)
- check port constraints with pattern matching
- output cli report
- output json for ci integration

## interfaces

exposes:
- `auditor.js <spec-dir> [impl-dir]` - run audit
- `--json` flag for json output
- `--strict` flag to fail on warnings

## invariants

- never modifies spec or implementation files
- exit 0 on pass
- exit 1 on errors
- exit 2 on warnings with --strict
- duplicate check results are suppressed
- only top-level bullets are parsed (sub-bullets ignored)
