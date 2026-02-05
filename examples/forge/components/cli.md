# cli

Command-line interface for task management.

## commands

### task create
Create a new task.

Options:
- `-t, --title <title>` - Task title (required)
- `-d, --description <desc>` - Task description
- `-p, --priority <level>` - Priority: low, medium, high (default: medium)
- `--tags <tags>` - Comma-separated tags
- `--deps <ids>` - Comma-separated dependency task IDs
- `-c, --creator <id>` - Creator ID (default: $USER)
- `--bounty <amount>` - Bounty amount
- `--currency <currency>` - Bounty currency (default: TEST)

### task list
List tasks with optional filtering.

Options:
- `-s, --status <status>` - Filter by status
- `-p, --priority <level>` - Filter by priority
- `-a, --assignee <id>` - Filter by assignee
- `-c, --creator <id>` - Filter by creator
- `--tags <tags>` - Filter by tags

### task show <id>
Display full task details.

### task claim <id>
Claim an open task.

Options:
- `-a, --assignee <id>` - Assignee ID (default: $USER)

### task complete <id>
Mark claimed task as completed.

Options:
- `--proof <proof>` - Proof of completion (URL, commit hash)
- `--no-proposal` - Skip auto-proposal for bounty tasks

### task unclaim <id>
Release a claimed task back to open.

### task approve <id>
Approve a completed bounty task (creator only).

Options:
- `--identity <name>` - AgentChat identity for signing

### task status
Show summary statistics.

## output

- Use chalk for colored output
- Priority indicators: ○ low, ● medium, ◉ high
- Status colors: yellow=open, blue=claimed, green=completed
- Short IDs (8 chars) in listings, full IDs in details
