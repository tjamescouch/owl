# Fraud Detection System

Multi-agent system for real-time fraud monitoring.

## State

- Transaction streams
- Anomaly models
- Alert queue

## Capabilities

- Analyze transaction patterns for anomalies
- Score risk levels (low/medium/high)
- Block suspicious transactions
- Learn from confirmed fraud cases

## Interfaces

Exposes:
- Webhook: POST /transaction - Analyze incoming tx
- Dashboard: GET /alerts - View active alerts
- API: POST /feedback - Update model with outcomes

Depends on:
- Transaction API
- ML inference engine

## Invariants

- False positive rate < 1%
- All decisions auditable
- Models retrained weekly
- Privacy: No user data retained beyond 24h