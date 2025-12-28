# Unit09 Deployment Guide

This document describes, in detail, how to deploy Unit09 in different
environments, from a local development setup to a production-style
cluster. 

All examples are intended as reference. You should adapt hostnames,
domains, credentials, and secrets to your own environment.

---

## 1. High-level deployment overview

Unit09 is a multi-component system. A complete deployment usually
consists of:

1. A Solana cluster (localnet, devnet, testnet, or mainnet)
2. The Unit09 on-chain program (Anchor-based)
3. The core services:
   - API service
   - Worker service
   - Scheduler service
4. Optional applications:
   - Dashboard app
   - Docs site
5. Supporting infrastructure:
   - PostgreSQL database
   - Job queue (for example, Redis or a message broker)
   - Object storage (for example, S3-compatible)
   - Metrics and logging (Prometheus, Grafana, log aggregation)

This guide covers multiple deployment modes:

- Local development (single machine)
- Local demo stack (Docker Compose)
- Staging / production (containerized, possibly Kubernetes)
- Program deployment to Solana

---

## 2. Prerequisites

### 2.1. Tools

You should have the following installed on the machine where you perform
builds and local development:

- Node.js 20+
- pnpm or npm
- Rust stable toolchain
- Solana CLI
- Anchor CLI
- Docker and Docker Compose
- Git
- A code editor (for example, VS Code)

Verify basic versions:

```bash
node -v
pnpm -v || npm -v
rustc -vV
solana --version
anchor --version
docker --version
```

### 2.2. Solana CLI configuration

Decide which cluster you are targeting.

For local development:

```bash
solana config set --url http://localhost:8899
```

For devnet:

```bash
solana config set --url https://api.devnet.solana.com
```

Confirm configuration:

```bash
solana config get
```

Ensure your keypair is set and funded appropriately for
program deployment and test transactions.

---

## 3. Repository setup

Clone the Unit09 repository:

```bash
git clone https://github.com/unit09-labs/unit09.git
cd unit09
```

Install dependencies at the monorepo root:

```bash
pnpm install
```

If you prefer npm:

```bash
npm install
```

Make sure the workspace and scripts run without errors.

---

## 4. Configuration model

Unit09 uses a configuration directory such as:

```text
config/
  default.yaml
  development.yaml
  production.yaml
  schema.json
```

### 4.1. Configuration environment

Most runtime components (API, worker, scheduler, apps) will read
configuration based on an environment variable, for example:

```bash
export UNIT09_CONFIG_ENV=development
```

The loader then merges:

- `default.yaml` (base settings)
- `<env>.yaml` (environment overrides)

### 4.2. Example configuration keys

Common configuration sections include:

- `app` — environment, port, log level
- `solana` — cluster URL and commitment level
- `database` — connection settings for PostgreSQL
- `security` — allowed origins, rate limiting options
- `pipeline` — limits on jobs, repository sizes, concurrency
- `metrics` — settings for Prometheus or a push gateway

You should customize `development.yaml` and `production.yaml` to reflect
your environment, domains, and resource constraints.

---

## 5. Building and deploying the on-chain program

The Unit09 on-chain program lives under:

```text
contracts/unit09-program/
```

### 5.1. Build the program

From this directory:

```bash
cd contracts/unit09-program
anchor build
```

This will produce a program shared object (`.so`) and an IDL file under
`target/` and `idl/` respectively.

### 5.2. Configure the program ID

Make sure `Anchor.toml` is configured with a `programs` section that
matches your intended deployment:

```toml
[programs.localnet]
unit09_program = "<LOCAL_PROGRAM_ID>"

[programs.devnet]
unit09_program = "<DEVNET_PROGRAM_ID>"

[programs.mainnet]
unit09_program = "<MAINNET_PROGRAM_ID>"
```

You can use `solana-keygen` to generate a new keypair for the program:

```bash
solana-keygen new -o target/deploy/unit09_program-keypair.json
```

The corresponding public key is the program ID. Update `program-id.md`
and `Anchor.toml` accordingly.

### 5.3. Deploy to localnet

To run a local validator and deploy the program:

```bash
# In one terminal
solana-test-validator

# In another terminal
cd contracts/unit09-program
anchor deploy --provider.cluster localnet
```

Monitor the logs in the validator terminal for any errors.

### 5.4. Deploy to devnet

Ensure your keypair has enough SOL on devnet, then run:

```bash
cd contracts/unit09-program
anchor deploy --provider.cluster devnet
```

Confirm the program is visible on a Solana explorer and that the IDL
matches the committed version.

### 5.5. Program upgrades

To upgrade the program on a cluster where it is already deployed,
follow the upgrade flow:

1. Make code changes.
2. Rebuild: `anchor build`.
3. Deploy using the same program ID, assuming you still have the
   upgrade authority:
   ```bash
   anchor deploy --provider.cluster devnet
   ```
4. Make sure off-chain services are compatible with the new IDL if
   account layouts or instruction signatures have changed.

Document breaking changes in the changelog and deployment notes.

---

## 6. Running the local demo stack (Docker Compose)

For a quick end-to-end experience, use the local demo stack under:

```text
examples/unit09-local-demo/
```

This directory typically includes:

- `docker-compose.yml` — definitions for:
  - Solana localnet
  - PostgreSQL
  - API service
  - Worker service
  - Optional dashboard
- Helper scripts in `scripts/`

### 6.1. Start the stack

From the directory:

```bash
cd examples/unit09-local-demo
docker compose up -d
```

Wait for containers to start. You can inspect logs with:

```bash
docker compose logs -f api
docker compose logs -f worker
```

### 6.2. Seed demo data

If the repo includes seeding scripts, they might look like:

```bash
pnpm ts-node scripts/seed_demo_data.ts
pnpm ts-node scripts/demo_workflow.ts
```

These scripts usually:

- Register a sample repository with Unit09
- Run the pipeline
- Populate the dashboard with sample modules and forks

### 6.3. Access the dashboard and API

- Dashboard: `http://localhost:<dashboard-port>`
- API: `http://localhost:<api-port>` (for example, 8080)

You can test a typical endpoint such as:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/repos
```

---

## 7. Manual local development (without Docker)

You may want to run pieces manually for debugging:

### 7.1. Start a local Solana validator

```bash
solana-test-validator
```

Configure your CLI to point at it:

```bash
solana config set --url http://localhost:8899
```

Deploy the program as described earlier.

### 7.2. Run database and queue

You can use Docker just for dependencies.

Example for PostgreSQL:

```bash
docker run --name unit09-postgres   -e POSTGRES_USER=unit09   -e POSTGRES_PASSWORD=unit09_password   -e POSTGRES_DB=unit09_dev   -p 5432:5432   -d postgres:15
```

If a queue such as Redis is used:

```bash
docker run --name unit09-redis -p 6379:6379 -d redis:7
```

### 7.3. Start the API service

From the monorepo root or `services/api`:

```bash
export UNIT09_CONFIG_ENV=development
cd services/api
pnpm dev
```

or

```bash
pnpm start
```

depending on the scripts defined in `package.json`.

### 7.4. Start the worker service

```bash
export UNIT09_CONFIG_ENV=development
cd services/worker
pnpm dev
```

The worker subscribes to job queues and interacts with the core engine.

### 7.5. Start the scheduler

```bash
export UNIT09_CONFIG_ENV=development
cd services/scheduler
pnpm dev
```

The scheduler should periodically enqueue jobs such as repository
observations and metrics sync.

### 7.6. Start the dashboard (optional)

```bash
cd apps/dashboard
pnpm dev
```

Visit the indicated URL (for example, `http://localhost:3000`).

---

## 8. Production-style deployment

In production, you will likely want to:

- Use container images published to a registry
- Deploy to a container orchestration platform (for example, Kubernetes)
- Use managed or hardened Postgres, Redis, and object storage
- Front the API with a reverse proxy or API gateway
- Use TLS certificates for all public endpoints

### 8.1. Building production images

Dockerfiles might live under `infra/docker/` or within each service
directory.

Example (from repository root):

```bash
docker build -f infra/docker/Dockerfile.api -t unit09-api:latest .
docker build -f infra/docker/Dockerfile.worker -t unit09-worker:latest .
docker build -f infra/docker/Dockerfile.scheduler -t unit09-scheduler:latest .
```

Tag and push to your registry:

```bash
docker tag unit09-api:latest registry.example.com/unit09-api:0.2.0
docker push registry.example.com/unit09-api:0.2.0
```

Repeat for other services.

### 8.2. Kubernetes deployment

Kubernetes manifests may live under `infra/k8s/`:

```text
infra/k8s/
  namespaces.yaml
  deployments/
    api-deployment.yaml
    worker-deployment.yaml
    scheduler-deployment.yaml
  services/
    api-service.yaml
    dashboard-service.yaml
  ingress/
    ingress.yaml
  configmaps/
    engine-config.yaml
    worker-config.yaml
```

Apply manifests:

```bash
kubectl apply -f infra/k8s/namespaces.yaml
kubectl apply -f infra/k8s/configmaps/
kubectl apply -f infra/k8s/deployments/
kubectl apply -f infra/k8s/services/
kubectl apply -f infra/k8s/ingress/
```

Adjust resource requests and limits, replica counts, and environment
variables as needed.

### 8.3. Terraform (optional)

If the repository includes Terraform configuration in `infra/terraform/`,
you can use it to manage cloud infrastructure such as:

- Kubernetes clusters
- Databases
- Load balancers
- Storage buckets

Example workflow:

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

Review plans carefully before applying in production.

---

## 9. Secrets and environment management

Never commit secrets to the repository. Use environment variables or a
secret manager instead.

Common secrets include:

- Database passwords
- Queue or message broker credentials
- Object storage access keys
- API keys for external services
- Solana keypairs or signer URLs (when not using local files)

In Kubernetes, store secrets via `kubectl create secret` or an external
secret provider. In Docker Compose, use `.env` files that are not
committed to version control.

---

## 10. Monitoring and logging

For production safety, you should:

- Collect logs from API, worker, scheduler, and apps.
- Monitor:

  - Request rates and error rates
  - Job queue depth
  - Pipeline failure rates
  - Latency of key endpoints
  - Resource usage (CPU, memory, disk, network)

If the repository includes `infra/monitoring/` with Prometheus and
Grafana configuration, you can use those as a starting point.

Example components:

- `prometheus.yml` — scrape and alert rules
- `grafana-dashboards/unit09-overview.json` — dashboards for:
  - Repositories observed per hour
  - Module generation success rate
  - Worker job throughput

---

## 11. Maintenance and upgrades

### 11.1. Rolling service upgrades

For stateless services such as API and worker:

1. Build new images.
2. Update deployment manifests or service definitions.
3. Use rolling deployments or blue-green strategies.

Ensure backward compatibility when possible, especially if the on-chain
program or IDL has changed.

### 11.2. Database migrations

If you introduce schema changes:

- Use migrations managed by your chosen ORM or migration tool.
- Apply migrations in a step compatible with both old and new services.
- Roll out services after the migration step completes.

Document migrations and rollback strategies.

### 11.3. On-chain upgrades

Program upgrades are high-impact events. Consider:

- Testing thoroughly on a staging cluster.
- Communicating upgrade windows to users.
- Pausing certain operations if needed during upgrade.

Keep `program-id.md` and `Anchor.toml` in sync with the deployed program
ID and cluster.

---

## 12. Troubleshooting

### 12.1. Program deployment errors

- Check the Solana validator or cluster logs.
- Verify the program keypair path in `Anchor.toml` is correct.
- Confirm your wallet has enough SOL to pay for deployment fees.

### 12.2. API cannot connect to Solana

- Ensure the `solana.cluster` URL in your config is reachable.
- Check network access from the container or host.
- Verify commitment levels match your expectations.

### 12.3. Worker jobs stuck or failing

- Inspect job queue status (for example, Redis or your chosen broker).
- Check worker logs for error messages and stack traces.
- Validate that the engine configuration is correct and that the program
  is deployed to the intended cluster.

### 12.4. Dashboard shows no data

- Confirm the API base URL configured in the dashboard matches your
  running API service.
- Test API routes directly with `curl`.
- Ensure that seeding or pipeline runs have populated repositories and
  modules on-chain and in the database.

---

## 13. Summary

A Unit09 deployment consists of:

- A Solana program that acts as the canonical on-chain brain
- A set of services and tools that observe, decompose, and evolve code
- Supporting infrastructure for storage, queues, metrics, and deployment

Start with:

1. Localnet and program deployment
2. Local demo stack via Docker Compose
3. Manual services for debugging
4. Then evolve toward staging and production deployments

Adopt the pieces that fit your use case, and extend or replace others
when needed. Unit09 is designed to be modular, including how you deploy
it.
