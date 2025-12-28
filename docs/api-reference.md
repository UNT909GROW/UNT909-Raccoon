# API Reference

This document describes the HTTP API exposed by the Unit09 API service.

All endpoints are prefixed with `/api`. The base URL depends on your
deployment, for example:

- `http://localhost:8080/api` for local development.
- `https://api.unit09.org/api` for production.

Unless otherwise noted, all responses are JSON.

## 1. Health

### GET /api/health

Returns a basic health status for the API and its dependencies.

**Response:**

```json
{
  "status": "ok",
  "version": "0.1.0",
  "uptimeSeconds": 12345
}
```

## 2. Repositories

### GET /api/repos

List repositories tracked by Unit09.

Query parameters:

- `limit` (optional)
- `cursor` (optional)

### GET /api/repos/:key

Get details for a single repository by key.

### POST /api/repos

Register a new repository.

Request body example:

```json
{
  "key": "demo-anchor-note",
  "name": "Simple Anchor Note",
  "url": "https://github.com/unit09-labs/simple-anchor-note",
  "provider": "github",
  "tags": ["anchor", "example"]
}
```

### PATCH /api/repos/:key

Update metadata for a repository (for example, status or tags).

## 3. Modules

### GET /api/modules

List modules across all repositories.

Common query parameters:

- `repoKey` — filter by repository key.
- `status` — filter by status.
- `language` — filter by language.

### GET /api/repos/:key/modules

List modules for a specific repository.

### GET /api/modules/:id

Get details for a single module.

## 4. Forks

### GET /api/forks

List forks.

### POST /api/forks

Create a fork.

Request body example:

```json
{
  "label": "team-alpha-style",
  "configHash": "0xabc123..."
}
```

### PATCH /api/forks/:id

Update fork metadata or status.

## 5. Pipeline

### POST /api/pipeline/jobs

Trigger a pipeline job.

Request body example:

```json
{
  "repo": { "key": "demo-anchor-note" },
  "mode": "full"
}
```

Response example:

```json
{
  "jobId": "job_12345",
  "status": "queued"
}
```

### GET /api/pipeline/jobs/:jobId

Get job status and logs for a pipeline run.

## 6. Stats

### GET /api/stats

Return global metrics for the Unit09 instance.

Example response:

```json
{
  "totalRepos": 12,
  "totalModules": 48,
  "totalForks": 3,
  "totalLinesObserved": 3200000
}
```

### GET /api/repos/:key/stats

Return metrics for a specific repository.

## 7. Error format

Errors are returned with an HTTP status code and a JSON body, for example:

```json
{
  "error": {
    "code": "RepoNotFound",
    "message": "Repository with key 'demo' not found"
  }
}
```

The exact set of error codes depends on your implementation, but the goal
is to keep them stable enough for clients to rely on.
