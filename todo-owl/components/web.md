# web

react frontend for todo app.

## state

- current filter (all, active, completed)
- current sort order
- current tag filter
- search query
- dark mode preference (persisted to localStorage)

## capabilities

- create todo with title, description, priority, due date, tags
- toggle todo completion
- edit todo inline
- delete todo with undo toast
- expand/collapse description
- filter and sort todos
- search by title
- toggle all complete/incomplete
- clear all completed
- export todos to json file
- import todos from json file
- toggle dark mode
- keyboard shortcuts: ctrl+k (focus input), ctrl+1/2/3 (switch filters), escape (clear)

## interfaces

depends on:
- api component for all data operations

## invariants

- ui reflects server state after mutations
- dark mode preference survives refresh
- overdue items are visually distinct
- priority levels have distinct colors
