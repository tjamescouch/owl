# cli

command line interface.

## commands

- `tick add <text>` - add a task
- `tick done <id>` - mark task done
- `tick rm <id>` - remove task
- `tick list` - show all tasks
- `tick` - same as list

## output

list format:
```
[ ] abc123 buy milk
[x] def456 call mom
```

on add: prints task id
on done/rm: prints "done" or "removed"
on error: prints error to stderr, exits 1

## invariants

- no subcommands besides above
- unknown command prints help
- partial id match ok (first 4 chars)
