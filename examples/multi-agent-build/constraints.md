# constraints

## communication

- all coordination happens via AgentChat
- channel: #build (or project-specific channel)
- messages use standardized format (see message protocol below)

## message protocol

```
TASKS <spec-url>            - coordinator broadcasts available components
CLAIM <component>           - agent announces intent to build
ACK <component> <agent>     - coordinator confirms assignment
REJECT <component> <reason> - coordinator denies claim
PROGRESS <component> <pct>  - periodic status update
BLOCKED <component> <dep>   - waiting on dependency
READY <component> <pr-url>  - implementation complete, PR created
AUDIT <component> PASS|FAIL [details] - auditor verdict
MERGED <component>          - PR merged, dependents unblocked
TIMEOUT <component>         - agent missed checkin, task reclaimed
RETRY <component>           - reassigned after failure
ABORT <component> <reason>  - agent voluntarily releases task
```

## timing

- agents must send PROGRESS every 10 minutes while building
- 3 missed checkins = TIMEOUT, task reclaimed
- audit must complete within 5 minutes of READY

## git conventions

- branch naming: `build/<component-name>`
- one component per branch
- squash commits on merge
- PR title: `[multi-agent-build] <component-name>`

## isolation

- each agent works in separate git worktree
- agents must not modify files outside their component boundary
- shared code changes require coordinator approval

## claim protocol

**CRITICAL: agents MUST wait for ACK before starting work**

1. agent sends CLAIM <component>
2. coordinator validates (not already claimed, deps met)
3. coordinator sends ACK <component> <agent> or REJECT <component> <reason>
4. only after ACK does agent begin implementation

claims without ACK within 2 minutes are considered expired.

## conflict resolution

- first CLAIM wins (timestamp-based)
- if two CLAIMs within 1 second, coordinator assigns randomly
- disputed assignments escalate to human

## failure handling

- audit FAIL: same agent gets 2 retry attempts
- after 3 failures: task reassigned to different agent
- catastrophic failure (env broken): agent sends ABORT, task reclaimed

## message ordering

**all state-changing messages MUST be broadcast to channel, not DM**

this prevents race conditions where agents miss critical updates.

broadcast requirements:
- ACK/REJECT: all agents see who claimed what
- READY: all agents know component is awaiting audit
- MERGED: all agents know dependency is satisfied
- TIMEOUT/RETRY: all agents know component is available again

agent requirements:
- track last-seen message timestamp
- on reconnect, request missed messages from coordinator
- if state conflict detected, coordinator's state is authoritative

## security

**never commit secrets to git**

.gitignore MUST include:
- `.env*` - environment files with API keys
- `.agentchat/` - agent identity files
- `*.key`, `*.pem` - private keys
- `credentials*` - credential files
- `node_modules/` - dependencies
