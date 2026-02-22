# Compliance Auditor

Automated tool to check code and processes against financial regulations.

## State

- Repository of regulatory specs (KYC, AML, GDPR)
- Audit reports and findings
- Compliance score

## Capabilities

- Parse OWL specs for compliance requirements
- Scan codebase for violations (e.g., unencrypted data)
- Generate remediation plans
- Schedule recurring audits

## Interfaces

Exposes:
- CLI command: `owl-audit <spec-dir> <code-dir>`
- API endpoint: POST /audit with spec and code payloads
- Report viewer: Web dashboard for findings

Depends on:
- Code parser (e.g., ESLint plugins for security)
- Regulatory database (mock or integrated)

## Invariants

- Audits are reproducible: Same input = same output
- No false positives > 5%
- Reports include evidence citations