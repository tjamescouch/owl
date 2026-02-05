# cli

command line interface for auditing owl specs.

## state

- parsed spec (product.md, components/, constraints.md)
- analyzed implementation (file tree, package.json contents)
- audit results (passed, warnings, errors)

## capabilities

- parse owl spec directory
- analyze implementation directory
- check component directories exist
- verify package.json per component
- validate stack constraints (express, react, vite, etc)
- check port constraints
- output cli report (colorized)
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
