# executor

runs specs against codebases using an llm.

## state

- gathered spec content (from parser)
- target directory
- executor type (claude, agentchat, human)

## capabilities

- builds prompts from spec files
- invokes llm with appropriate context
- streams output to terminal
- handles different execution modes

## interfaces

exposes:
- `execute(behavior, specs, dir, options)` - run a behavior

executors:
- `claude` - single agent, uses claude cli directly
- `agentchat` - multi-agent, coordinates via agentchat
- `human` - prints task list for manual execution

depends on:
- claude cli (for claude executor)
- agentchat cli (for agentchat executor)

## invariants

- executor is stateless between invocations
- all output goes to stdout/stderr
- respects --yes flag for non-interactive mode
