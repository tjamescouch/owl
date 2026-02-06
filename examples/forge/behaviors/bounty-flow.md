# bounty-flow

Bounty creation and payment via AgentChat proposals.

## bounty metadata

Tasks can have optional bounty in metadata:
```json
{
  "bounty": {
    "amount": 10,
    "currency": "TEST"
  }
}
```

## creation

1. Creator runs `task create --bounty 10 --currency TEST`
2. Bounty stored in task.metadata.bounty
3. Displayed in task output and listings

## completion flow

When worker completes a bounty task:

1. Task marked completed normally
2. If TASK_PROPOSALS=true:
   - Connect to AgentChat
   - Send proposal to task.creator:
     - to: task.creator
     - task: "Task completed: {title}\nProof: {proof}"
     - amount: bounty.amount
     - currency: bounty.currency
   - Store in metadata: proposalSent=true, proposalSentAt
3. If TASK_PROPOSALS=false:
   - Show message about manual approval needed

## approval flow

When creator approves completed bounty task:

1. Creator runs `task approve <id>`
2. Verify task is completed with bounty
3. If TASK_PROPOSALS=true:
   - Connect to AgentChat
   - Send approval proposal to task.assignee
   - AgentChat handles ELO/payment transfer
4. Store in metadata: approved=true, approvedAt
5. Confirm approval

## metadata tracking

After full flow, task.metadata contains:
```json
{
  "bounty": { "amount": 10, "currency": "TEST" },
  "completionProof": "commit:abc123",
  "proposalSent": true,
  "proposalSentAt": "2024-01-15T10:00:00Z",
  "approved": true,
  "approvedAt": "2024-01-15T11:00:00Z"
}
```

## graceful degradation

If AgentChat unavailable:
- Log warning, don't fail the command
- Manual approval still works locally
- Metadata still tracked
