# Unit09 Local Demo

This folder contains a local demonstration setup for Unit09. It starts a
Solana local validator, the Unit09 API, the worker, and the scheduler in a
single `docker-compose` stack, then seeds demo data and runs a sample
workflow.

## Services

- `solana-localnet` — local Solana validator
- `unit09-api` — HTTP API service
- `unit09-worker` — background worker that runs the pipeline
- `unit09-scheduler` — cron-like scheduler for periodic jobs

## Quick start

From this directory:

```bash
docker compose up -d
```

Once all services are healthy, you can:

1. Seed demo data:

   ```bash
   ./scripts/run_localnet.sh seed
   ```

2. Run the end-to-end workflow:

   ```bash
   ./scripts/run_localnet.sh demo
   ```

The script will:

- Register a demo repository
- Trigger the pipeline
- Wait for completion
- Print the generated modules and stats.
