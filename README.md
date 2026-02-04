# MegaLinter Azure DevOps Extension

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-blue.svg)](LICENSE.md)
[![MegaLinter](https://img.shields.io/badge/MegaLinter-v9-success)](https://megalinter.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-green)](https://nodejs.org/)

Easily run [Ox Security MegaLinter](https://megalinter.io/latest/) in your Azure DevOps pipelines with a simple, UI-driven task.

## Features
- One-click code quality for 50+ languages and formats
- PR comment reporting and auto-fix PRs (with permissions)
- Docker image caching for fast CI
- All MegaLinter options exposed as task inputs

## Quick Start
```yaml
- task: MegaLinter@1
  displayName: Run MegaLinter
  inputs:
    flavor: all         # or security, javascript, etc.
    fix: true           # auto-fix issues (optional)
    createFixPR: true   # create PR with fixes (requires permissions)
  env:
    SYSTEM_ACCESSTOKEN: $(System.AccessToken)
```

## Pull Request Integration
- **PR Comments:** Auto-enabled for PR builds, or set `enablePRComments: true`.
- **Auto-Fix PRs:** Set `fix: true` and `createFixPR: true` to open a PR with fixes.
- **Permissions Required:** See [Required Permissions](#required-permissions) below.

## Documentation
- [Configuration Guide](docs/CONFIGURATION.md)
- [Flavors Reference](docs/FLAVORS.md)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

## Required Permissions
To use PR comments or auto-fix PRs, your pipeline must:
- Pass `SYSTEM_ACCESSTOKEN` to the task
- Use `persistCredentials: true` on checkout
- Grant the Build Service account these repo permissions: **Contribute**, **Contribute to pull requests**, **Create branch**

See the [full permissions guide](docs/CONFIGURATION.md#required-permissions).

---

## Built With
- [TypeScript](https://www.typescriptlang.org/)
- [MegaLinter](https://megalinter.io/latest/)
- [azure-pipelines-task-lib](https://www.npmjs.com/package/azure-pipelines-task-lib)
- [Prettier](https://prettier.io/)
- [pre-commit](https://pre-commit.com/)
- [CSpell](https://cspell.org/)
- [GitVersion](https://gitversion.net/)

## Pre-commit Hooks
This repo uses [pre-commit](https://pre-commit.com/) for code quality and consistency:
- JSON/YAML validation
- Secret detection
- Line ending normalization
- CSpell, Prettier, MegaLinter incremental checks

See `.pre-commit-config.yaml` for the full list.

## Roadmap
- [x] Basic extension skeleton
- [x] Streaming output and Docker caching
- [x] PR comment and auto-fix PR features
- [x] Documentation and permission guidance
- [ ] More flavors and config options
- [ ] Improved test coverage
- [ ] Marketplace publishing automation
- [ ] Community feedback and enhancements

See [CHANGELOG.md](CHANGELOG.md) and [issues](https://github.com/DownAtTheBottomOfTheMoleHole/megalinter_ado_extension/issues) for details.

## Acknowledgements
- MegaLinter is an [Ox Security](https://ox.security/) project. This extension is **unofficial** but built with permission from Ox Security.
- Thanks to the MegaLinter and Azure DevOps communities for inspiration and support.

## Contributors
Made with ❤️ by [@RolfMoleman](https://github.com/RolfMoleman)

## License
GPL-3.0. See [LICENSE.md](LICENSE.md).
