# Workflow

Unit09 follows a clear workflow from the moment it sees a repository to the
time it produces usable modules and on-chain records.

This document explains each stage and how they connect.

## 1. High-level steps

1. **Register** — a repository is registered with Unit09.
2. **Observe** — the engine fetches and inspects the repository.
3. **Analyze** — language, frameworks, and structure are detected.
4. **Decompose** — functionality is broken down into candidate modules.
5. **Generate** — module artifacts and scaffolds are created.
6. **Validate** — modules are checked for consistency and safety.
7. **Sync** — metadata is written to the blockchain and exposed via the API.

## 2. Register

Registration can be done via:

- The CLI (for example, `unit09 link-repo <url>`).
- The API (`POST /repos`).
- A scheduled discovery job (for predefined code hosts).

Registration writes a `Repo` record on-chain containing an identifier,
provider metadata, and basic configuration flags.

## 3. Observe

The worker triggers the `observeCode` stage of the engine. It:

- Clones or updates the repository.
- Normalizes directory structure and project metadata.
- Extracts high-level signals — size, languages, frameworks, complexity
  hints.

Observation results are recorded in off-chain storage and summarized on
-chain via an `Observation` event and metrics counters.

## 4. Analyze

The engine runs analyzers tailored to the detected languages:

- Rust / Anchor analyzers inspect Solana programs, accounts, and
  instructions.
- TypeScript analyzers inspect front-end clients, scripts, and tools.
- Config analyzers read build files, manifests, and configuration.

The output is a code graph that links:

- Files
- Entry points (for example, instructions)
- Data types and accounts
- Cross-module dependencies

## 5. Decompose

Given the code graph, the engine proposes module boundaries. A module may
represent:

- A single Solana program.
- A feature slice within a program (for example, a vesting feature).
- A reusable client-side library.

The decomposition logic uses:

- Structural signals (files, directories, modules).
- Semantic signals (naming, comments, account groupings).
- Optional AI assistance for inferring boundaries.

## 6. Generate

For each proposed module, the engine can generate:

- Module descriptors (metadata and relationships).
- Scaffolds for splitting code into modules where necessary.
- Documentation stubs.
- Client bindings and examples.

Generation is conservative by default. It can be configured to generate
only metadata or to produce code artifacts in a separate branch.

## 7. Validate

Before anything is synced on-chain, the engine validates that each module
is:

- Self-contained enough to be meaningful.
- Free of obvious contradictions (for example, dangling dependencies).
- Typed correctly according to the language analyzers.

Validation produces warnings and errors that are surfaced in logs and via
API endpoints.

## 8. Sync

Finally, the worker calls the Solana program to:

- Register modules and versions.
- Update repository status.
- Record metrics such as lines of code observed and module counts.

The API and dashboard then read these records and present them to users.

## 9. Fork evolution

When users create forks of Unit09, an additional workflow is used:

1. A fork is created on-chain via `create_fork`.
2. The engine is configured with fork-specific rules or prompts.
3. Fork-specific observation and decomposition runs are executed.
4. The resulting behavior is tracked as part of the fork lifecycle.

Forks allow different communities to experiment with alternative evolution
paths while sharing the underlying infrastructure.
