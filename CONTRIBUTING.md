# Contributing to Unit09

Thank you for your interest in contributing to Unit09 — a story-driven on-chain
AI raccoon that consumes Solana code, turns it into modules, and evolves
through forks created by the community.

This document explains how to set up your environment, the contribution
workflow, coding standards, and expectations for issues, pull requests, and
security disclosures.

> Short version: Be respectful, keep changes focused, add tests, and explain
> what you are doing and why.

---

## 1. Scope of this project

The Unit09 codebase is organized into several major areas:

- `contracts/` — Solana on-chain program(s) written with Anchor.
- `packages/` — shared TypeScript packages (SDK, core engine, utilities).
- `services/` — backend services (API, worker, scheduler).
- `cli/` — the `unit09` command-line interface.
- `apps/` — dashboard and documentation frontends.
- `examples/` — sample projects and demo stacks.
- `infra/` — infrastructure (Docker, Kubernetes, Terraform, monitoring).
- `docs/` — documentation and technical reference material.

When you open an issue or a pull request, please mention which area you are
working in so reviewers with the right expertise can take a look.

---

## 2. Code of conduct

By participating in this project, you agree to:

- Treat all contributors and users with respect.
- Assume good intent but allow for mistakes.
- Keep discussions technical and constructive.
- Avoid harassment, personal attacks, or discriminatory behavior.

If you experience or witness unacceptable behavior, you can reach out to the
maintainers privately via the communication channels listed in the repository
README. The maintainers may take appropriate action, including moderation of
issues and pull requests.

---

## 3. Getting started as a contributor

### 3.1. Fork and clone

1. Fork the repository on GitHub.
2. Clone your fork locally:

   ```bash
   git clone https://github.com/<your-username>/unit09.git
   cd unit09
   ```

3. Configure the upstream remote so you can sync with the main repository:

   ```bash
   git remote add upstream https://github.com/unit09-labs/unit09.git
   ```

### 3.2. Development dependencies

You will typically need:

- Node.js 20+
- pnpm or npm (we assume pnpm for performance)
- Rust stable toolchain
- Solana CLI
- Anchor CLI
- Docker (for running localnet and services)
- A supported operating system (Linux, macOS, or WSL on Windows)

Verify installation:

```bash
node -v
pnpm -v || npm -v
rustc -vV
solana --version
anchor --version
docker --version
```

### 3.3. Install Node.js dependencies

From the repository root:

```bash
pnpm install
```

If you prefer npm, you can use it, but the lockfile and scripts may assume
pnpm. Try to keep your environment consistent with the repository defaults.

### 3.4. Build and test the contracts

```bash
cd contracts/unit09-program
anchor build
anchor test
```

You may want to run tests against localnet. See the docs under `docs/` for
details.

### 3.5. Run the local demo stack

The simplest way to try Unit09 end-to-end is the local demo stack:

```bash
cd examples/unit09-local-demo
docker compose up -d

# Optionally run a demo script
./scripts/run_localnet.sh demo
```

You can then work on changes while the stack is running.

---

## 4. Branching and workflow

### 4.1. Issues first

If you plan to work on a non-trivial change, open an issue first to discuss:

- What problem you are solving.
- Why the existing behavior is not sufficient.
- Your proposed approach at a high level.

This helps avoid duplicated work and gives maintainers a chance to provide
guidance before you invest significant effort.

### 4.2. Create a feature branch

From your local clone of your fork:

```bash
git checkout main
git pull upstream main
git checkout -b feature/my-descriptive-branch-name
```

Branch name examples:

- `fix/api-module-pagination`
- `feat/engine-new-analyzer`
- `docs/update-getting-started`

### 4.3. Keep your branch up to date

Regularly rebase on the upstream main branch to keep your changes small and
reduce merge conflicts:

```bash
git fetch upstream
git rebase upstream/main
```

If you are not comfortable with rebase, you may use merge, but rebasing tends
to produce cleaner history.

---

## 5. Commit messages

Commit messages should be clear and descriptive. A good commit message:

- Explains what changed.
- Explains why it changed when not obvious.
- Uses the imperative mood in the subject line.

Examples:

- `Fix module pagination in API response`
- `Add rust analyzer for multi-crate workspaces`
- `Refactor CLI config loading to use shared utils`

Avoid generic messages such as `fix` or `update` without context.

If you want to follow a structured convention, a simplified form of
Conventional Commits is recommended:

- `feat: ...`
- `fix: ...`
- `docs: ...`
- `refactor: ...`
- `test: ...`
- `chore: ...`

This is helpful but not absolutely required.

---

## 6. Coding standards

### 6.1. General principles

- Prefer clarity over cleverness.
- Keep functions small and focused.
- Avoid unnecessary abstractions.
- Do not duplicate logic; share helpers where appropriate.
- Add comments where intent is not obvious, but do not comment the obvious.

### 6.2. Rust (contracts)

- Follow standard Rust style using `rustfmt`.
- Use idiomatic Anchor patterns for accounts and instructions.
- Keep on-chain logic minimal and deterministic.
- Avoid heavy computation in the program; offload to the engine where possible.
- Add unit tests for new instructions and account types when practical.

You can run formatting and clippy:

```bash
cargo fmt
cargo clippy --all-targets --all-features -- -D warnings
```

### 6.3. TypeScript (engine, SDK, services, CLI, apps)

- Use TypeScript strict mode where possible.
- Prefer `type` and `interface` to describe data structures.
- Avoid `any` unless there is no reasonable alternative.
- Keep promise chains simple; prefer `async/await`.
- Use `eslint` and `prettier` if configured in the repo.

Typical lint command:

```bash
pnpm lint
```

### 6.4. Tests

- Add or update tests for any behavior change.
- Keep tests deterministic and fast where possible.
- Use existing test helpers and fixtures in `contracts/tests` and
  `packages/testing-utils`.

When fixing a bug, try to add a test that fails before your change and passes
after your change.

---

## 7. Documentation contributions

Documentation is as important as code. Contributions are welcome in:

- `docs/` — main technical documentation.
- `apps/docs-site/` — rendered documentation site.
- In-code documentation where it improves clarity.

When you change behavior, consider whether any of the following need updates:

- `getting-started.md`
- `installation.md`
- `configuration.md`
- `workflow.md`
- `api-reference.md`
- `cli-usage.md`

If you add a new feature, please at least update one relevant documentation
file so that users can discover how to use it.

---

## 8. Opening a pull request

When you are ready to propose your changes:

1. Push your branch to your fork:

   ```bash
   git push origin feature/my-descriptive-branch-name
   ```

2. Open a pull request from your branch to the main repository `main` branch.

3. Fill in the pull request template if one is provided. At minimum, include:

   - A clear title.
   - A short summary of what changed.
   - Any breaking changes or migration notes.
   - Testing steps (how you verified your changes).

4. Link related issues using keywords such as `Closes #123` or `Fixes #456`.

5. Be responsive to reviewer feedback. If you disagree with a suggestion,
   explain your reasoning so you can find a good compromise.

### 8.1. Pull request size

Smaller, focused pull requests are easier to review and more likely to be
merged quickly.

If you have a large change, consider splitting it into several smaller PRs:

- One that introduces core abstractions.
- One that wires them into existing code.
- One that updates documentation.

### 8.2. Review expectations

Maintainers will try to:

- Review PRs in a reasonable time frame.
- Provide clear, actionable feedback.
- Explain requested changes when not obvious.

You can help by:

- Keeping the scope focused.
- Writing good commit messages.
- Updating the PR description when scope changes.

---

## 9. Security and responsible disclosure

If you discover a security vulnerability or a behavior that could put user
funds, sensitive data, or infrastructure at risk:

1. Do **not** open a public issue or discuss it in public channels.
2. Contact the maintainers via the private security contact listed in the
   repository (for example, a `SECURITY.md` file or security email address).
3. Provide as much detail as possible, including:
   - Steps to reproduce.
   - Affected components or configurations.
   - Any suggested mitigations.

The maintainers will:

- Acknowledge receipt of your report.
- Work on a fix or mitigation.
- Coordinate responsible disclosure if appropriate.

---

## 10. Adding analyzers, generators, and modules

Because Unit09 is centered on modularization, contributions that extend the
engine are especially welcome.

### 10.1. New analyzers

When adding a new analyzer under `packages/core-engine/analyzers`:

- Document which language or framework it targets.
- Provide test repositories or fixtures.
- Add tests that exercise typical and edge-case inputs.
- Write a short design note in `docs/engine-design.md` or a linked file
  explaining how your analyzer fits into the pipeline.

### 10.2. New generators

When adding generators under `packages/core-engine/generators`:

- Clearly describe what artifacts are generated and why.
- Make generation behavior configurable (for example, enabled or disabled
  per pipeline run).
- Ensure generated content is idempotent or clearly versioned.

### 10.3. Module gallery contributions

Under `examples/module-gallery`, you can contribute:

- New example modules.
- Improved versions of existing ones.
- Additional documentation explaining trade-offs.

Each module should include a `README.md` that explains what it does, how it
is structured, and how it can be reused.

---

## 11. Style and tone

The storytelling aspect of Unit09 is part of its identity, but production
code and documentation should remain professional and clear.

- Occasional references to the AI raccoon are welcome in docs and logs,
  as long as they do not obscure meaning.
- Avoid jargon or humor in error messages that must be parsed by tools.
- Keep user-facing text accessible to developers who are new to the project.

---

## 12. Licensing

By contributing to this repository, you agree that your contributions will be
licensed under the same license that covers the rest of the project, as
described in the `LICENSE` file in the root of the repository.

If you need to contribute code under different licensing terms, please
discuss this with the maintainers before opening a pull request.

---

## 13. Thank you

Every contribution helps Unit09 become a more capable, more reliable, and
more interesting AI raccoon for the Solana ecosystem.

Thank you for taking the time to improve the project — whether through code,
documentation, testing, design, or discussion.
