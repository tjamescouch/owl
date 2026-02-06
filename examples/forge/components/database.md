# database

SQLite persistence layer using sql.js.

## schema

### tasks table

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'claimed', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  tags TEXT NOT NULL DEFAULT '[]',
  dependencies TEXT NOT NULL DEFAULT '[]',
  creator TEXT NOT NULL,
  assignee TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  metadata TEXT NOT NULL DEFAULT '{}'
);
```

### indexes

- idx_tasks_status
- idx_tasks_priority
- idx_tasks_assignee
- idx_tasks_creator

## state

- Database path from TASK_DB_PATH or ./tasks.db
- Initialize on first use (lazy)
- Save after each mutation
- WAL mode not needed (sql.js is in-memory)

## operations

- createTask(input) → Task
- getTask(id) → Task | null
- listTasks(filter?) → Task[]
- updateTask(id, input) → Task | null
- claimTask(id, assignee) → Task | null
- completeTask(id) → Task | null
- deleteTask(id) → boolean

## types

Task fields stored as JSON strings: tags, dependencies, metadata.
Dates stored as ISO 8601 strings.
UUIDs for task IDs.
