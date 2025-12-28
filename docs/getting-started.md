# Getting Started with Unit09

This guide walks you through the fastest path from zero to a running Unit09
instance observing a simple Solana project and generating modules.

It assumes you are familiar with:

- Basic Solana concepts (accounts, programs, PDAs).
- Running Node.js and Docker locally.
- Git and GitHub.

## 1. Install prerequisites

You will need:

- Node.js 20+
- Docker and Docker Compose
- Anchor CLI (optional but recommended)
- A Solana keypair with some devnet SOL

Verify your versions:

```bash
node -v
docker --version
anchor --version    # optional
solana --version
```

## 2. Clone the repository

```bash
git clone https://github.com/your-org/unit09.git
cd unit09
```

If you are working from a fork, replace the URL with your own repository.

## 3. Start the local demo stack

The repository includes a local demo stack that runs:

- A Solana local validator
- The Unit09 API
- The worker and scheduler
- A small example project

From the repository root:

```bash
cd examples/unit09-local-demo
docker compose up -d
```

Wait for all containers to be healthy. You can check status with:

```bash
docker compose ps
```

## 4. Seed demo data

Run the seeding script to register a demo repository:

```bash
./scripts/run_localnet.sh seed
```

This will call the Unit09 API and register a couple of example GitHub
repositories (for example, a simple Anchor note program).

## 5. Run the full workflow

Now trigger the end-to-end workflow:

```bash
./scripts/run_localnet.sh demo
```

The script will:

1. Ensure the API is healthy.
2. Trigger the Unit09 pipeline for a demo repo.
3. Wait for generated modules.
4. Print resulting modules and global stats.

You should see output similar to:

```text
[demo] Modules generated:
  - note-core | Note Core Module | rust | v1 | status=ready
  - note-events | Note Events | rust | v1 | status=ready
```

## 6. Explore the dashboard

If you have the dashboard app running, open your browser:

- Dashboard: `http://localhost:3000`

From there you can:

- Inspect observed repositories.
- View generated modules.
- Explore forks of Unit09 created by users.

## 7. Next steps

Once you have the demo working:

- Read **Architecture** to understand how components fit together.
- Check **CLI Usage** to see how to integrate your own repositories.
- Review **Deployment Guide** to move from local demos to devnet or
  mainnet-style deployments.
