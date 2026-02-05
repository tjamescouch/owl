# apply

build what's missing.

## flow

1. parser gathers all spec files
2. executor reads specs and codebase
3. executor implements missing components/behaviors:
   - one at a time
   - respecting constraints.md
   - verifying each matches spec before continuing

## execution modes

### claude (default)

single agent implements everything sequentially.
prompts for approval unless --yes flag.

### agentchat

distributes work across multiple agents.
each agent claims a component.
coordinates via agentchat channel.

### human

prints task list for manual execution.
no code changes made.

## output

progress updates as implementation proceeds:

```
implementing: server component
  ✓ created src/server.ts
  ✓ added connection handling

implementing: auth behavior
  ✓ added identity verification

done. 2 components implemented.
```

## failure modes

- ambiguous spec: stop and ask for clarification
- implementation error: report and pause
- constraint violation: refuse and explain
