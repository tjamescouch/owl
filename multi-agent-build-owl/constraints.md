# constraints

## environment

- v0.1 assumes same-machine execution
- Each builder gets a git worktree: `git worktree add <path> -b build/<component>`
- Agents must not access other agents' worktrees
- Shared repo accessed via branches only

## git conventions

- Branch naming: `build/<component-name>`
- Commit messages must reference component: `[<component>] description`
- No force pushes to shared branches
- Integration merges to `main` only after all audits pass

## message format

- All messages sent to designated build channel (e.g., `#build`)
- Messages are plain text, parseable
- Component names must match owl spec exactly
- Timestamps implicit in chat protocol

## timeouts (v0.2)

- v0.1: No automatic timeouts, human intervenes on stalls
- Future: Heartbeat every 5 minutes, reclaim after 15 minutes silent

## failure handling

- Build failure: Agent emits `FAIL`, may retry
- Audit failure: Agent gets feedback, retries once, then escalates
- Integration failure: Escalate to human (may indicate spec issue)
- Double claim: First `CLAIM` wins, second gets `REJECTED`

## trust model

- v0.1: All agents trusted (same operator)
- Auditor provides verification, not security
- Future: Sandboxed execution for untrusted agents
