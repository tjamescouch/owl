# owl

**A natural language declarative specification format for software.**

Describe what you want in markdown. An AI agent reads it, compares to your codebase, and builds what's missing.

## Quick Start

Start by writing a spec in markdown:

```markdown
# project name

one sentence description.

## components

- [api](components/api.md) - what it does
- [web](components/web.md) - what it does

## constraints

see [constraints.md](constraints.md)
```

Structure:

```
project/
├── product.md        # what you're building
├── components/       # parts of the system
│   ├── api.md
│   └── web.md
├── behaviors/        # optional: cross-cutting flows
└── constraints.md    # rules to follow
```

Point an agent at the directory. It reads the spec, compares to reality, builds what's missing.

## The Spec Format

See [SPEC.md](SPEC.md) for the complete language specification.

**Philosophy:**
- **Declarative** — describe WHAT, not HOW
- **Natural language** — no grammar, LLM-parsed
- **Composable** — specs link to specs
- **Idempotent** — apply twice = apply once

## Examples

This repo contains working examples. Each example has:

- `spec/` — the owl specification (markdown)
- `impl/` — the actual implementation (code)

| Example | Description |
|---------|-------------|
| [examples/todo](examples/todo) | Full-featured todo app (React + GraphQL) |
| [examples/poll](examples/poll) | Instant polls (React + REST) |
| [examples/auditor](examples/auditor) | Spec compliance checker (Node CLI) |
| [examples/multi-agent-build](examples/multi-agent-build) | Multi-agent orchestration system |

## Tools

### Auditor

Check if an implementation matches its spec:

```bash
node examples/auditor/impl/auditor.js <spec-dir> [impl-dir] [--json] [--strict]
```

Example:

```bash
$ node auditor/auditor.js examples/poll/spec examples/poll/impl

🦉 Owl Auditor

Spec: examples/poll/spec
Impl: examples/poll/impl

✅ Passed:
   Component 'api' has implementation directory
   Component 'web' has implementation directory
   Constraint: express found in dependencies
   Constraint: react found in dependencies

Summary: 4/4 checks passed
Result: PASS
```

## Why "owl"

"Draw two circles, then draw the rest of the owl."

You sketch the circles. The agent finishes it.
