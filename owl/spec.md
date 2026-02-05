# owl

a natural language declarative specification format for products.

like terraform, but for software. describe what you want, agent figures out how.

## philosophy

- **declarative**: describe desired state, not steps to get there
- **natural language**: no formal grammar, llm-parsed
- **file-structured**: organized in directories, composable
- **diffable**: agent compares spec to reality, identifies drift
- **idempotent**: applying twice = applying once

## file structure

```
project/
├── product.md              # root declaration
├── components/
│   ├── server.md
│   ├── client.md
│   └── protocol.md
├── behaviors/
│   ├── auth.md
│   └── messaging.md
└── constraints.md          # global invariants
```

all files are markdown. all filenames lowercase.

## product.md

the root. declares what this thing is and links to components.

```markdown
# my product

one sentence: what is this.

## components

- [server](components/server.md) - what it does
- [client](components/client.md) - what it does

## behaviors

- [auth](behaviors/auth.md)

## constraints

see [constraints.md](constraints.md)
```

## component spec format

each component describes:

### state

what data does this component own/manage?

```markdown
## state

- maintains a set of connected clients
- each client has an identity
- channels exist when at least one client is subscribed
```

### capabilities

what can it do? written as assertions about behavior.

```markdown
## capabilities

- accepts websocket connections on configurable port
- routes messages between clients in same channel
- authenticates via ed25519 signatures
```

### interfaces

what does it expose? what does it depend on?

```markdown
## interfaces

exposes:
- `ws://host:port` - websocket endpoint
- `POST /health` - health check

depends on:
- nothing external
```

### invariants

what must always be true?

```markdown
## invariants

- a client can only send to channels it has joined
- message delivery is best-effort
- server never initiates unprompted
```

## constraints.md

global rules that apply everywhere. the agent must respect these.

```markdown
# constraints

## security

- never store secrets in code
- all crypto uses libsodium/tweetnacl

## style

- typescript, strict mode
- functional core, imperative shell
- no classes except for errors

## dependencies

- minimal. justify every dependency.
```

## behaviors

cross-cutting concerns that span components. describe the flow.

```markdown
# auth

how agents authenticate to the system.

## flow

1. client connects via websocket
2. server sends challenge nonce
3. client signs nonce with private key
4. server verifies signature against known public key
5. on success, client is marked authenticated

## failure modes

- invalid signature: disconnect with error
- timeout: disconnect after 30s
- unknown public key: allow as ephemeral identity
```

## semantics

### diffing

agent compares spec to codebase:
- what's specified but missing? → needs implementation
- what exists but isn't specified? → maybe drift, maybe detail
- what contradicts the spec? → needs fixing

### applying

```
/owl status    # what exists vs what's specified?
/owl plan      # what would change?
/owl apply     # make it so
/owl drift     # has code diverged from spec?
```

### granularity

specs are intentionally high-level. they capture intent, not implementation.

wrong:
```markdown
- uses express.js with cors middleware on port 3000
```

right:
```markdown
- http server with cors enabled on configurable port
```

the agent decides express vs fastify vs bun. the spec says what, not how.

## escape hatches

sometimes you need to be specific:

```markdown
## implementation notes

> use libsodium for all crypto operations. non-negotiable.

> the websocket library must be `ws`, not alternatives.
```

use sparingly. every constraint reduces agent flexibility.

## relationship to other files

| file | purpose |
|------|---------|
| readme.md | for humans: what is this, how to use it |
| agents.md | for agents: how to work in this codebase |
| product.md | for owl: what this product should be |
| constraints.md | for owl: global invariants |

## bootstrapping

to use owl on a new project:

1. create `product.md` at root
2. describe what you're building in plain english
3. add component specs as needed
4. run `/owl plan` to see what agent would do
5. run `/owl apply` when ready

## why "owl"

"draw the rest of the owl" - you sketch the circles, agent finishes it.
# grammar

the owl specification language, defined in natural language.

## overview

owl specs are markdown files. structure emerges from headings, lists, and
conventions rather than formal syntax. agents parse by understanding, not
by tokenizing.

## file types

### product.md

the root specification. required.

```
# <product name>

<one sentence description>

## components

- [name](components/name.md) - brief description

## behaviors

- [name](behaviors/name.md) - brief description

## constraints

see [constraints.md](constraints.md)
```

### components/*.md

each component describes a part of the system.

```
# <component name>

<what this component is>

## state

what data does it own or manage?
bullet list of state items.

## capabilities

what can it do?
bullet list of abilities, written as assertions.

## interfaces

exposes:
- what it provides to others

depends on:
- what it needs from others

## invariants

what must always be true?
bullet list of guarantees.
```

### behaviors/*.md

cross-cutting concerns that span components.

```
# <behavior name>

<what this behavior is>

## flow

numbered steps describing the sequence.

## failure modes

what can go wrong and how to handle it.
```

### constraints.md

global rules that apply everywhere.

```
# constraints

## <category>

bullet list of rules.
use imperative voice: "do X", "never Y", "prefer Z".
```

## conventions

### voice

- specs use present tense: "the server accepts connections"
- imperatives for constraints: "never store secrets in code"
- avoid passive voice

### granularity

- high level: describe WHAT, not HOW
- wrong: "uses express.js with cors middleware"
- right: "http server with cors enabled"

### ambiguity

- if something is unclear, mark it: `[unclear: what does X mean?]`
- agents will ask rather than guess

### links

- use relative markdown links: `[name](path/to/file.md)`
- links define the spec tree

### escape hatches

when you must be specific:

```
## implementation notes

> use libsodium for crypto. non-negotiable.
```

blockquotes in "implementation notes" sections are hard requirements.

## parsing

agents don't formally parse owl specs. they read and understand them.
the "grammar" is a set of conventions that help agents navigate, not
a formal language definition.

key heuristics:
- h1 (`#`) = file identity
- h2 (`##`) = major sections
- h3 (`###`) = subsections
- bullet lists = items to implement
- numbered lists = sequences/flows
- code blocks = examples or templates
- blockquotes in implementation notes = hard constraints

## extensibility

owl is not a closed language. new conventions can emerge:

- new section types in components (e.g., `## events`)
- new file types (e.g., `integrations/*.md`)
- domain-specific patterns

as long as agents can understand it, it's valid owl.
