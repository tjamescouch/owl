# drift

detect divergence between spec and code.

## flow

1. parser gathers all spec files
2. executor compares code to spec
3. executor reports only:
   - behavioral drift (code contradicts spec)
   - scope creep (code goes beyond spec)
   - partial implementations

## output

drift report:

```
drift detected:

behavioral:
- server spec says stateless, but code stores sessions

scope creep:
- auth has rate limiting not in spec

partial:
- messaging behavior 60% implemented
  - missing: delivery confirmation
```

## failure modes

- no drift: report "code matches spec"
- massive drift: suggest re-running `owl plan`
