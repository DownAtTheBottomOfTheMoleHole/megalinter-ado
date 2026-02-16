Feature: Run function
  As a developer
  I want to test the run function
  So that I can ensure it works correctly

  Scenario: Successful execution
    Given the input parameters are valid
    When the run function is called
    Then the function should execute successfully

  Scenario: Failed execution
    Given the input parameters are valid
    When the run function is called with a failing command
    Then the function should fail with an error message

  Scenario: Exception thrown
    Given the input parameters are invalid
    When the run function is called
    Then the function should fail with an error message

  Scenario: Lint changed files only enabled
    Given lint changed files only is enabled
    When the run function is called
    Then VALIDATE_ALL_CODEBASE environment variable should be set to false

  Scenario: Lint changed files only disabled
    Given lint changed files only is disabled
    When the run function is called
    Then VALIDATE_ALL_CODEBASE environment variable should not be set

  Scenario: Docker image cache hit
    Given docker image caching is enabled
    And a cached docker image tarball exists
    When the run function is called
    Then the docker image should be loaded from cache
    And the docker image should not be pulled

  Scenario: Docker image caching disabled
    Given docker image caching is disabled
    When the run function is called
    Then the docker image should be pulled
    And no docker image tarball should be saved

  Scenario: Docker image cache miss
    Given docker image caching is enabled
    And no cached docker image tarball exists
    When the run function is called
    Then the docker image should be pulled
    And the docker image should be saved to the cache path

  Scenario: Docker image cache load fails but image exists locally
    Given docker image caching is enabled
    And a cached docker image tarball exists but is corrupted
    And the docker image exists locally
    When the run function is called
    Then the cache load should fail with a warning
    And the docker image should not be pulled
    And no docker image tarball should be saved
