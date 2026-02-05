# task-lifecycle

The standard workflow for task management.

## states

```
open → claimed → completed
  ↑       │
  └───────┘ (unclaim)
```

## create

1. User runs `task create -t "title" [options]`
2. Generate UUID for task ID
3. Insert into database with status=open
4. If TASK_BROADCAST=true, announce to channel
5. Return task details

## claim

1. User runs `task claim <id> -a "@agent"`
2. Verify task exists and status=open
3. Update status=claimed, assignee=agent
4. If TASK_BROADCAST=true, announce claim
5. Return updated task

## complete

1. User runs `task complete <id> [--proof <url>]`
2. Verify task exists and status=claimed
3. Store proof in metadata if provided
4. Update status=completed, completed_at=now
5. If TASK_BROADCAST=true, announce completion
6. If bounty exists and TASK_PROPOSALS=true, send proposal to creator
7. Return updated task

## unclaim

1. User runs `task unclaim <id>`
2. Verify task exists and status=claimed
3. Update status=open, assignee=null
4. If TASK_BROADCAST=true, announce release
5. Return updated task

## invariants

- Only open tasks can be claimed
- Only claimed tasks can be completed or unclaimed
- completed_at only set when status becomes completed
- assignee only set when status is claimed
