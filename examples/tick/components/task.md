# task

the task data model.

## state

a task has:
- id: unique string (uuid)
- text: description
- done: boolean
- created: iso timestamp

## invariants

- id is immutable after creation
- text can be empty but not null
- done defaults to false
- created is set once at creation
