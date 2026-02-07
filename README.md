# MegaLinter Azure DevOps Extension

[![Visual Studio Marketplace](https://img.shields.io/badge/Marketplace-MegaLinter-blue?logo=azure-devops)](https://marketplace.visualstudio.com/items?itemName=DownAtTheBottomOfTheMoleHole.megalinter-ado)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-blue.svg)](LICENSE.md)
[![MegaLinter](https://img.shields.io/badge/MegaLinter-v9-success)](https://megalinter.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-green)](https://nodejs.org/)

> **Note:** This is not an official MegaLinter extension. However, it has been reviewed and approved by the [MegaLinter](https://megalinter.io) project.

Run [Ox Security MegaLinter](https://megalinter.io) in your Azure DevOps pipelines. Analyze 50+ languages, apply auto-fixes, and get PR comments—all with a simple task configuration.

## Installation

1. Install from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=DownAtTheBottomOfTheMoleHole.megalinter-ado)
2. Add the task to your pipeline

## Quick Start

```yaml
- task: MegaLinter@1
  displayName: Run MegaLinter
  inputs:
    flavor: all
    fix: true
    createFixPR: true
  env:
    SYSTEM_ACCESSTOKEN: $(System.AccessToken)
```

## Visual Configuration

Configure MegaLinter using the Azure DevOps task assistant:

<!-- TODO: Add screenshot of task configuration UI -->

![Task Configuration](.assets/screenshot.png)

## Task Inputs

| Input              | Description                                                 | Default              |
| ------------------ | ----------------------------------------------------------- | -------------------- |
| `flavor`           | MegaLinter flavor (all, javascript, python, security, etc.) | `all`                |
| `release`          | Docker image tag (v9, latest, etc.)                         | `v9`                 |
| `fix`              | Auto-fix issues                                             | `false`              |
| `enablePRComments` | Post results as PR comments (auto-enabled for PR builds)    | `false`              |
| `createFixPR`      | Create PR with fixes (when fix=true)                        | `true`               |
| `path`             | Directory to lint                                           | Pipeline workspace   |
| `configFile`       | Path to .mega-linter.yml                                    | Auto-detected        |
| `reportsPath`      | Reports output directory                                    | `megalinter-reports` |
| `disableLinters`   | Comma-separated linters to disable                          | -                    |

See [all available inputs](https://megalinter.io/latest/configuration/) for the complete list.

## Flavors

| Flavor       | Languages                     |
| ------------ | ----------------------------- |
| `all`        | Everything (largest image)    |
| `javascript` | JS, TS, JSON, CSS, HTML       |
| `python`     | Python, YAML, JSON            |
| `dotnet`     | C#, VB.NET, PowerShell        |
| `security`   | Security-focused linters only |
| `terraform`  | Terraform, HCL                |

[View all flavors](https://megalinter.io/latest/flavors/)

## Full Pipeline Example

This example shows all available options with Docker caching for faster runs:

```yaml
# .azuredevops/megalinter.yml
trigger: none
pr: none

pool:
  vmImage: ubuntu-latest

variables:
  MEGALINTER_IMAGE: oxsecurity/megalinter-security:v9

stages:
  - stage: Lint
    jobs:
      - job: MegaLinter
        steps:
          - checkout: self
            fetchDepth: 0

          # Cache Docker images for faster runs
          - task: Cache@2
            displayName: Cache Docker images
            inputs:
              key: 'docker | "$(Agent.OS)" | "$(MEGALINTER_IMAGE)"'
              path: $(Pipeline.Workspace)/docker-cache

          - script: |
              if [ -f "$(Pipeline.Workspace)/docker-cache/megalinter.tar" ]; then
                docker load -i $(Pipeline.Workspace)/docker-cache/megalinter.tar
              fi
            displayName: Load cached Docker image

          # Run MegaLinter
          - task: MegaLinter@1
            displayName: Run MegaLinter
            inputs:
              path: $(Build.SourcesDirectory)
              flavor: security
              release: v9
              fix: true
              removeContainer: true
              enablePRComments: true
              createFixPR: true
            env:
              SYSTEM_ACCESSTOKEN: $(System.AccessToken)

          # Save Docker image to cache
          - script: |
              mkdir -p $(Pipeline.Workspace)/docker-cache
              docker save $(MEGALINTER_IMAGE) -o $(Pipeline.Workspace)/docker-cache/megalinter.tar
            displayName: Save Docker image to cache
            condition: succeededOrFailed()

          # Publish reports
          - task: PublishBuildArtifacts@1
            displayName: Publish MegaLinter Reports
            condition: succeededOrFailed()
            inputs:
              pathToPublish: $(Build.SourcesDirectory)/megalinter-reports
              artifactName: megalinter-reports
```

## Permissions

For PR comments and auto-fix PRs, grant the build service:

1. **Contribute to pull requests** - For PR comments
2. **Create branch** - For auto-fix PR creation

## Configuration

Create a `.mega-linter.yml` in your repository root:

```yaml
APPLY_FIXES: all
DISABLE_LINTERS:
  - SPELL_CSPELL
SHOW_ELAPSED_TIME: true
```

[Full configuration options](https://megalinter.io/latest/configuration/)

## Resources

- [MegaLinter Documentation](https://megalinter.io)
- [Configuration Guide](https://megalinter.io/latest/configuration/)
- [Available Flavors](https://megalinter.io/latest/flavors/)
- [GitHub Repository](https://github.com/DownAtTheBottomOfTheMoleHole/megalinter-ado)

## Development

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Setup

```bash
npm install
cd megalinter && npm install
```

### Build & Test

```bash
# Build the Azure DevOps task (TypeScript → JavaScript)
cd megalinter
npm run build

# Run the Cucumber BDD tests and linting from the repo root
cd ..
npx cucumber-js
npm run lint
```

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[GPL-3.0](LICENSE.md)
