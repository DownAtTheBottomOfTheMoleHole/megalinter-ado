# MegaLinter Azure DevOps Extension - AI Coding Agent Instructions

## Project Overview

This is an Azure DevOps pipeline extension (task) that wraps the `mega-linter-runner` npm package. It allows users to run Ox Security MegaLinter in Azure DevOps pipelines with a simplified UI-based configuration.

**Core architecture:**

- Main task implementation: [megalinter/megalinter.ts](../megalinter/megalinter.ts)
- Azure DevOps task definition: [megalinter/task.json](../megalinter/task.json)
- Extension manifest: [vss-extension.json](../vss-extension.json)

## Key Conventions

### Token Replacement System

The project uses token replacement (`#{ }#`) for secrets and configuration values:

- Tokens in `task.json` and `vss-extension.json` are replaced at build time via GitHub Actions
- Tokens are replaced using `cschleiden/replace-tokens` action
- All secrets (task IDs, publisher info, etc.) are stored in GitHub Secrets, not in code
- **Never hardcode** task IDs, publisher IDs, or similar values—use tokens

### TypeScript Build Pattern

- Source: `megalinter/megalinter.ts`
- Compiled output: `megalinter/megalinter.js`
- The `.js` file is the execution target referenced in `task.json`
- **Always compile TypeScript before testing**: `npm run build` or `tsc` in the `megalinter/` directory
- The task entry point must be `megalinter.js` (not `.ts`)

### Package Management

The project uses a unified npm dependency management system:

1. **Root `package.json`**: Contains all dependencies (both runtime and development)
   - Runtime dependencies: `azure-pipelines-task-lib`, `mega-linter-runner`
   - Development dependencies: Testing frameworks, linters, TypeScript, etc.

2. **`megalinter/package.json`**: Defines task metadata and dependencies for the Azure DevOps extension
   - **Must be kept**: Required by Azure DevOps for Node.js-based tasks
   - Contains the same runtime dependencies as root package.json
   - No package-lock.json (only root has package-lock.json)

3. **Build process**:
   - Development: Run `npm install` at root to install all dependencies
   - CI/CD: Run `npm install` at root, then `npm install --production` in megalinter before packaging
   - The megalinter/package-lock.json is removed to maintain single lock file at root

When adding dependencies:

- Add to **root** `package.json` for development
- Add to **megalinter** `package.json` if it's a runtime dependency needed by the task

## Development Workflows

### Building

```bash
cd megalinter
npm run build  # Compiles megalinter.ts → megalinter.js
```

### Testing

```bash
npm test  # Runs Cucumber BDD tests (from root)
npm run lint  # Lints all files
npm run format  # Formats with Prettier
```

Tests are written using Cucumber/BDD:

- Feature files: `megalinter/features/*.feature`
- Step definitions: `megalinter/features/step_definitions/*.ts`

### Pre-commit Hooks

The project uses extensive pre-commit hooks (`.pre-commit-config.yaml`):

- File validation (JSON, YAML, large files)
- Secret detection (detect-secrets hook)
- Line ending normalization
- CSpell, Prettier, MegaLinter incremental checks

Run `pre-commit run --all-files` before committing to catch issues early.

### Release Process

Releases are managed via GitHub Actions ([.github/workflows/build_and_release.yml](../.github/workflows/build_and_release.yml)):

1. GitVersion calculates version from git history
2. Tokens in `task.json` and `vss-extension.json` are replaced
3. Extension is packaged as `.vsix`
4. Published to Azure DevOps marketplace (requires manual workflow dispatch)

**Never manually bump versions**—GitVersion handles this based on commit history.

## Azure Pipelines Task Library Integration

The task uses `azure-pipelines-task-lib` (imported as `tl`):

- `tl.getInput(name)`: Retrieves string input from task.json
- `tl.getBoolInput(name)`: Retrieves boolean input
- `tl.execSync(command, args)`: Executes shell commands synchronously
- `tl.setResult(result, message)`: Sets task success/failure status

### Input Parameter Mapping

Task parameters in `task.json` map to the `mega-linter-runner` CLI arguments:

- Boolean inputs (e.g., `fix`, `help`) → `--fix`, `--help` flags
- String inputs (e.g., `flavor`, `release`) → `--flavor value`, `--release value`
- `runnerVersion`: determines npx package version (e.g., `mega-linter-runner@8.0.0`), not passed as CLI arg
- `flavor` + `release`: combined to build Docker image name (e.g., `oxsecurity/megalinter-javascript:v8`)

**Input name convention**: Use camelCase in `task.json` (e.g., `containerName`), map to kebab-case CLI args (e.g., `--container-name`)

## Docker Optimization Pattern

The task **pre-checks** for Docker images before pulling, and optionally supports **built-in caching** via `docker save` / `docker load`:

### Image Detection

```typescript
const dockerImageCheck = tl.execSync("docker", [
  "images",
  "-q",
  dockerImageName,
]);
if (dockerImageCheck.stdout && dockerImageCheck.stdout.trim()) {
  console.log(
    `Docker image '${dockerImageName}' found in cache. Skipping pull.`,
  );
}
```

This avoids unnecessary pulls when the image is already cached. Preserve this pattern when modifying Docker-related code.

### Built-in Docker Image Caching

When `cacheDockerImage` is enabled:

1. **Before pull**: If a tarball exists at `<dockerCachePath>/megalinter-<flavor>-<release>.tar` (for example, `megalinter-security-v9.tar`), the task runs `docker load -i` to restore it
2. **Image check**: If the image is already present (loaded from cache or Docker daemon cache), pull is skipped
3. **After pull**: If the image was freshly pulled, the task runs `docker save -o` to persist the same flavor+release-specific tarball for future runs

Cache failures (load or save) are **non-fatal** — they log warnings but do not fail the task. The `imageWasPulled` flag tracks whether a fresh pull occurred to avoid unnecessary saves.

Pair with Azure Pipelines `Cache@2` task to persist the tarball between pipeline runs.

## Caching for Pipeline Consumers

The extension supports Docker image caching for faster pipeline runs via the `cacheDockerImage` task input.

### Self-Hosted Agents (Recommended)

Docker images persist between runs automatically. The task checks for cached images before pulling — no additional caching configuration needed.

### Microsoft-Hosted Agents with Built-in Caching

Enable `cacheDockerImage: true` and add a `Cache@2` task to persist the tarball between runs:

```yaml
variables:
  MEGALINTER_IMAGE: oxsecurity/megalinter-javascript:v8

steps:
  # Cache Docker images using Pipeline Caching
  - task: Cache@2
    displayName: Cache Docker images
    inputs:
      key: 'docker | "$(Agent.OS)" | "$(MEGALINTER_IMAGE)"'
      path: $(Pipeline.Workspace)/docker-cache

  # Run MegaLinter — built-in caching handles docker load/save automatically
  - task: MegaLinter@1
    inputs:
      flavor: javascript
      release: v8
      cacheDockerImage: true
```

The task automatically:
1. Loads `$(Pipeline.Workspace)/docker-cache/megalinter.tar` if it exists
2. Skips `docker pull` when the image is already available
3. Saves the image to the tarball after a fresh pull

No manual `docker load` / `docker save` scripts are required.

## Common Gotchas

1. **Compiled JavaScript is committed**: The `megalinter.js` file is tracked in git and must be rebuilt before committing TypeScript changes
2. **Task ID must be unique**: Each task has a GUID (`task_id` token) that must remain stable—changing it breaks existing pipelines
3. **Node version pinning**: The project specifies exact Node.js and npm versions in `package.json` engines—use these for consistency
4. **Arguments array construction**: The `args` array is dynamically built based on input params—maintain this pattern for new inputs

## External Dependencies

- **mega-linter-runner**: NPM package that wraps MegaLinter Docker execution
- **azure-pipelines-task-lib**: Microsoft's library for building ADO tasks
- **Docker**: Required at runtime to pull and execute MegaLinter containers

## Testing Locally

To test the task locally without publishing:

1. Compile TypeScript: `cd megalinter && npm run build`
2. Mock Azure Pipelines inputs by setting environment variables (e.g., `INPUT_FLAVOR=javascript`)
3. Run: `node megalinter/megalinter.js`

Note: Local testing requires Docker and appropriate Azure Pipelines environment variables set.
