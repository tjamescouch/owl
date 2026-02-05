# owl

natural language terraform for products. describe what you want, agent builds it.

## components

- [cli](components/cli.md) - command line interface
- [executor](components/executor.md) - runs specs against codebases
- [parser](components/parser.md) - reads and links spec files
- [state](components/state.md) - tracks what has been built

## behaviors

- [status](behaviors/status.md) - compare spec to reality
- [plan](behaviors/plan.md) - determine what would change
- [apply](behaviors/apply.md) - build what's missing
- [drift](behaviors/drift.md) - detect divergence

## constraints

see [constraints.md](constraints.md)
