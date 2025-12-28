# Configuration

Unit09 is configured primarily through environment variables and a small
number of on-chain configuration accounts. This document covers both.

## 1. Environment variables

The following environment variables are recognized by the services.

### 1.1 Common variables

These are used by all components that talk to Solana or each other.

- `UNIT09_SOLANA_RPC`  
  RPC endpoint for the Solana cluster (for example,
  `https://api.devnet.solana.com`).

- `UNIT09_PROGRAM_ID`  
  Public key of the deployed Unit09 Solana program.

- `UNIT09_CLUSTER`  
  Optional label describing the target cluster (`localnet`, `devnet`,
  `mainnet`).

### 1.2 API service

- `PORT`  
  Port for the HTTP server. Default: `8080`.

- `UNIT09_API_BASE_URL`  
  Base URL used when generating links in responses. Optional.

- `UNIT09_ENGINE_BASE_URL`  
  URL of the core engine for internal calls, if it is split into a separate
  service.

- `LOG_LEVEL`  
  Log verbosity (`debug`, `info`, `warn`, `error`). Default: `info`.

### 1.3 Worker service

- `UNIT09_QUEUE_URL`  
  Connection string for the job queue (for example, Redis or another
  broker).

- `UNIT09_MAX_CONCURRENT_JOBS`  
  Maximum number of jobs processed in parallel.

- `UNIT09_JOB_VISIBILITY_TIMEOUT_SECONDS`  
  Visibility timeout for jobs in seconds if using a queueing system that
  supports it.

- `UNIT09_ENGINE_CONFIG_PATH`  
  Optional path to a local engine configuration file (for example,
  `engine.config.json`).

### 1.4 Scheduler service

- `UNIT09_API_BASE`  
  Base URL of the API service used to trigger jobs.

- `UNIT09_SCHEDULE_CRON_OBSERVE`  
  Cron expression for periodic repository observation.

- `UNIT09_SCHEDULE_CRON_SYNC`  
  Cron expression for periodic metrics synchronization.

## 2. On-chain configuration

On-chain configuration is represented by the `Config` account in the
Solana program. Typical fields include:

- `admin` — administrative authority allowed to update configuration.
- `max_repos` — maximum number of repositories that can be tracked.
- `max_modules_per_repo` — safety limit for module generation.
- `fee_bps` — optional fee expressed in basis points for protocol fees.
- `evolution_policy` — flags controlling how forks are created and updated.

To initialize configuration, you run the `initialize` instruction once,
then use `set_config` for future updates.

A typical configuration flow:

1. Deploy the program.
2. Use the CLI or a script to call `initialize`.
3. Optionally call `set_config` with your own limits and policies.

## 3. Configuration files

Unit09 also supports reading additional configuration from files.

### 3.1 Engine configuration

Under `packages/core-engine`, you will typically find:

- `engineConfig.ts` — strongly typed configuration structure.
- `defaults.ts` — compiled defaults.
- `schema.ts` — runtime validation schema.

The engine can load configuration from:

- Environment variables.
- A JSON or YAML file.
- The API service that passes configuration into jobs.

### 3.2 Local development configuration

For local development, it is often convenient to use a `.env` file:

```env
UNIT09_SOLANA_RPC=http://localhost:8899
UNIT09_PROGRAM_ID=Unit09Program11111111111111111111111111111
UNIT09_QUEUE_URL=redis://localhost:6379
LOG_LEVEL=debug
```

Make sure secret values (for example, tokens or private keys) are not
committed to version control.
