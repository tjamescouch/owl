# hello-owl

a minimal example for testing multi-agent build protocol (MABP).

## purpose

demonstrate coordinated building with dependency ordering:
- two components can build in parallel (greeter, formatter)
- one component depends on both (cli)

## components

- **greeter**: generates greeting messages
- **formatter**: styles/decorates text output
- **cli**: command-line entry point, combines greeter + formatter

## success criteria

- `hello-owl Alice` outputs styled greeting
- each component buildable independently
- dependency chain enforced (cli waits for greeter + formatter)
