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
