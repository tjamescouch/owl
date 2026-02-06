# constraints

## technology

- TypeScript for all source code
- Pure JavaScript SQLite via sql.js (no native compilation)
- Commander.js for CLI parsing
- chalk for terminal output styling

## dependencies

- Prefer existing dependencies over new ones
- No native Node.js addons (must work without compilation)
- MCP SDK for Model Context Protocol integration

## architecture

- Single SQLite database file (tasks.db)
- Stateless CLI commands (all state in database)
- Environment variables for configuration (TASK_BROADCAST, TASK_PROPOSALS)
- Graceful degradation when AgentChat unavailable

## style

- Async/await over callbacks
- Functional approach for pure operations
- Classes only for stateful services (AgentChatClient)
- Exit codes: 0 success, 1 error
