# store

persists tasks to json file.

## state

- tasks: list of task objects
- file path: ~/.tick/tasks.json

## capabilities

- load(): read tasks from file, return list
- save(tasks): write tasks to file
- add(text): create task, append to list, save
- done(id): mark task done, save
- remove(id): delete task, save

## invariants

- creates ~/.tick/ if missing
- creates tasks.json if missing (empty list)
- never corrupts file on crash (write to temp, rename)
- all writes are atomic
