# Multi-Agent Build Coordinator

Orchestrates parallel builds from owl specs via AgentChat.

## Usage

```bash
cd multi-agent-build-owl/coordinator
npm install
node index.js <owl-spec-dir> [--channel #build] [--repo-dir .]
```

### Example

```bash
# From owl repo root
node multi-agent-build-owl/coordinator/index.js todo-owl

# Output:
# Parsing owl spec: todo-owl
#   Component: api (deps: none)
#   Component: web (deps: api)
# Creating worktrees...
# Connected to AgentChat #build
# Available components: api, web
```

## Protocol

The coordinator listens for these messages:

| Message | Description |
|---------|-------------|
| `CLAIM <component>` | Builder requests to work on component |
| `READY <component> <branch>` | Builder completed work |
| `BLOCKED <component> <dep>` | Builder waiting on dependency |
| `FAIL <component> <reason>` | Build failed |

And responds with:

| Message | Description |
|---------|-------------|
| `ASSIGN <component> <worktree> <spec>` | Task assigned |
| `REJECTED <component>` | Already claimed or unknown |
| `UNBLOCKED <component>` | Dependency now ready |
| `AUDIT <component> PASS/FAIL` | Audit result |
| `INTEGRATED` | All components merged |

## How It Works

1. Parses owl spec to find components and dependencies
2. Creates a git worktree per component
3. Connects to AgentChat and announces available work
4. Assigns components to builders on CLAIM
5. Tracks progress and dependency resolution
6. Runs auditor on READY components
7. Triggers integration when all audited

## Environment

- `AGENTCHAT_URL` - WebSocket URL (default: wss://agentchat-server.fly.dev)

## Builder Agent Workflow

When acting as a builder, an agent should:

```
1. Connect to the build channel
2. Send: CLAIM <component>
3. Receive: ASSIGN <component> <worktree> <spec>
4. cd to worktree, read spec
5. Build the component
6. Send: READY <component> <branch>
7. Wait for AUDIT result
```
