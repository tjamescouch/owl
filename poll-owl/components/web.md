# web

react frontend for polls.

## state

- current poll being viewed (if any)
- create form state (question, options)
- voted polls stored in localStorage (prevent double voting)

## capabilities

- home page: create new poll form + list of recent polls
- poll page (/poll/:id): view question, vote, see results
- show vote percentages as horizontal bars
- disable voting if already voted (check localStorage)
- shareable url for each poll

## interfaces

depends on:
- api component for all data operations

## invariants

- cannot vote twice on same poll (localStorage check)
- results update after voting
- empty options are filtered out in create form
