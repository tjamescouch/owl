# owl

draw the rest of the owl.

a natural language declarative specification format for products. like terraform, but you describe what you want in plain english and an agent builds it.

## quick start

```markdown
# product.md

a todo app with user accounts.

## components

- [api](components/api.md) - rest api for todos
- [web](components/web.md) - react frontend
- [db](components/db.md) - postgres storage

## constraints

see [constraints.md](constraints.md)
```

then:

```
/owl apply
```

agent reads the spec, diffs against reality, builds what's missing.

## docs

- [spec](spec.md) - the format specification
- [examples](examples/) - real-world usage

## philosophy

- **declarative**: describe desired state, not steps
- **natural language**: no formal grammar, llm-parsed
- **composable**: specs link to other specs
- **diffable**: agent compares spec to codebase
- **idempotent**: applying twice = applying once

## why

because "draw two circles, then draw the rest of the owl" is actually a valid workflow now.
