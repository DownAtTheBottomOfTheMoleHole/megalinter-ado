# Extension Versioning Strategy

This document explains the versioning strategy used for the MegaLinter Azure DevOps extension.

## Overview

The extension uses a dual versioning approach to balance the need for unique versions in development while preventing gaps in published release versions.

## Versioning Modes

### 1. PR Validation (Private Extensions)

When a pull request is created or updated:
- **Version Format**: `Major.Minor.Patch.RunNumber` (4 components)
- **Example**: `1.1.7.123`
- **Purpose**: Creates unique preview versions for testing
- **Published**: Private extension only (shared with configured orgs)

The 4th component (RunNumber) ensures each PR build gets a unique version without consuming official version numbers.

### 2. Main Branch Automatic Builds (Private Extensions)

When code is merged to main (automatic trigger):
- **Version Format**: `Major.Minor.Patch.RunNumber` (4 components)
- **Example**: `1.1.7.456`
- **Purpose**: Creates preview versions for internal testing
- **Published**: Private extension only

These builds are for validation before deciding to create a public release.

### 3. Public Releases (Manual)

When a public release is triggered manually via `workflow_dispatch`:
- **Version Format**: `Major.Minor.Patch` (3 components)
- **Example**: `1.1.7`
- **Purpose**: Stable, official release version
- **Published**: Public extension on Azure DevOps Marketplace
- **Tagged**: A git tag (e.g., `v1.1.7`) is created after successful publish

## Benefits

### No Version Gaps

With the previous ContinuousDeployment mode, every commit to main would increment the patch version:
- Commit 1: v1.1.7
- Commit 2: v1.1.8
- Commit 3: v1.1.9
- Public Release: v1.1.9 (gaps: 1.1.7, 1.1.8 never publicly released)

With the new ContinuousDelivery mode:
- All commits before tagging: v1.1.7.X (preview builds)
- First public release: v1.1.7 (tagged)
- Future commits: v1.1.8.X (preview builds)
- Second public release: v1.1.8 (tagged)
- **Result**: No gaps in public version numbers!

### Unique Preview Versions

Each workflow run gets a unique version number using the GitHub run number as the 4th component. This ensures:
- No conflicts when publishing to Azure DevOps
- Clear distinction between preview and release builds
- Easy identification of which CI run produced a build

## GitVersion Configuration

The project uses GitVersion in **ContinuousDelivery** mode:

```yaml
mode: ContinuousDelivery
branches:
  main:
    mode: ContinuousDelivery
    is-release-branch: true
```

### Key Settings

- `mode: ContinuousDelivery`: Versions only increment when tags are created
- `is-release-branch: true`: Marks main as a release branch
- `continuous-delivery-fallback-tag: ci`: Fallback tag for pre-release builds

## Workflow Triggers

### PR Validation Workflow

```yaml
on:
  pull_request:
    branches: [main, dev]
```

**What happens**:
1. GitVersion determines base version (e.g., 1.1.7)
2. Adds GitHub run number as 4th component
3. Publishes private extension with version 1.1.7.{run_number}

### Build and Release Workflow

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

**What happens on push**:
1. GitVersion determines base version
2. Adds GitHub run number as 4th component
3. Publishes private extension with version 1.1.7.{run_number}
4. Skips public release

**What happens on workflow_dispatch**:
1. GitVersion determines base version
2. Uses 3-component version (e.g., 1.1.7)
3. Publishes private extension with version 1.1.7
4. Publishes public extension with version 1.1.7
5. Creates git tag v1.1.7
6. Creates GitHub release

## How to Create a Release

1. Ensure all desired changes are merged to `main`
2. Go to GitHub Actions
3. Select "Build and release extension" workflow
4. Click "Run workflow" → "Run workflow" (manual trigger)
5. Wait for the workflow to complete
6. Verify the public extension is published
7. Check that a new git tag and GitHub release were created

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

This would increment from v1.1.7 to v1.2.0 on the next tagged release.

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

Ensure you're using `workflow_dispatch` trigger, not automatic push to main. The workflow checks the event type to determine which version format to use.

### Version doesn't increment after tagging

Make sure your commit message includes a conventional commit prefix (`feat:`, `fix:`, or `+semver:`) that triggers a version bump.

### Git tag not created

The tag is only created in the `new_release` job, which only runs after a successful public release. Check the workflow logs for the `public_release` job status.

## References

- [GitVersion Documentation](https://gitversion.net/docs/)
- [Azure DevOps Extension Manifest Reference](https://learn.microsoft.com/en-us/azure/devops/extend/develop/manifest)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
