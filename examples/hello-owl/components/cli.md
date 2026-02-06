# cli

command-line entry point combining greeter and formatter.

## capabilities

- parse command line arguments
- generate and display formatted greeting
- support --formal and --color flags

## interfaces

exposes:
- CLI entry point (shebang, executable)
- usage: `hello-owl <name> [--formal] [--color=<color>]`

depends on:
- greeter: greet function
- formatter: format function

## invariants

- exits 0 on success
- exits 1 with usage on missing name argument
- outputs to stdout

## examples

```
$ hello-owl Alice
Hey Alice!  (in green)

$ hello-owl Bob --formal --color=blue
Good day, Bob.  (in blue)
```
