# MegaLinter Azure DevOps Extension - AI Coding Agent Instructions

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
```
