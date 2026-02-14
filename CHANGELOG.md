# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- PR comment reporter for Azure DevOps pull requests
- Auto-fix PR creation when `fix: true` and `createFixPR: true`
- Lint only changed files in PRs/commits via `lintChangedFilesOnly` input (sets `VALIDATE_ALL_CODEBASE=false`)
- Streaming output for real-time linting feedback
- Configuration file support (`configFile` input)
- Reports output path configuration (`reportsPath` input)
- Disable specific linters via `disableLinters` input
- Lint only changed files in PRs/commits via `lintChangedFilesOnly` input (sets `VALIDATE_ALL_CODEBASE=false`)

### Changed

- Updated MegaLinter default version to v9
- Improved error handling and exit code reporting
- Better documentation with configuration examples

### Fixed

- Resolved npm audit vulnerabilities (tar, lodash-es, diff)
- Updated ts-node from v1.7.3 to v10.9.2
- License consistency (now GPL-3.0 across all package.json files)

### Security

- Updated all dependencies to resolve known vulnerabilities
- Proper secrets handling via GitHub Secrets and Azure DevOps variable groups

## [1.0.0] - Initial Release

### Added

- Initial MegaLinter Azure DevOps extension
- Support for all MegaLinter flavors
- Docker-based execution via mega-linter-runner
- Basic task inputs for common MegaLinter options
- Pre-commit hooks for code quality
- Comprehensive documentation

---

For more details, see the [commit history](https://github.com/DownAtTheBottomOfTheMoleHole/megalinter-ado/commits/main).
