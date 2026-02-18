# owl specification

a natural language declarative format for software specs.

## file structure

```
project/
├── product.md          # root: what is this
├── components/
│   └── *.md            # parts of the system
├── behaviors/
│   └── *.md            # cross-cutting flows
└── constraints.md      # global rules
```

all files are markdown. all filenames lowercase.

## product.md

the root specification. required.

```markdown
# product name

one sentence description.

## components

- [api](components/api.md) - what it does
- [web](components/web.md) - what it does

## behaviors

- [auth](behaviors/auth.md) - optional cross-cutting concerns

## constraints

see [constraints.md](constraints.md)
```

## components/*.md

each component describes a part of the system.

```markdown
# component name

what this component is.

## state

what data does it own or manage?

## capabilities

what can it do? bullet list of abilities.

## interfaces

exposes:
- what it provides to others

depends on:
- what it needs from others

## invariants

what must always be true?
```

## behaviors/*.md

cross-cutting concerns that span components.

```markdown
# behavior name

what this behavior is.

## flow

numbered steps describing the sequence.

## failure modes

what can go wrong and how to handle it.
```

## constraints.md

global rules that apply everywhere.

```markdown
# constraints

## security

- never store secrets in code

## style

- typescript, strict mode

## dependencies

- minimal. justify every dependency.
```

## conventions

### granularity

components describe WHAT the system does, not HOW.

wrong (in a component): `uses express.js with cors middleware on port 3000`

right (in a component): `http server with cors enabled`

the agent decides implementation details.

specific technology choices belong in `constraints.md`, not components:

```markdown
# constraints

## stack

- backend: node, express
- frontend: react, vite

## ports

- api on 3000
```

### escape hatches

when you must be specific, use blockquotes in an "implementation notes" section:

```markdown
## implementation notes

> use libsodium for crypto. non-negotiable.
```

use sparingly.

### voice

- present tense: "the server accepts connections"
- imperative for constraints: "never store secrets"

### ambiguity

if something is unclear, mark it: `[unclear: what does X mean?]`

agents ask rather than guess.

### implementation status

specs should reflect reality. use bracket tags to mark gaps:

- `[not-implemented: reason]` — spec'd but not yet built
- `[partial: details]` — partially built, details explain what's missing
- `[deprecated: reason]` — being removed, reason explains what replaces it

these tags are greppable and consistent with `[unclear: ...]`. agents encountering these tags should note the gap rather than assuming the feature exists. do not silently implement `[not-implemented]` features without explicit instruction — the tag marks an acknowledged gap, not an implicit todo.

## parsing

agents don't formally parse owl specs. they read and understand them.

heuristics:
- `#` = file identity
- `##` = major sections
- bullet lists = items to implement
- numbered lists = sequences/flows
- blockquotes in implementation notes = hard constraints
