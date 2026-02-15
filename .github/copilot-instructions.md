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
