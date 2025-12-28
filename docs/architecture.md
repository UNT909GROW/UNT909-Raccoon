# Architecture

This document describes the overall architecture of Unit09: how the on-chain
program, engine, services, and developer tools fit together.

At a high level, Unit09 is composed of:

1. An on-chain program on Solana that stores repositories, modules, forks,
   and metrics.
2. An off-chain engine that observes code, analyzes repositories, and
   generates modules.
3. A set of stateless services (API, worker, scheduler) that orchestrate
   the engine and on-chain interactions.
4. Developer-facing tools (CLI, SDK, dashboard, docs site).

## 1. Component overview

### 1.1 On-chain program

The Solana program called `unit09_program` is responsible for:

- Recording which repositories are tracked.
- Storing metadata for generated modules and their versions.
- Representing forks of Unit09 as on-chain entities.
- Recording high-level metrics and observation counters.
- Enforcing authorization rules and invariants.

It does not parse code directly. Instead, it trusts data produced by the
off-chain engine and validated through on-chain rules.

### 1.2 Core engine

The core engine (under `packages/core-engine`) is the brain of Unit09. It
runs a multi-stage pipeline:

1. Observe code from Git or other sources.
2. Detect languages and frameworks.
3. Parse project structure and builds a code graph.
4. Decompose functionality into candidate modules.
5. Generate module artifacts and scaffolds.
6. Validate that modules are self-contained and sane.
7. Synchronize metadata back to the blockchain.

The engine is intentionally modular so that new analyzers or generators can
be added over time.

### 1.3 Services

The engine is wrapped by three stateless services:

- **API service** (`services/api`)  
  Exposes HTTP endpoints for:

  - Managing repositories and modules.
  - Triggering pipeline runs.
  - Querying forks and global stats.
  - Serving data to the dashboard and docs.

- **Worker service** (`services/worker`)  
  Consumes jobs from a queue and executes the engine pipeline. Each job
  typically corresponds to a single repository or fork evolution event.

- **Scheduler service** (`services/scheduler`)  
  Triggers recurring jobs such as periodic repository observation,
  scheduled sync of metrics, and cleanup tasks.

### 1.4 Tooling

- **CLI** (`cli/`) wraps the API and engine in a developer-friendly
  command-line tool.
- **SDK** (`packages/sdk/`) provides a typed client for TypeScript projects.
- **Dashboard app** (`apps/dashboard/`) gives a visual view of repositories,
  modules, forks, and system stats.
- **Docs site** (`apps/docs-site/`) is a hosted version of the documentation.

## 2. Data flow

The main data flow looks like this:

1. A developer or system registers a repository with Unit09.
2. The API writes a `Repo` record on-chain and stores minimal metadata
   off-chain.
3. A pipeline job is created and pushed to the queue.
4. The worker picks up the job and runs the engine stages.
5. The engine produces a set of modules and their relationships.
6. The worker calls the Solana program to record modules, versions, and
   metrics.
7. The dashboard and API read from both on-chain and off-chain sources to
   present a unified view.

## 3. Trust boundaries

- The on-chain program is the source of truth for:

  - Which repositories are tracked.
  - Which modules and forks exist.
  - High-level metrics and important invariants.

- The off-chain engine is the source of truth for:

  - Detailed analysis results.
  - Code-level suggestions and artifacts.
  - Execution of heavy computations and AI tasks.

The engine is treated as an oracle whose outputs are constrained and
validated by on-chain rules wherever possible.

## 4. Scaling considerations

- The API and dashboard are stateless and horizontally scalable.
- Worker capacity is scaled by increasing the number of worker replicas.
- Heavy analysis tasks can be sharded per repository, per language, or per
  project size.
- The Solana program must be designed to avoid hot accounts and to spread
  writes across multiple PDAs.

## 5. Extensibility

There are several extension points:

- Add new analyzers under `packages/core-engine/analyzers`.
- Add new generators under `packages/core-engine/generators`.
- Extend API endpoints under `services/api`.
- Add new instructions or account types in the on-chain program.
- Introduce custom dashboards or reports on top of the existing data model.

When extending the architecture, keep the separation of concerns clear:
on-chain for rules and identity, off-chain for computation and AI.
