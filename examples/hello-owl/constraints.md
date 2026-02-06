# constraints

## language

- TypeScript with ES modules
- Node.js runtime
- no external dependencies beyond Node built-ins

## structure

```
hello-owl/
  src/
    greeter.ts
    formatter.ts
    cli.ts
  package.json
  tsconfig.json
```

## conventions

- functions export as named exports
- pure functions where possible (greeter, formatter)
- cli handles process args and output
