# Extension Versioning Strategy

This document explains the versioning strategy used for the MegaLinter Azure DevOps extension.

## Overview

The extension uses an automatic versioning approach:

- **PR builds**: Use 4-component versions (e.g., 1.1.7.29547613) for preview testing
- **Main branch builds**: 
  - Private extension: 4-component version (e.g., 1.1.7.5)
  - Public extension: 3-component version (e.g., 1.1.7)
  - Git tags: 3-component version with v prefix (e.g., v1.1.7)

Each merge to main automatically increments the version and publishes both private and public extensions.

## Versioning Modes

### 1. PR Validation (Private Extensions)

When a pull request is created or updated:

- **Version Format**: `Major.Minor.Patch.EpochMinutes` (4 components)
- **Example**: `1.1.7.29547613`
- **Purpose**: Creates unique preview versions for testing
- **Published**: Private extension only (shared with configured orgs)

The 4th component is **epoch minutes** — the number of minutes since January 1, 1970 UTC (Unix epoch). This provides a monotonically increasing version that always stays within the TFX CLI's version component limit (0-2,147,483,647). Collisions are only possible if multiple PR runs start within the same minute, which is extremely rare in practice.

**Why epoch minutes?**
- Always monotonically increasing (newer builds always have higher version numbers)
- Current value is ~29.5 million, well under the ~2.1 billion maximum
- Provides sufficiently fine granularity for typical PR build frequency (collisions are only possible if multiple runs start within the same minute, which is rare in practice)
- Won't exceed the 32-bit integer limit for thousands of years
- Preferred over `github.run_number` because it is workflow-agnostic and continues to increase even if workflows are renamed or recreated, making it more suitable as a long-term version component

### 2. Main Branch Automatic Builds (Public & Private Extensions)

When code is merged to main (automatic trigger):

#### Private Extension (Internal Testing)
- **Version Format**: `Major.Minor.Patch.CommitsSinceVersion` (4 components)
- **Example**: `1.1.7.5`
- **Purpose**: Preview build with monotonically increasing 4th component

#### Public Extension (Official Release)
- **Version Format**: `Major.Minor.Patch` (3 components)
- **Example**: `1.1.7`
- **Purpose**: Official release version
- **Published**: Azure DevOps Marketplace (public)
- **Tagged**: A git tag (e.g., `v1.1.7`) is created after successful publish

The 4th component for private builds (`GitVersion_CommitsSinceVersionSource`) represents the number of commits since the last version tag, ensuring monotonically increasing versions for internal testing.

Each merge to main automatically increments the patch version and creates both a private preview and a public release.

## Benefits

### Automatic Public Releases

With ContinuousDeployment mode, every commit to main creates a public release:

- Commit 1 → v1.1.7 (public release)
- Commit 2 → v1.1.8 (public release)
- Commit 3 → v1.1.9 (public release)
- **Result**: Every merge to main is immediately available publicly

### Unique Preview Versions

PR builds get unique version numbers using **epoch minutes** (minutes since Unix epoch) as the 4th component:

- No conflicts when publishing to Azure DevOps (monotonically increasing)
- Works correctly with all PR workflows, including stacked PRs
- Clear distinction between PR preview and main release builds
- Always within TFX CLI's 32-bit integer limit (0-2,147,483,647)
- Current value is ~29.5 million, with room to grow for thousands of years

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
2. Calculates epoch minutes as 4th component (e.g., 29547613)
3. Publishes private extension with version 1.1.7.29547613

### Build and Release Workflow

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

**What happens on push to main**:

1. GitVersion increments patch version automatically
2. Builds extension with dual versioning:
   - Private extension: 4-component version (e.g., 1.1.8.5) using `CommitsSinceVersionSource`
   - Public extension: 3-component version (e.g., 1.1.8)
3. Publishes private extension with 4-component version
4. Publishes public extension with 3-component version
5. Creates git tag v1.1.8
6. Creates GitHub release

**What happens on workflow_dispatch**:
Same as push to main - allows manual triggering if needed.

## How Releases Work

Every merge to `main` automatically:

1. Increments the version number
2. Builds the extension with dual versioning:
   - Private: 4-component (e.g., 1.1.8.5)
   - Public: 3-component (e.g., 1.1.8)
3. Publishes private extension (4-component version for internal testing)
4. Publishes public extension (3-component version for production)
5. Creates a git tag (3-component with v prefix, e.g., v1.1.8)
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

### TFX CLI Version Component Limits

**Each version component must be in the range 0 to 2,147,483,647** (32-bit signed integer maximum).

- ✅ Valid: `1.0.0`, `1.0.0.123`, `1.2.3.29547613`
- ❌ Invalid: `1.0.0.202602082217` (timestamp format exceeds 2,147,483,647)

This is why PR builds use **epoch minutes** (minutes since Unix epoch) rather than timestamp formats like `YYYYMMDDHHMM`. Epoch minutes are currently ~29.5 million and won't exceed the 32-bit limit for thousands of years.

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

- **Extension version** (in vss-extension.json): Tracks the marketplace package (e.g., 1.1.7.29547613 for previews, 1.1.7 for releases)
- **Task version** (in task.json): What users reference in pipelines (e.g., `MegaLinter@1` always uses major version 1)

This implementation uses:

- Preview builds: Extension version `1.1.7.29547613`, Task version `1.1.7`
- Release builds: Extension version `1.1.7`, Task version `1.1.7`

The 4th component in preview extension versions allows unique builds without affecting the task's major version that users reference.

## Troubleshooting

### Preview builds not incrementing

Check that epoch minutes calculation is working correctly in the workflow. Each PR build should get a unique, monotonically increasing build number based on the current time (minutes since Unix epoch).

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
