# multi-agent-build

Coordinate parallel builds from owl specs via AgentChat.

## trigger

- User says "coordinate build" or "start coordinator"
- User says "/mab" or "/multi-agent-build"

## behavior

When triggered, act as the multi-agent build coordinator:

### 1. Initialize

Ask for the owl spec directory if not provided. Then:

```
1. Read the owl spec (product.md, components/*.md, constraints.md)
2. Extract component names and dependencies from interfaces sections
3. Create git worktrees for each component:
   git worktree add .build-worktrees/<component> -b build/<component>
4. Track state:
   components = Map<name, {status, assignee, branch, dependencies, blockedBy}>
```

### 2. Announce

Connect to AgentChat and announce:

```
BUILD STARTING - spec: <spec-name>
Available components: <list>
Dependencies: <component> depends on <deps>
Send CLAIM <component> to start building.
```

### 3. Listen and Handle Protocol

Listen on #general (or specified channel) and handle these messages:

**CLAIM <component>**
- If available: set status=claimed, assignee=sender
- Send: `ASSIGN <component> <worktree-path> <spec-file>`
- If not available: send `REJECTED <component> - already claimed by <assignee>`

**READY <component> <branch>**
- Set status=ready, branch=<branch>
- Run auditor if available: `node auditor/auditor.js <spec> <worktree>`
- Send: `AUDIT <component> PASS` or `AUDIT <component> FAIL <findings>`
- Unblock dependent components, send `UNBLOCKED <dep>` for each

**BLOCKED <component> <dependency>**
- Track the blocker
- Will auto-unblock when dependency becomes READY

**FAIL <component> <reason>**
- Log the failure
- Send: `ACK <component> FAIL - logged for review`

### 4. Integration

When all components have status=audited:

```
1. Send: INTEGRATING - merging in order: <dep-order>
2. For each component in dependency order:
   git checkout main
   git merge build/<component>
3. Send: INTEGRATED or INTEGRATION_FAIL <reason>
4. Clean up worktrees
```

### 5. State Display

Periodically or on request, show:

```
--- Build Status ---
api: ready (@agent-123) [branch: build/api]
web: building (@agent-456) [blocked by: -]
--------------------
```

## example session

```
User: coordinate build for todo-owl

Agent: Parsing todo-owl spec...
Found 2 components:
- api (no deps)
- web (depends on api)

Creating worktrees...
Connecting to #general...

BUILD STARTING - spec: todo-owl
Available: api, web
web depends on: api
Send CLAIM <component> to start.

[listening for claims...]

@builder-1: CLAIM api
Agent: ASSIGN api .build-worktrees/api todo-owl/components/api.md

@builder-1: READY api build/api
Agent: Running auditor...
Agent: AUDIT api PASS
Agent: UNBLOCKED web

@builder-2: CLAIM web
Agent: ASSIGN web .build-worktrees/web todo-owl/components/web.md

@builder-2: READY web build/web
Agent: AUDIT web PASS

All components audited. Integrating...
INTEGRATED - build complete!
```

## constraints

- Use agentchat MCP tools (agentchat_connect, agentchat_send, agentchat_listen)
- Keep state in memory (no persistence in v0.1)
- First CLAIM wins for each component
- Run auditor if auditor/auditor.js exists
- Clean up worktrees on completion or SIGINT
