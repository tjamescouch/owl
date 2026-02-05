# plan

determine what would change.

## flow

1. parser gathers all spec files
2. executor analyzes specs and codebase
3. executor produces implementation plan:
   - list of components/behaviors to build
   - high-level description of each
   - identified ambiguities or questions

## output

numbered task list:

```
1. implement server component
   - create websocket handler
   - add connection management

2. implement auth behavior
   - add identity verification
   - integrate with server

questions:
- spec unclear on X, assuming Y
```

## failure modes

- spec already fully implemented: report "nothing to do"
- ambiguous spec: list questions, don't guess
