# Engine Design

The core engine is responsible for turning raw repositories into meaningful
modules that can be recorded on-chain and consumed by developers.

This document explains the main concepts, pipeline, and extension points.

## 1. Goals

The engine aims to:

- Observe real Solana and related code.
- Build a language-aware understanding of each project.
- Suggest reasonable module boundaries.
- Generate usable artifacts with minimal manual work.
- Remain configurable and safe enough for automated pipelines.

It is not intended to be a compiler or formal verifier. Instead it behaves
like a specialized assistant for modularization and scaffolding.

## 2. Core components

The engine is implemented under `packages/core-engine` and structured into
several domains:

- `config/` — configuration schema and defaults.
- `pipeline/` — the main orchestrated pipeline stages.
- `analyzers/` — language and framework analyzers.
- `generators/` — code, documentation, and artifact generators.
- `graph/` — code graph representations.
- `ai/` — integration with large language models.
- `adapters/` — integration with external systems (Git, GitHub, Solana).
- `logging/` and `utils/` — supporting utilities.

## 3. Pipeline stages

The pipeline is modeled as a series of functions that transform a
`PipelineContext` from one state to another.

Typical stages include:

1. `observeCode`  
   Clone or pull the repository, read directories and files, collect raw
   statistics.

2. `detectLanguage`  
   Inspect file extensions and contents to determine primary languages and
   frameworks.

3. `parseProject`  
   Use analyzers to parse code and extract structured representations
   (for example, Anchor IDL, instruction sets, account layouts).

4. `buildCodeGraph`  
   Construct a graph of modules, functions, accounts, and dependencies.

5. `decomposeModules`  
   Propose module boundaries based on the graph and configuration.

6. `generateModuleArtifacts`  
   Produce metadata, scaffolds, and optional code artifacts.

7. `assembleBuildPlan`  
   Determine the steps needed to materialize the new modules (for example,
   creating branches, generating docs).

8. `validateModules`  
   Run structural and semantic checks before syncing.

9. `syncOnChain`  
   Write module metadata, versions, and metrics to the Solana program.

10. `runFullPipeline`  
    Helper that executes all stages in order with consistent error
    handling.

## 4. Analyzers

Analyzers are specialized modules that understand specific languages and
frameworks. Examples:

- `rustAnalyzer.ts`  
  Understands Rust crates, modules, and function signatures.

- `anchorAnalyzer.ts`  
  Reads Anchor programs, instructions, accounts, and IDLs.

- `typescriptAnalyzer.ts`  
  Understands TypeScript clients, SDKs, and CLI tools.

- `configAnalyzer.ts`  
  Parses configuration files such as `Anchor.toml`, `Cargo.toml`, and
  workspace files.

Each analyzer receives a view of the repository and returns rich metadata
structures that feed into the code graph.

## 5. Generators

Generators turn analysis results into artifacts. Typical generators include:

- `moduleScaffold.ts`  
  Generates the directory structure and boilerplate for a module split.

- `instructionTemplates.ts`  
  Suggests new instructions or integration glue code.

- `deployScripts.ts`  
  Produces deployment scripts or configuration snippets.

- `frontendStubs.ts`  
  Creates small examples or demo integrations for front-end clients.

You can enable or disable generators per pipeline run, depending on how
aggressive you want Unit09 to be.

## 6. Code graph

The `graph/` package models the project as a graph, where nodes can be:

- Files
- Public functions
- Accounts and structs
- Instruction handlers
- Modules

Edges capture dependencies and relationships. The decomposition logic uses
this graph to decide which nodes belong together in a module.

## 7. AI integration

The `ai/` package is responsible for:

- Building prompts that describe the project and candidate modules.
- Calling external language models.
- Post-processing model outputs into structured suggestions.

The goal is to keep AI usage:

- Focused — only where human-level judgment is needed.
- Contained — always validated by deterministic checks.
- Replaceable — AI providers can be swapped or disabled.

## 8. Error handling and observability

The engine reports errors and metrics through:

- Structured logs.
- Optional Prometheus metrics exported by services using the engine.
- Job-level status updates that are visible in the API and dashboard.

Common failure modes include:

- Network issues when fetching code.
- Parsing errors for malformed code.
- Exceeding configurable limits (for example, repository too large).

The engine is designed to fail gracefully where possible and to leave
traceable logs for debugging.
