# state

tracks what has been built.

## purpose

prevents re-application when spec is already satisfied.
not a canonical implementation record - implementations can vary.
more like package-lock than terraform state.

## state file

`.owl/state.json` in project root:

```json
{
  "spec_hash": "sha256 of concatenated spec files",
  "applied_at": "iso timestamp",
  "owl_version": "0.1.0",
  "components": {
    "server": {
      "status": "satisfied",
      "spec_hash": "hash of component spec",
      "files": ["src/server.ts"],
      "applied_at": "iso timestamp"
    }
  },
  "behaviors": {
    "auth": {
      "status": "satisfied",
      "spec_hash": "hash of behavior spec",
      "applied_at": "iso timestamp"
    }
  }
}
```

## state transitions

- `pending` - spec exists, not yet applied
- `satisfied` - implementation matches spec
- `drifted` - code changed, may not match spec
- `stale` - spec changed since last apply

## capabilities

- compute spec hash from files
- compare current hash to stored hash
- record applied components
- detect which components need re-application

## invariants

- state file is gitignored (agent-local)
- state is advisory, not authoritative
- delete state file to force full re-apply
- spec is always source of truth, not state
