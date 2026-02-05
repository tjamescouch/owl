---
name: owl
description: Build products from natural language specs
version: 0.1.0
---

# owl

Describe what you want in markdown, run /owl apply, and it gets built.

## Commands

### /owl apply

Implement the specs in the current directory.

1. Read product.md to understand what we're building
2. Follow markdown links to gather component and behavior specs
3. Read constraints.md for rules to follow
4. Implement each component one at a time
5. Verify each matches its spec before moving on

Rules:
- Never modify spec files
- Follow constraints strictly
- Be minimal - do not add features not in spec
- Stop and ask if spec is ambiguous

### /owl status

Compare specs to codebase. Report:
- What is specified but missing
- What exists but is not specified
- What contradicts the spec

### /owl plan

Show what would change without implementing.
