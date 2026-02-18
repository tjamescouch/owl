# api

graphql api for todo operations.

## state

- list of todos in memory
- each todo has: id, title, description, completed, priority, dueDate, tags, createdAt

## capabilities

- create, update, toggle, and delete todos
- filter by status (all, active, completed)
- filter by tag
- sort by created date, due date, priority, or title
- bulk operations: toggle all, clear completed
- export/import as json
- stats: total, active, completed, overdue, completion percent, by priority

## interfaces

exposes:
- `POST /graphql` - graphql endpoint
- `GET /graphql` - graphql playground

## invariants

- ids are unique
- deleted todos are removed, not soft-deleted
- priority defaults to medium
- tags default to empty array
