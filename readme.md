# owl

draw the rest of the owl.

a natural language declarative specification format for products. like terraform, but you describe what you want in plain english and an agent builds it.

## install

```bash
# clone and add to path
git clone https://github.com/tjamescouch/owl.git
export PATH="$PATH:$(pwd)/owl"

# requires claude code cli
# https://docs.anthropic.com/en/docs/claude-code
```

## quick start

```bash
# initialize a new project
owl init

# edit product.md to describe what you want

# see what would be built
owl plan

# build it
owl apply
```

## commands

```
owl init      create product.md template
owl status    compare spec to codebase
owl plan      show what would change
owl apply     build what's missing
owl drift     check if code diverged from spec
```

## options

```
-d, --dir <path>    project directory (default: current)
-s, --spec <file>   spec file (default: product.md)
-y, --yes           auto-approve apply (danger)
```

## example spec

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

owl reads the spec, diffs against reality, builds what's missing.

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
