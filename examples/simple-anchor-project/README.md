# Simple Anchor Project

This folder contains a very small Anchor program used as an example input for
Unit09. The goal is not to be feature-complete, but to provide a realistic,
well-structured Solana program that Unit09 can observe and decompose.

The project models a minimal "note" system:

- Users can create notes
- Each note stores an owner, a title, and a small body
- Notes can be updated and closed

## Structure

- `Anchor.toml` — Anchor workspace configuration
- `programs/simple_note/Cargo.toml` — program manifest
- `programs/simple_note/src/lib.rs` — main Anchor program
- `tests/simple_note.ts` — basic integration tests

You can build and test it using:

```bash
anchor build
anchor test
```

This example is intentionally small but covers:

- Account initialization
- PDA derivation
- Basic data validation
- Simple events and errors
