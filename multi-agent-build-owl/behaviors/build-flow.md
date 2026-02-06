# build flow

the full sequence from owl spec to merged, working code.

## flow

1. coordinator reads the owl spec (product.md and all linked files)
2. coordinator extracts the component list and dependency graph from interfaces sections
3. coordinator creates a task for each component with dependency ordering
4. coordinator announces available tasks on the chat channel
5. builder agents send CLAIM messages for components they want to build
6. coordinator responds with ASSIGN (first claim wins) or REJECTED (already claimed)
7. assigned builders provision their environment (git worktree on branch build/<component>)
8. builders with no unmet dependencies begin building immediately
9. builders with unmet dependencies send BLOCKED and wait for dependency READY messages
10. builder implements the component according to its spec and the constraints
11. builder runs self-audit against the component spec
12. if self-audit passes: builder pushes branch and sends READY <component> <branch>
13. if self-audit fails: builder iterates on implementation, retries self-audit
14. coordinator receives READY, dispatches auditor against the component
15. auditor inspects built code against spec, sends AUDIT <component> PASS or FAIL
16. on AUDIT PASS: coordinator marks component as ready, unblocks dependent components
17. on AUDIT FAIL: see [failure](failure.md)
18. when all components have AUDIT PASS: coordinator dispatches integrator
19. integrator merges branches in dependency order into main
20. integrator runs integration checks (cross-component interface verification)
21. integrator sends INTEGRATED or INTEGRATION_FAIL
22. coordinator reports final status

## parallel execution

- components with no dependencies can be built simultaneously by different agents
- audits can run in parallel for independent components
- the only serialization point is integration (step 18-21)
