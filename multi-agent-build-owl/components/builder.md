# builder

builds one component to spec in an isolated environment. there is one builder per component.

## state

- the assigned component name and its owl spec file
- the constraints file
- a git worktree checked out to a dedicated branch
- build status: idle, building, self-auditing, ready, failed

## capabilities

- receive an ASSIGN message and set up the build environment
- read the component spec and constraints
- implement the component: create files, install dependencies, write code
- run the component's tests if any are defined or implied by the spec
- self-audit against the spec before reporting READY
- incorporate auditor feedback and retry on failure

## interfaces

exposes:
- CLAIM <component> - requests a component assignment from coordinator
- READY <component> <branch> - build complete, self-audited, branch pushed
- FAIL <component> <reason> - build or self-audit failed
- BLOCKED <component> <dependency> - waiting on another component

depends on:
- ASSIGN message from coordinator
- the component's owl spec file
- constraints.md from the owl spec
- git worktree provisioned by coordinator or self-provisioned
- dependency components in READY status (branch available to pull interfaces from)

## invariants

- only modifies files within the assigned component's directory
- never modifies the owl spec files
- does not report READY unless code builds and self-audit passes
- works only on the assigned branch, never main
