# Constraints

## Security

- All data in transit: TLS 1.3
- Secrets: Never hardcode; use environment variables or vault
- Authentication: JWT with RS256, short expiry
- No plain text passwords or API keys

## Compliance

- KYC/AML: Integrate with verifiable credential standards
- GDPR: Data minimization, right to erasure
- Audit logs: Immutable, tamper-proof for all actions

## Stack

- Backend: Node.js, Express, with helmet for security headers
- Frontend: React, with secure headers and input sanitization
- Database: PostgreSQL with row-level security
- ML: TensorFlow.js or scikit-learn, no external data without consent

## Performance

- API response < 200ms
- Scalable to 1000 RPS

## Testing

- 100% unit test coverage for security-critical paths
- E2E tests for user flows