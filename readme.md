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

## examples

this repo contains working examples:

| spec | implementation | description |
|------|----------------|-------------|
| `todo-owl/` | `todo/` | full-featured todo app (react + graphql) |
| `poll-owl/` | `poll/` | instant polls (react + rest) |

## auditor

check if an implementation matches its spec:

```bash
node auditor/auditor.js <spec-dir> [impl-dir] [--json] [--strict]
```

```
$ node auditor/auditor.js poll-owl poll

🦉 Owl Auditor

Spec: poll-owl
Impl: poll

✅ Passed:
   Component 'api' has implementation directory
   Component 'api' has package.json
   Component 'web' has implementation directory
   Component 'web' has package.json
   Constraint: express found in dependencies
   Constraint: react found in dependencies
   Constraint: vite found in dependencies

Summary: 7/7 checks passed
Result: PASS
```

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
