# Extension Versioning Strategy

This document explains the versioning strategy used for the MegaLinter Azure DevOps extension.

## Overview

The extension uses an automatic versioning approach:

- **PR builds**: Use 4-component versions (e.g., 1.1.7.123) for preview testing
- **Main branch builds**: Use 3-component versions (e.g., 1.1.7) for official releases

Each merge to main automatically increments the version and publishes both private and public extensions.

## Versioning Modes

### 1. PR Validation (Private Extensions)

When a pull request is created or updated:

- **Version Format**: `Major.Minor.Patch.Timestamp` (4 components)
- **Example**: `1.1.7.202602082130`
- **Purpose**: Creates unique preview versions for testing
- **Published**: Private extension only (shared with configured orgs)

The 4th component (Timestamp in YYYYMMDDHHMM format) ensures each PR build gets a unique, monotonically increasing version without conflicts in stacked PRs.

### 2. Main Branch Automatic Builds (Public & Private Extensions)

When code is merged to main (automatic trigger):

- **Version Format**: `Major.Minor.Patch` (3 components)
- **Example**: `1.1.7`
- **Purpose**: Official release version
- **Published**: Both private AND public extensions on Azure DevOps Marketplace
- **Tagged**: A git tag (e.g., `v1.1.7`) is created after successful publish

Each merge to main automatically increments the patch version and creates a public release.

## Benefits

### Automatic Public Releases

With ContinuousDeployment mode, every commit to main creates a public release:

- Commit 1 → v1.1.7 (public release)
- Commit 2 → v1.1.8 (public release)
- Commit 3 → v1.1.9 (public release)
- **Result**: Every merge to main is immediately available publicly

### Unique Preview Versions

PR builds get unique version numbers using a timestamp as the 4th component:

- No conflicts when publishing to Azure DevOps (monotonically increasing)
- Works correctly with stacked PRs (no version rollback issues)
- Clear distinction between PR preview and main release builds
- Timestamp format (YYYYMMDDHHMM) ensures versions always increase

## GitVersion Configuration

The project uses GitVersion in **ContinuousDeployment** mode:

```yaml
mode: ContinuousDeployment
branches:
  main:
    mode: ContinuousDeployment
    is-release-branch: false
```

### Key Settings

- `mode: ContinuousDeployment`: Versions increment with each commit to main
- `is-release-branch: false`: Standard deployment branch
- Versions are tagged after successful public release

## Workflow Triggers

### PR Validation Workflow

```yaml
on:
  pull_request:
    branches: [main, dev]
```

**What happens**:

1. GitVersion determines base version (e.g., 1.1.7)
2. Adds timestamp as 4th component (e.g., 202602082130)
3. Publishes private extension with version 1.1.7.{timestamp}

### Build and Release Workflow

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

**What happens on push to main**:

1. GitVersion increments patch version automatically
2. Builds with 3-component version (e.g., 1.1.8)
3. Publishes private extension with version 1.1.8
4. Publishes public extension with version 1.1.8
5. Creates git tag v1.1.8
6. Creates GitHub release

**What happens on workflow_dispatch**:
Same as push to main - allows manual triggering if needed.

## How Releases Work

Every merge to `main` automatically:

1. Increments the version number
2. Builds the extension
3. Publishes to the private marketplace (for testing)
4. Publishes to the public marketplace
5. Creates a git tag
6. Creates a GitHub release

No manual intervention required!

## Version Incrementing

Versions increment based on commit messages (Conventional Commits):

- `+semver: major` or `BREAKING CHANGE:` → Increments major version
- `+semver: minor` or `feat:` → Increments minor version
- `fix:` → Increments patch version
- `+semver: none` → No version increment

Example:

```
feat: Add new Docker caching feature

+semver: minor
```

This would increment from v1.1.7 to v1.2.0 on the next merge to main.

## Azure DevOps Version Constraints

Azure DevOps has different version requirements for different components:

### Extension Manifest (vss-extension.json)

✅ **Supported**:

- `1.0.0` (3 components)
- `1.0.0.1` (4 components) - **Used for preview builds**

❌ **Not Supported**:

- `1.0.0-beta` (pre-release tags)
- `1.0.0-rc.1` (pre-release with metadata)

### Task Definition (task.json)

✅ **Only Supports**:

- `Major`, `Minor`, `Patch` (3 components only)

❌ **Not Supported**:

- 4th component (build number)
- Pre-release tags

### Why This Matters

**It is normal and expected** for the extension version and task version to differ:

- **Extension version** (in vss-extension.json): Tracks the marketplace package (e.g., 1.1.7.123 for previews, 1.1.7 for releases)
- **Task version** (in task.json): What users reference in pipelines (e.g., `MegaLinter@1` always uses major version 1)

This implementation uses:

- Preview builds: Extension version `1.1.7.123`, Task version `1.1.7`
- Release builds: Extension version `1.1.7`, Task version `1.1.7`

The 4th component in preview extension versions allows unique builds without affecting the task's major version that users reference.

## Troubleshooting

### Preview builds not incrementing

Check that `github.run_number` is being used correctly in the workflow. Each GitHub Actions run gets a unique run number that auto-increments.

### Public release has wrong version

Public releases are created automatically on `push` to the `main` branch. Verify that your changes were merged into `main` and that the corresponding `build_and_release.yml` run completed successfully. You can also use the `workflow_dispatch` trigger from the Actions tab to manually rerun the release workflow if needed, but it uses the same versioning logic as the automatic `push` trigger.

### Version doesn't increment after tagging

Make sure your commit message includes a conventional commit prefix (`feat:`, `fix:`, or `+semver:`) that triggers a version bump.

### Git tag not created

The tag is only created in the `new_release` job, which only runs after a successful public release. Check the workflow logs for the `public_release` job status.

## References

- [GitVersion Documentation](https://gitversion.net/docs/)
- [Azure DevOps Extension Manifest Reference](https://learn.microsoft.com/en-us/azure/devops/extend/develop/manifest)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
