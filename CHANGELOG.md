# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by common open source changelog conventions and is
intended to be human-readable first. Dates are in UTC.

## [Unreleased]

### Added

- New features and improvements that have not yet been released.
- This section is a staging area; entries should be moved to a tagged
  version when a release is cut.

### Changed

- Behavioral and API changes that are not strictly new features.

### Fixed

- Bug fixes and stability improvements.

### Deprecated

- Features or APIs that will be removed in a future release.

### Removed

- Features or APIs that were deprecated and are now removed.

### Security

- Notes on security-relevant changes or patches.

---

## [0.2.0] - 2025-01-01

### Added

- Core engine pipeline for observing repositories, analyzing code, and
  generating modules.
- Initial support for Rust / Anchor and TypeScript analyzers.
- Worker service and scheduler for background processing.
- Dashboard application for viewing repositories, modules, forks, and stats.
- Documentation set under `docs/` including architecture and workflow guides.

### Changed

- Refined on-chain account layout for `Repo`, `Module`, `ModuleVersion`,
  `Fork`, and `Metrics` accounts.
- Improved error handling in the API service and standardized JSON error
  format.
- Updated CLI commands for consistency (`link-repo`, `run-pipeline`,
  `list-modules`, `show-stats`).

### Fixed

- Corrected account seed derivations for module and metrics PDAs.
- Fixed pagination bugs in repository and module list endpoints.
- Resolved intermittent failures in local demo Docker stack caused by
  race conditions during startup.

### Security

- Hardened input validation on API routes that accept external URLs,
  including stronger checks on repository URLs.
- Added configuration options to limit maximum repository size and job
  concurrency to reduce resource exhaustion risks.

---

## [0.1.0] - 2024-12-01

Initial public release of Unit09.

### Added

- Unit09 Solana program with configuration, repository, module, fork,
  metrics, and lifecycle accounts.
- Anchor-based instruction set for registering repositories, modules,
  forks, and recording observations.
- TypeScript SDK for interacting with the program and API.
- Basic API service handling repository registration and simple queries.
- Local demo stack with Solana localnet, API, worker, and example projects.
- Initial CLI implementation with basic commands.
- Project-level documentation and community meta files:
  - LICENSE
  - CODE_OF_CONDUCT.md
  - CONTRIBUTING.md
  - SECURITY.md
  - GOVERNANCE.md

---

## How to update this file

When you make a change that affects users or developers, add a brief entry
under the `[Unreleased]` section describing:

- What changed
- Why it matters (when not obvious)
- Whether it is breaking, additive, or a bug fix

When you cut a new release:

1. Create a new version heading (for example, `## [0.3.0] - 2025-03-15`).
2. Move relevant entries from `[Unreleased]` into that version section.
3. Commit the updated changelog as part of the release commit.
