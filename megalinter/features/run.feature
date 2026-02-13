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

  Scenario: Docker image caching enabled with no existing cache
    Given docker image caching is enabled
    And no cached docker image tarball exists
    When the run function is called
    Then the docker image should be pulled
    And the docker image should be saved to the cache path

  Scenario: Docker image caching enabled with existing cache
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
