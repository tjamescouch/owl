# changelog

## 0.1.0

initial release.

- product.md, components/, behaviors/, constraints.md structure
- owl init, status, plan, apply, drift commands
- state tracking via .owl/state.json
- python implementation

### notes

attempted to preserve bash implementation alongside python to demonstrate
language-agnostic specs. failed due to file management issues during session.
the concept is valid - owl specs don't specify implementation language, so
different agents could produce bash, python, rust, etc. from the same spec.
leaving this as future work.
