# owl

a natural language declarative specification format for software.

describe what you want in markdown. an agent builds it.

## quick start

```
project/
├── product.md        # what you're building
├── components/       # parts of the system
│   ├── api.md
│   └── web.md
└── constraints.md    # rules to follow
```

point an agent at the directory. it reads the spec, compares to reality, builds what's missing.

## example

this repo contains a working example:

- `todo-owl/` - owl spec for a todo app
- `todo/` - implementation built from that spec

## spec format

see [owl/spec.md](owl/spec.md) for the full language specification.

## philosophy

- **declarative**: describe what, not how
- **natural language**: no grammar, llm-parsed
- **composable**: specs link to specs
- **idempotent**: apply twice = apply once

## why "owl"

"draw two circles, then draw the rest of the owl."

you sketch the circles. agent finishes it.
