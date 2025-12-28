# Token Vesting Module

A self-contained module that implements a simple token vesting schedule on
top of an existing SPL token mint.

## Responsibilities

- Create vesting accounts for beneficiaries
- Track cliff, start, and end timestamps
- Release vested tokens on demand
- Allow administrative cancellation where appropriate

## Integration notes

This module expects:

- An existing SPL token mint
- A treasury authority that owns the initial token supply
- A reliable clock source from the Solana runtime
