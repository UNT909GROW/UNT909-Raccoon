# Installation

This document covers installation paths for running Unit09 locally, in a
shared development environment, or as a production-grade deployment.

There are three major pieces you may install:

1. The on-chain program (Solana program).
2. The off-chain engine (API, worker, scheduler).
3. The developer tooling (CLI and SDK).

## 1. Installing the Solana program

You can deploy the Unit09 Solana program either to localnet, devnet, or
mainnet. The process is similar to deploying any Anchor-based program.

### 1.1 Build the program

From the repository root:

```bash
cd contracts/unit09-program
anchor build
```

This compiles the on-chain program and generates the IDL.

### 1.2 Configure the program ID

If you are deploying your own instance, you will need to:

1. Create a new keypair for the program.
2. Set the program ID in `lib.rs` and `Anchor.toml`.
3. Redeploy using Anchor.

Example:

```bash
solana-keygen new -o target/deploy/unit09_program-keypair.json
solana address -k target/deploy/unit09_program-keypair.json
```

Copy the resulting address and update the `declare_id!` macro in `lib.rs`
and the program ID in `Anchor.toml`.

### 1.3 Deploy to a cluster

Deploy to devnet:

```bash
solana config set --url https://api.devnet.solana.com
anchor deploy
```

Make sure your wallet has enough SOL to pay for deployment fees.

## 2. Installing the engine services

The engine consists of three services:

- `api` — HTTP interface for external clients.
- `worker` — runs the main decomposition and generation pipeline.
- `scheduler` — triggers recurring jobs.

You can run them either via Node.js directly or using Docker images.

### 2.1 Local Node.js

```bash
# API
cd services/api
npm install
npm run dev

# Worker
cd services/worker
npm install
npm run dev

# Scheduler
cd services/scheduler
npm install
npm run dev
```

Environment variables such as `UNIT09_SOLANA_RPC` and `UNIT09_PROGRAM_ID`
must be configured before starting the services. See
`configuration.md` for the complete list.

### 2.2 Docker images

If you prefer containers, you can build images using the Dockerfiles under
`infra/docker`:

```bash
# From repository root
docker build -f infra/docker/Dockerfile.api -t unit09/api:local .
docker build -f infra/docker/Dockerfile.worker -t unit09/worker:local .
docker build -f infra/docker/Dockerfile.scheduler -t unit09/scheduler:local .
```

You can then run them with your favorite orchestrator or use the demo
`docker-compose.yml` as a starting point.

## 3. Installing the CLI

The CLI provides a thin wrapper around the API and SDK.

From the repository root:

```bash
cd cli
npm install
npm link
```

This will make the `unit09` command available globally in your shell.

Verify installation:

```bash
unit09 --help
```

## 4. Installing the SDK

The SDK is a TypeScript package you can add to your own tools or services.

In your project:

```bash
npm install @unit09/sdk
```

Then in your code:

```ts
import { Unit09Client } from "@unit09/sdk";

const client = new Unit09Client({
  apiBaseUrl: "https://api.unit09.org/api",
});
```

## 5. Verifying the installation

Once everything is installed:

1. Make sure the Solana program is deployed and accessible.
2. Confirm the API is running and responds to `/api/health`.
3. Confirm the CLI can reach the API.
4. Run a small pipeline using a demo repository.

If you run into trouble, check:

- **Configuration** for incorrect environment variables.
- **Deployment Guide** for networking or TLS issues.
- **FAQ** for common failure modes.
