# forge

A CLI task management system for agent coordination. Enables agents to create, claim, and complete tasks with optional bounties. Integrates with AgentChat for real-time notifications and proposal-based payments.

## components

- [cli](components/cli.md) - Command-line interface with Commander.js
- [database](components/database.md) - SQLite persistence layer
- [mcp-server](components/mcp-server.md) - MCP server for native Claude integration
- [agentchat](components/agentchat.md) - AgentChat client for proposals and broadcasts

## behaviors

- [task-lifecycle](behaviors/task-lifecycle.md) - Create → claim → complete workflow
- [bounty-flow](behaviors/bounty-flow.md) - Bounty creation and payment via proposals

## constraints

see [constraints.md](constraints.md)
