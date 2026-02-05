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
