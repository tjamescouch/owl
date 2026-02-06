# mcp-server

MCP (Model Context Protocol) server for native Claude integration.

## tools

### task_create
Create a new task.

Input:
- title: string (required)
- description: string
- priority: "low" | "medium" | "high"
- tags: string[]
- creator: string (required)
- bounty: number
- currency: string

Output: Task object as JSON

### task_list
List tasks with optional filtering.

Input:
- status: "open" | "claimed" | "completed"
- priority: "low" | "medium" | "high"
- assignee: string
- creator: string

Output: Task array as JSON

### task_show
Get details of a specific task.

Input:
- id: string (required)

Output: Task object as JSON

### task_claim
Claim an open task.

Input:
- id: string (required)
- assignee: string (required)

Output: Task object as JSON

### task_complete
Mark a claimed task as completed.

Input:
- id: string (required)
- proof: string

Output: Task object as JSON

### task_unclaim
Release a claimed task back to open.

Input:
- id: string (required)

Output: Task object as JSON

### task_status
Get summary statistics.

Input: none

Output: Stats object with open, claimed, completed, total, highPriorityPending

## transport

- stdio transport for local CLI usage
- Initialize database on server start
- Clean shutdown on SIGINT
