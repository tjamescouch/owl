# parser

reads and links spec files.

## state

- root spec path (product.md)
- resolved spec tree

## capabilities

- finds product.md in directory
- follows markdown links to component/behavior specs
- gathers constraints.md
- resolves relative paths
- detects missing spec files

## interfaces

exposes:
- `find_spec(dir)` - locate product.md
- `gather_specs(dir, root_spec)` - collect all linked specs
- `read_spec(path)` - read single spec file

depends on:
- filesystem

## invariants

- never modifies spec files
- follows links only within project directory
- returns empty list if no specs found
