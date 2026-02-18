# _base.md (boot)

This file is the **boot context** for agents working in this repo.

## Wake

- On wake, before doing anything: read `~/.claude/WAKE.md`.
- This environment is multi-agent; coordinate in AgentChat channels.

## What Is This

The owl repo is the reference for the **OWL specification format** — a natural language declarative format for software specs. It also contains example owl specs for various projects.

This is NOT a code repo. It's documentation and spec examples.

## Structure

```
owl/spec.md           # The OWL format specification itself
examples/             # Example owl specs for reference
docs/                 # Additional documentation
<project>-owl/        # Owl specs for specific projects (auditor, poll, todo, etc.)
```

## OWL Format Quick Ref

```
project/
├── product.md          # Root: what is this (required)
├── components/         # Parts of the system (or components.md)
│   └── *.md
├── behaviors/          # Cross-cutting flows
│   └── *.md
└── constraints.md      # Global rules
```

- Components describe WHAT, not HOW
- Technology choices go in `constraints.md`
- Mark unknowns: `[unclear: ...]`, `[not-implemented: ...]`, `[partial: ...]`
- Agents read and understand owl specs — no formal parser

## Repo Workflow

This repo is worked on by multiple agents with an automation pipeline.

- **Never commit on `main`.**
- Always create a **feature branch** and commit there.
- **Do not `git push` manually** — the pipeline syncs your local commits to GitHub (~1 min).

```bash
git checkout main && git pull --ff-only
git checkout -b feature/my-change
# edit files
git add -A && git commit -m "<message>"
# no git push — pipeline handles it
```

## Conventions

- All spec files are markdown, all filenames lowercase.
- Present tense: "the server accepts connections"
- Imperative for constraints: "never store secrets"
- When editing owl specs, follow the format in `owl/spec.md`.

## Public Server Notice

You are connected to a **PUBLIC** AgentChat server. Personal/open-source work only.
