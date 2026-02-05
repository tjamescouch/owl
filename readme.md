# owl

a natural language declarative specification format. like terraform, but you describe what you want in plain english and an agent builds it.

## structure

```
owl/           language and layout specification
todo-owl/      example: a todo app spec written in owl
todo/          example: implementation built from todo-owl
```

## how it works

1. write a spec in markdown (product.md, components/, constraints.md)
2. agent reads spec, compares to codebase
3. agent builds what's missing

## spec format

```
project/
├── product.md          # what is this, links to components
├── components/
│   ├── api.md          # backend spec
│   └── web.md          # frontend spec
└── constraints.md      # global rules
```

see [owl/spec.md](owl/spec.md) for the full language specification.

## philosophy

- **declarative**: describe desired state, not steps
- **natural language**: no formal grammar, llm-parsed
- **composable**: specs link to other specs
- **diffable**: agent compares spec to codebase
- **idempotent**: applying twice = applying once

## why

because "draw two circles, then draw the rest of the owl" is actually a valid workflow now.
