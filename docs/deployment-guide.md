# Deployment Guide

This document describes how to deploy Unit09 in different environments,
from local development to production.

## 1. Deployment models

Typical deployment models include:

1. Local development stack (Docker Compose).
2. Shared dev or staging environment (Kubernetes or similar).
3. Production environment with full monitoring and TLS.

## 2. Local development (Docker Compose)

The repository includes a local demo stack under
`examples/unit09-local-demo`.

From that directory:

```bash
docker compose up -d
```

This starts:

- `solana-localnet` — local validator.
- `unit09-api` — API service.
- `unit09-worker` — pipeline worker.
- `unit09-scheduler` — scheduler.

Configuration is driven by environment variables in the compose file and
the scripts.

This setup is ideal for experimenting, running tests, and building against
a predictable environment.

## 3. Kubernetes deployment

For a more robust deployment, you can use the manifests under `infra/k8s`.

### 3.1 Prerequisites

- A Kubernetes cluster (managed or self-hosted).
- A container registry where you push your images.
- kubectl and appropriate credentials.

### 3.2 Build and push images

```bash
docker build -f infra/docker/Dockerfile.api -t your-registry/unit09-api:tag .
docker push your-registry/unit09-api:tag

docker build -f infra/docker/Dockerfile.worker -t your-registry/unit09-worker:tag .
docker push your-registry/unit09-worker:tag

docker build -f infra/docker/Dockerfile.scheduler -t your-registry/unit09-scheduler:tag .
docker push your-registry/unit09-scheduler:tag
```

Then update the `image` fields in the deployment manifests.

### 3.3 Apply manifests

```bash
kubectl apply -f infra/k8s/namespaces.yaml
kubectl apply -f infra/k8s/configmaps
kubectl apply -f infra/k8s/deployments
kubectl apply -f infra/k8s/services
kubectl apply -f infra/k8s/ingress
```

Ensure required secrets (for example, `unit09-config`) are created with
the correct Solana RPC URL and program ID.

### 3.4 TLS and domain names

The sample ingress configuration assumes:

- `api.unit09.org` for the API.
- `dashboard.unit09.org` for the dashboard.

You can change these hosts and manage TLS using your existing ingress
controller and certificate management solution (for example, cert-manager
and Let’s Encrypt).

## 4. Monitoring and alerting

Under `infra/monitoring`, you will find:

- `prometheus.yml` — scrape configuration.
- `grafana-dashboards/unit09-overview.json` — a Grafana dashboard.

If you use the Helm chart in `infra/terraform`, the kube-prometheus-stack
is installed and you can import the dashboard into Grafana.

Key metrics include:

- API request rate and error rate.
- Worker job throughput and failures.
- Scheduler job status.
- Custom Unit09 metrics such as total lines of code observed.

## 5. Scaling

To scale Unit09:

- Increase replicas for the API deployment to handle read-heavy workloads.
- Increase worker replicas to handle more repositories or more frequent
  analysis.
- Ensure your RPC endpoint and Solana program can handle the increased
  write load.

Horizontal scaling is generally preferred over vertical scaling for the
stateless components.

## 6. Upgrading

When upgrading:

1. Build and push new images.
2. Update deployment manifests (image tags).
3. Apply changes using `kubectl apply` or your CD system.
4. Monitor metrics and logs to ensure the new version is healthy.

For the Solana program, upgrades may require:

- New program deployments.
- Data migrations for existing accounts.
- Temporary pauses in pipeline operations.

Always test program upgrades in a dev or staging environment before
touching mainnet deployments.
