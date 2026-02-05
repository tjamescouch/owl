# coordinator

manages the build process: parses specs, creates tasks, assigns agents, tracks progress.

## state

- parsed owl spec (components, dependencies, constraints)
- task graph with dependency edges
- assignment map: component → agent
- status map: component → (pending|claimed|building|ready|auditing|merged|failed)
- agent heartbeats: agent → last_seen_timestamp

## capabilities

- parse owl spec from directory path
- generate task graph with dependencies from component interfaces
- broadcast available tasks to #build channel
- accept CLAIM messages, confirm with ACK
- track PROGRESS messages, detect timeouts
- route READY to auditor, wait for AUDIT result
- trigger merge on AUDIT PASS
- handle failures: reassign, notify, escalate

## interfaces

exposes (via AgentChat):
- `TASKS <spec-url>` - announces available components
- `ACK <component> <agent>` - confirms assignment
- `TIMEOUT <component>` - announces reclaimed task
- `MERGED <component>` - announces successful merge

depends on:
- owl spec files (read-only)
- git repository (read for PR creation)
- auditor responses

## invariants

- each component assigned to at most one agent at a time
- dependencies must be MERGED before dependent can start
- all state changes logged for debugging
- coordinator never modifies code, only orchestrates
