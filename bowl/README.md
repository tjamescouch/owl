# bowl

the owl compiler - parses specs into executable plans.

## components

- **parser** - reads product.md, follows links, gathers all specs
- **analyzer** - validates specs, checks for conflicts
- **planner** - diffs specs against codebase, generates plan

## usage

```python
from bowl import parse, analyze, plan

specs = parse("./my-product")  # returns dict of spec paths
issues = analyze(specs)         # returns validation issues
actions = plan(specs, "./src")  # returns what to build/change
```

## status

- [x] parser: find_spec, gather_specs, read_spec
- [ ] analyzer: validate spec structure
- [ ] planner: diff against codebase
