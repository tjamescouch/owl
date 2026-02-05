# status

compare spec to reality.

## flow

1. parser gathers all spec files
2. executor reads specs and codebase
3. executor reports:
   - what's specified but missing
   - what exists but isn't specified
   - what contradicts the spec

## output

bullet-pointed list grouped by category:

```
missing:
- component X not implemented
- behavior Y has no code

unspecified:
- file Z exists but not in spec

contradictions:
- spec says A, code does B
```

## failure modes

- no product.md: exit with error, suggest `owl init`
- empty spec: report "nothing specified"
