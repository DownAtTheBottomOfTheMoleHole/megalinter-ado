# BDD Tests for MegaLinter Azure DevOps Task

This directory contains Behavior-Driven Development (BDD) tests using Cucumber for the MegaLinter Azure DevOps extension.

## Test Structure

- **Feature files** (`*.feature`): Define test scenarios in Gherkin syntax
- **Step definitions** (`step_definitions/*.ts`): Implement the scenario steps

## Current Test Limitations

The current test implementation has the following limitations:

### 1. Simulated Behavior in CI Environments

When running in CI environments (GitHub Actions), the tests simulate Docker caching behavior rather than executing the actual caching logic. This is done to avoid requiring Docker and Azure DevOps infrastructure in the CI pipeline.

**Impact**: The tests verify the expected outcomes based on simulated state, but do not actually:
- Execute `docker load` or `docker save` commands
- Verify that correct arguments are passed to Docker CLI
- Test actual file I/O operations for cache tarballs
- Validate error handling when Docker commands fail

### 2. Missing Integration Test Coverage

The tests do not provide full integration test coverage for the Docker caching feature because:
- Docker commands are not mocked or stubbed with a framework
- The actual `megalinter.ts` caching logic is not invoked in CI
- File system operations (creating cache directories, checking tarball existence) are not tested

### 3. What IS Tested

Despite these limitations, the tests do verify:
- Feature scenarios are documented and understood
- Step definitions compile and execute without errors
- Basic logic flow for different caching scenarios
- Test infrastructure is in place for future enhancement

## Future Improvements

To address these limitations, future enhancements could include:

1. **Mock Docker CLI**: Use a mocking framework (e.g., `sinon`, `jest`) to mock `tl.tool()` and verify Docker commands are called with correct arguments

2. **Integration Tests**: Create a separate test suite that runs in a Docker-enabled environment to test actual caching behavior

3. **Unit Tests**: Extract caching logic into testable units with dependency injection, allowing for proper unit testing without Docker

4. **Test Fixtures**: Create mock tarball files and verify file operations work correctly

## Running the Tests

From the root of the repository:

```bash
npm test
```

This runs the Cucumber tests with the current CI-compatible implementation.
