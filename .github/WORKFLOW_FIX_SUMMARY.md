# GitHub Actions Workflow Fixes Summary

## Issues Identified

### Issue 1: Version Numbering Error

**Problem:**
```
error: Version number must increase each time an extension is published.
Extension: ***.***  Current version: 1.0.4  Updated version: 1.0.4
```

**Root Cause:**
- The workflow was creating git tags in the `build` job after publishing the *private* extension
- If the public extension publish failed later in the workflow, the tag remained but the version wasn't actually released
- This created a situation where v1.0.4 was published to the marketplace but never tagged
- Subsequent runs would calculate v1.0.4 again (based on v1.0.3 being the latest tag), causing a conflict with the already-published version

**Solution:**
- Removed the tag creation step from the `build` job
- Tags should only be created in the `new_release` job, which runs AFTER successful public release
- This ensures versions are only tagged when successfully published
- The `new_release` job already uses `mathieudutour/github-tag-action` for tagging

### Issue 2: Pull Request Creation Permission Error

**Problem:**
```
##[error]GitHub Actions is not permitted to create or approve pull requests.
https://docs.github.com/rest/pulls/pulls#create-a-pull-request
```

**Root Cause:**
- The workflow used `token: ${{ secrets.PAT || secrets.GITHUB_TOKEN }}`
- When `secrets.PAT` is not available, it falls back to `GITHUB_TOKEN`
- GitHub has a security policy that prevents workflows using `GITHUB_TOKEN` from creating pull requests
- This is intentional to prevent recursive workflow triggers

**Solution:**
- Added a preliminary step to check if PAT is available
- Only attempt PR creation if PAT is configured
- Display a helpful warning message when PAT is not available
- This allows the workflow to complete successfully even without PAT, while still enabling automatic PR creation when properly configured

## Configuration Required

To enable automatic PR creation for MegaLinter fixes, configure a Personal Access Token (PAT) as a repository secret:

1. Create a PAT with `repo` permissions at https://github.com/settings/tokens
2. Add it as a repository secret named `PAT` at: https://github.com/DownAtTheBottomOfTheMoleHole/megalinter-ado/settings/secrets/actions
3. Future workflow runs will automatically create PRs for linting fixes

## Timeline of Events

1. **Initial Issue**: v1.0.4 was published but tag creation failed/was skipped
2. **Failed Runs**: Multiple runs attempted to publish v1.0.4 again, causing version conflicts
3. **Manual Intervention**: GitVersion.yml was updated to set `next-version: 1.0.5`
4. **Tag Creation**: v1.0.5 tag was manually created
5. **Fix Implementation**: Workflow updated to prevent premature tagging and handle missing PAT gracefully

## Expected Behavior After Fix

1. **Version Management**: 
   - Tags are only created after successful public release
   - GitVersion will correctly increment versions based on commit history and existing tags
   - No version conflicts when republishing

2. **PR Creation**:
   - If PAT is configured: MegaLinter will create PRs for auto-fixes
   - If PAT is not configured: Workflow completes successfully with a warning message
   - No workflow failures due to missing PAT

## Files Modified

- `.github/workflows/build_and_release.yml`:
  - Removed tag creation from `build` job (lines 101-113)
  - Added PAT availability check in `scan` job
  - Updated PR creation condition to only run when PAT is available
