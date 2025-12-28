# Basic Mint Module

A minimal module that wraps mint and burn operations for a given SPL token
mint, with simple access checks.

## Responsibilities

- Mint tokens to allowed recipients
- Burn tokens from authorized accounts
- Enforce a configured authority or multi-signature

## Integration notes

The module assumes:

- The mint has been created before the module is used
- Only the configured authority can perform mint and burn operations
