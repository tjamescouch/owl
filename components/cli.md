# cli

command line interface for owl.

## state

- current working directory
- path to spec file (default: product.md)
- selected executor

## capabilities

- parses command line arguments
- dispatches to appropriate behavior (status, plan, apply, drift)
- passes options to executor
- prints output to terminal

## interfaces

exposes:
- `owl <command> [options]` - main entry point

commands:
- `init` - create product.md template
- `status` - compare spec to codebase
- `plan` - show what would change
- `apply` - build what's missing
- `drift` - check for divergence

options:
- `-d, --dir <path>` - project directory
- `-s, --spec <file>` - spec file path
- `-e, --executor <name>` - executor to use
- `-y, --yes` - auto-approve changes

depends on:
- executor component
- parser component

## invariants

- always exits with 0 on success, non-zero on failure
- never modifies files without explicit apply command
- prints help on unknown command
