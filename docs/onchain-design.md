# On-chain Design

This document describes the design of the Unit09 Solana program: accounts,
instructions, events, and how they work together.

The program acts as the canonical ledger of:

- Tracked repositories
- Generated modules
- Module versions
- Forks
- High-level metrics

## 1. Accounts

### 1.1 Config

The `Config` account stores global configuration for the protocol:

- `admin` — authority allowed to update configuration.
- `fee_bps` — optional protocol fee in basis points.
- `max_repos` — maximum number of repositories that can be tracked.
- `max_modules_per_repo` — safety limit per repository.
- `evolution_policy` — flags controlling fork behavior.

It is typically a PDA derived from a fixed seed, for example:

```text
PDA("config")
```

### 1.2 Repo

The `Repo` account represents a tracked repository. Fields include:

- `authority` — entity that registered the repo.
- `key` — short identifier for referencing the repo.
- `provider` — code host (for example, GitHub).
- `url` — canonical URL to the repository.
- `status` — active, paused, or archived.
- `created_at` / `updated_at` — timestamps.

The PDA may be derived from `("repo", key)` or a similar pattern.

### 1.3 Module

The `Module` account describes a generated module. Fields typically include:

- `repo` — reference to the parent repository.
- `name` — module name.
- `language` — primary language (rust, typescript, etc.).
- `current_version` — current version number.
- `status` — draft, ready, deprecated.
- `kind` — classification (on-chain, off-chain, hybrid).

### 1.4 ModuleVersion

`ModuleVersion` stores immutable metadata for a specific module version:

- `module` — parent module.
- `version` — version number (for example, 1, 2, 3).
- `summary` — short description of the version.
- `artifact_hash` — hash of artifacts produced by the engine.
- `created_at` — creation timestamp.

### 1.5 Fork

The `Fork` account models a fork of Unit09 itself:

- `owner` — creator of the fork.
- `label` — human-readable name.
- `config_hash` — hash of fork-specific configuration or prompts.
- `status` — active, paused, deprecated.
- `last_evolved_at` — last evolution event timestamp.

### 1.6 Metrics

The `Metrics` account aggregates counters:

- `total_repos`
- `total_modules`
- `total_forks`
- `total_lines_observed`
- Other protocol-level stats

### 1.7 Lifecycle

A `Lifecycle` account can be used for tracking state transitions for repos,
modules, or forks. For example, you might track:

- First observation time
- Last successful pipeline run
- Last error status

## 2. Instructions

The program exposes instructions grouped loosely into categories.

### 2.1 Initialization and config

- `initialize` — create the `Config` account with default values.
- `set_config` — update configuration fields, restricted to the admin.

### 2.2 Repository management

- `register_repo` — create a new `Repo` account.
- `update_repo` — update metadata or status of a repo.

### 2.3 Module management

- `register_module` — create a `Module` account or attach it to a repo.
- `update_module` — adjust metadata or status.
- `link_module_to_repo` — explicitly link a module to a repository or
  update that relationship.

### 2.4 Fork management

- `create_fork` — create a new `Fork` account.
- `update_fork_state` — modify fork metadata or status.

### 2.5 Metrics and observation

- `record_observation` — increment observation counters for a repo.
- `record_metrics` — update global metrics aggregates.

### 2.6 Metadata helpers

- `set_metadata` — generic helper to set optional metadata on various
  accounts where appropriate.

## 3. Events

The program emits events for external indexing services and off-chain
consumers. Examples include:

- `RepoRegistered`
- `RepoUpdated`
- `ModuleRegistered`
- `ModuleUpdated`
- `ForkCreated`
- `ForkUpdated`
- `ObservationRecorded`
- `MetricsUpdated`

Events help keep external databases and dashboards in sync with on-chain
state.

## 4. PDA and seed strategy

To avoid collisions and keep account addressing predictable, PDAs are
derived using stable seeds such as:

- Config: `("config")`
- Repo: `("repo", key)`
- Module: `("module", repo_pubkey, module_name)`
- ModuleVersion: `("module_version", module_pubkey, version)`
- Fork: `("fork", owner_pubkey, label)`
- Metrics: `("metrics")`

Seeds should be carefully chosen to avoid exceeding length limits and to
keep address derivation stable over time.

## 5. Security considerations

- Configuration updates restricted to an admin authority.
- Optional support for a governance or multisig-based admin.
- Limits to prevent resource exhaustion (for example, too many modules).
- Careful rent and allocation sizing to avoid unnecessary costs.

On-chain design should remain relatively conservative. Most experimentation
belongs to the off-chain engine and forks built on top of these core
primitives.
