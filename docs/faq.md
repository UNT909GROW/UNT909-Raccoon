# FAQ

This document collects frequently asked questions about Unit09.

## 1. What is Unit09 in one sentence?

Unit09 is a story-driven on-chain AI raccoon that consumes Solana code,
turns it into modules, and evolves through forks created by the community.

## 2. Do I need to trust the AI to use Unit09?

You do not have to treat the AI as an oracle of truth. The engine is
designed so that AI suggestions are:

- Logged and auditable.
- Validated by deterministic checks where possible.
- Optional to apply.

You can treat Unit09 as a helper that proposes structure and scaffolding,
while you retain final control over your codebase.

## 3. Does Unit09 deploy or modify my programs automatically?

By default, no.

Unit09 observes your code, suggests modules, and can generate artifacts, but
deployment is a separate step. You can integrate deployment scripts into
your CI or use the CLI to trigger them explicitly.

## 4. What kind of projects does Unit09 work best with?

Unit09 works best with projects that are:

- Written in Rust / Anchor or TypeScript ecosystems.
- Organized in a reasonably standard structure.
- Built around Solana programs and clients.

It can still extract useful signals from less structured projects, but the
quality of module suggestions may be lower.

## 5. Can I run my own private Unit09 instance?

Yes. The architecture is designed so that you can run:

- A private Solana cluster or use devnet.
- Your own API, worker, and scheduler services.
- A private dashboard and docs site.

See `deployment-guide.md` for details.

## 6. What are forks and why would I use them?

Forks represent different “personalities” or behavior profiles for Unit09.
You might create a fork to:

- Encode team-specific coding standards.
- Experiment with more aggressive or conservative module splits.
- Run alternative evolution strategies for the AI raccoon.

Each fork is tracked on-chain and can have its own metrics and modules.

## 7. How does Unit09 make money or sustain itself?

The core protocol supports optional fees and incentives through the
configuration account (`fee_bps` and related fields). The exact economic
model depends on how you deploy and govern your instance.

Some deployments may choose to:

- Charge for intensive analysis jobs.
- Reward module authors or fork maintainers.
- Use Unit09 purely as infrastructure without protocol-level fees.

## 8. Is the code open source?

The intent is for the core of Unit09 to be open source so that:

- Developers can verify how the system behaves.
- Communities can contribute analyzers and generators.
- Operators can run their own instances.

Check the main repository for licensing details.

## 9. Can Unit09 work with non-Solana projects?

The engine is built with Solana as the primary target, but the underlying
ideas — decomposition, module generation, and AI-assisted analysis — can
be extended to other ecosystems. Support for other chains or stacks would
require additional analyzers and generators.

## 10. Where can I get help or contribute?

You can:

- Open issues and pull requests on the repository.
- Propose new analyzers or modules in the gallery.
- Join community channels (for example, Discord or Telegram) if provided.

Unit09 is meant to grow with its community — both on-chain and off-chain.
