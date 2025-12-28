# Access Control Module

A set of helpers for role-based access control that can be reused by other
modules in the ecosystem.

## Responsibilities

- Store and update role assignments (admin, operator, user)
- Provide reusable guard functions for instruction handlers
- Expose a minimal on-chain footprint while keeping logic clear

## Integration notes

Modules that depend on this one can:

- Require a specific role for sensitive operations
- Combine roles with additional checks (for example, ownership)
