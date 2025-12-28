# CLI Usage

The Unit09 CLI provides a convenient way to interact with the system from
a terminal. It wraps common API operations and adds developer-friendly
shortcuts.

Once installed (see `installation.md`), the CLI is available as the
`unit09` command.

## 1. Global options

```bash
unit09 --help
unit09 --version
```

Environment variables used by the CLI:

- `UNIT09_API_BASE_URL` — base URL of the Unit09 API, for example
  `http://localhost:8080/api`.

You can also pass `--api` to override the base URL per command.

## 2. Commands

### 2.1 init

Initialize local configuration for the CLI.

```bash
unit09 init
```

Typical tasks include:

- Storing the default API base URL.
- Selecting the target Solana cluster.
- Optionally saving a profile file.

### 2.2 config

Get or set configuration values.

```bash
unit09 config get apiBaseUrl
unit09 config set apiBaseUrl https://api.unit09.org/api
```

### 2.3 link-repo

Register a repository with Unit09.

```bash
unit09 link-repo https://github.com/your-org/your-project
```

Options may include:

- `--key` — explicit repository key.
- `--provider` — override provider detection.

### 2.4 run-pipeline

Trigger the pipeline for a repository.

```bash
unit09 run-pipeline demo-anchor-note
```

Options:

- `--mode full|minimal` — control which stages run.
- `--fork <id>` — run under a specific fork configuration.

### 2.5 list-modules

List modules known to Unit09.

```bash
unit09 list-modules --repo demo-anchor-note
```

Additional filters:

- `--status ready`
- `--language rust`

### 2.6 deploy-module

Deploy a selected module as a standalone artifact.

```bash
unit09 deploy-module note-core
```

The exact behavior depends on how you wire the deployment pipeline. In
many setups, this will:

- Pull module artifacts into a target repository.
- Optionally run build and deployment scripts.

### 2.7 create-fork

Create a new Unit09 fork.

```bash
unit09 create-fork team-alpha-style
```

You can attach configuration or prompts using flags or configuration
files.

### 2.8 show-stats

Display global stats for the current Unit09 instance.

```bash
unit09 show-stats
```

## 3. Typical workflows

### Register and analyze a project

```bash
unit09 link-repo https://github.com/your-org/anchor-project --key my-anchor
unit09 run-pipeline my-anchor
unit09 list-modules --repo my-anchor
```

### Create a personal fork

```bash
unit09 create-fork my-style
unit09 run-pipeline my-anchor --fork my-style
```

## 4. Extensibility

The CLI is just a thin wrapper around the API and SDK. You can:

- Add subcommands for custom flows.
- Script around the CLI using shell scripts or task runners.
- Embed the SDK directly into your own tools for more control.
