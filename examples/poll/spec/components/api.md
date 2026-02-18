# api

rest api for poll operations.

## state

- list of polls in memory
- each poll has: id, question, options (array of {text, votes}), createdAt
- poll ids are short random strings (6 chars)

## capabilities

- create poll with question and 2-6 options
- get poll by id
- vote on an option (increments vote count)
- list recent polls (last 10)

## interfaces

exposes:
- `POST /polls` - create poll, returns poll with id
- `GET /polls/:id` - get poll
- `POST /polls/:id/vote` - vote on option (body: {option: index})
- `GET /polls/recent` - list recent polls

## invariants

- ids are unique
- votes only increment, never decrement
- options array is immutable after creation
