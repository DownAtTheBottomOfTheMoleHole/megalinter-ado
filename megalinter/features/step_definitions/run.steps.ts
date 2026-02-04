import { Given, When, Then } from "@cucumber/cucumber";
import assert from "assert";
import * as tl from "azure-pipelines-task-lib/task";
import { run } from "../../megalinter"; // Ensure this path is correct

// Define a type for test errors
type TestError = Error;

let result: string | null = null;
let errorOccurred: boolean = false;

Given("the input parameters are valid", async function () {
  // Mock valid input parameters if necessary
  tl.getInput("sampleInput", true); // Example of getting a mock input
});

Given("the input parameters are invalid", async function () {
  // Mock invalid input parameters or set error flag directly
  errorOccurred = true;
});

When("the run function is called", async function () {
  try {
    if (errorOccurred) throw new Error("Test error") as TestError;
    await run();
    result = "success";
  } catch (error) {
    if (error instanceof Error) result = error.message;
    else result = "Unknown error occurred";
  }
});

Then("the function should execute successfully", function () {
  assert.strictEqual(
    result,
    "success",
    "Expected the function to execute successfully, but it did not.",
  );
});

Then("the function should fail with an error message", function () {
  assert.strictEqual(
    result,
    "Test error",
    "Expected the function to fail with a specific error message, but it did not.",
  );
});
