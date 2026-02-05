# constraints

## language

- bash for cli wrapper
- keep it simple - owl is a thin layer over claude
- no dependencies beyond standard unix tools + claude cli

## style

- lowercase filenames
- terse output, no emoji unless user requests
- fail fast with clear error messages

## philosophy

- specs are natural language, not formal grammar
- the spec says WHAT, the executor decides HOW
- minimal magic - user can read the script and understand it
- implementation is fluid, spec is source of truth
- idempotent means "don't re-apply if satisfied", not "same output every time"
- state file is advisory, not authoritative - delete to force re-apply

## extensibility

- executors are swappable scripts
- new behaviors = new prompt templates
- no plugin api - just files

## dogfooding

- owl specs owl
- any change to owl should be reflected in the spec first
- `owl drift` should pass after any commit
