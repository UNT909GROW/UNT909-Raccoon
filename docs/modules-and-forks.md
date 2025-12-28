# Modules and Forks

Modules and forks are at the heart of how Unit09 helps developers build
and evolve Solana projects.

This document explains what they are, how they behave, and how you can use
them effectively.

## 1. Modules

A module is a reusable building block that represents a coherent unit of
functionality. It may be:

- A single Solana program.
- A self-contained feature within a program.
- A client-side or off-chain helper library.

### 1.1 Module lifecycle

1. **Proposed** — the engine identifies a potential module.
2. **Generated** — artifacts and metadata are created.
3. **Registered** — the module is recorded on-chain.
4. **Evolving** — new versions are created over time.
5. **Deprecated** — the module is no longer recommended but remains
   queryable.

### 1.2 Module metadata

Module metadata typically includes:

- Name and description.
- Parent repository reference.
- Language and kind.
- Versioning information.
- Status (`draft`, `ready`, `deprecated`).

This metadata is stored both on-chain and off-chain so that tools can
discover modules and their versions.

### 1.3 Using modules

You can use modules in several ways:

- As examples — browse the gallery and learn from the structure.
- As templates — clone a module and adapt it to your project.
- As building blocks — compose multiple modules in a larger system.

The SDK and CLI provide helpers for discovering modules and pulling their
artifacts into your own repositories.

## 2. Forks

A fork is a variant of Unit09 itself — a new personality or behavior
profile for the AI raccoon.

Forks allow communities to explore alternative evolution paths without
forking the entire codebase manually.

### 2.1 Fork metadata

Forks are represented on-chain with fields like:

- Owner — who created and controls the fork.
- Label — human-readable name.
- Config hash — a hash of configuration parameters, prompts, or policies.
- Status — active, paused, deprecated.

### 2.2 Fork evolution

When a fork runs the pipeline on a repository, it can apply its own:

- Heuristics for module boundaries.
- AI prompts for naming and documentation.
- Policies for what counts as a valid module.

Over time, forks can diverge significantly, giving rise to distinct
module ecosystems.

### 2.3 Fork governance

Fork governance is outside the scope of the core protocol but can be
implemented in higher layers, for example:

- Token-based governance for shared forks.
- Multisig or DAO-controlled admin keys.
- Reputation systems based on module adoption.

## 3. Relationship between modules and forks

- Modules are tied to repositories and versions.
- Forks are tied to behaviors and policies.

A single repository can be decomposed into different module sets under
different forks. This is a feature, not a bug — it allows experimentation
without forcing a single canonical view.

## 4. Practical usage patterns

- **Personal fork**  
  Create a fork that reflects your preferred coding style and module
  structure, then reuse it across projects.

- **Team fork**  
  Maintain a fork for your team or organization that encodes internal
  standards and best practices.

- **Public fork**  
  Run a public fork with open governance and encourage external
  contributions, sharing the resulting modules as public goods.

Modules and forks together turn Unit09 from a single tool into a living
ecosystem of evolving building blocks.
