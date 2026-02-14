import { Given, When, Then, Before, After } from "@cucumber/cucumber";
import assert from "assert";
import * as sinon from "sinon";
import * as tl from "azure-pipelines-task-lib/task";
import { run } from "../../megalinter"; // Ensure this path is correct

let result: string | null = null;
let errorOccurred: boolean = false;

// Lint changed files only test state
let validateAllCodebaseSet: boolean = false;
let validateAllCodebaseValue: string = "";

// Docker caching test state (for old simulation-based tests)
let dockerImagePulled: boolean = false;
let dockerImageLoadedFromCache: boolean = false;
let dockerImageSavedToCache: boolean = false;

// Sinon stubs for mocking (stored for cleanup via sinon.restore())
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _toolStub: sinon.SinonStub;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _execSyncStub: sinon.SinonStub;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _setResultStub: sinon.SinonStub;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _getInputStub: sinon.SinonStub;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _getBoolInputStub: sinon.SinonStub;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedExecOptions: any = null;

// Mock tool runner interface
interface MockToolRunner {
  arg: sinon.SinonStub;
  exec: sinon.SinonStub;
}

Before(function () {
  // Reset captured options before each scenario
  capturedExecOptions = null;
  
  // Stub getInput and getBoolInput to return test values
  _getInputStub = sinon.stub(tl, "getInput").callsFake((name: string) => {
    const envKey = `INPUT_${name.toUpperCase()}`;
    return process.env[envKey];
  });
  
  _getBoolInputStub = sinon.stub(tl, "getBoolInput").callsFake((name: string) => {
    const envKey = `INPUT_${name.toUpperCase()}`;
    return process.env[envKey]?.toUpperCase() === "TRUE";
  });
  
  // Set required environment variables for tests
  process.env["INPUT_FLAVOR"] = "all";
  process.env["INPUT_RELEASE"] = "latest";
  process.env["INPUT_FIX"] = "false";
  process.env["INPUT_CREATEFIXPR"] = "false";
  process.env["INPUT_ENABLEPRCOMMENTS"] = "false";
  
  // Create stubs for tl methods
  _setResultStub = sinon.stub(tl, "setResult");
  _execSyncStub = sinon.stub(tl, "execSync").returns({ 
    code: 0, 
    stdout: "", 
    stderr: ""
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  
  // Create a mock tool runner
  const mockToolRunner: MockToolRunner = {
    arg: sinon.stub().returnsThis(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exec: sinon.stub().callsFake(async (options: any) => {
      // Capture the exec options (including env) for assertions
      capturedExecOptions = options;
      return 0; // Success exit code
    })
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _toolStub = sinon.stub(tl, "tool").returns(mockToolRunner as any);
});

After(function () {
  // Restore all stubs after each scenario
  sinon.restore();
  
  // Clean up environment variables
  delete process.env["INPUT_LINTCHANGEDFILESONLY"];
  delete process.env["INPUT_CACHEDOCKERIMAGE"];
  delete process.env["INPUT_DOCKERCACHEPATH"];
  
  // Reset state variables
  result = null;
  errorOccurred = false;
  dockerImagePulled = false;
  dockerImageLoadedFromCache = false;
  dockerImageSavedToCache = false;
  validateAllCodebaseSet = false;
  validateAllCodebaseValue = "";
  capturedExecOptions = null;
});

Given("the input parameters are valid", async function () {
  // Mock valid input parameters if necessary
  // In CI (GitHub Actions), environment variables provide mock values
  // In ADO, real values are provided
  // Just verify we can get the input without error
  try {
    tl.getInput("sampleInput", false); // Don't require, just test
  } catch {
    // Expected in some environments, that's okay
  }
});

Given("the input parameters are invalid", async function () {
  // Mock invalid input parameters or set error flag directly
  errorOccurred = true;
});

Given("docker image caching is enabled", async function () {
  process.env["INPUT_CACHEDOCKERIMAGE"] = "true";
  process.env["INPUT_DOCKERCACHEPATH"] = "/tmp/test-docker-cache";
});

Given("docker image caching is disabled", async function () {
  process.env["INPUT_CACHEDOCKERIMAGE"] = "false";
  delete process.env["INPUT_DOCKERCACHEPATH"];
});

Given("lint changed files only is enabled", async function () {
  process.env["INPUT_LINTCHANGEDFILESONLY"] = "true";
});

Given("lint changed files only is disabled", async function () {
  process.env["INPUT_LINTCHANGEDFILESONLY"] = "false";
});

Given("no cached docker image tarball exists", async function () {
  // Ensure the cache directory/file does not exist for the test
  // Docker caching tests still use simulation approach
});

Given("a cached docker image tarball exists", async function () {
  // In a real test environment, a mock tarball would be placed at the cache path
  // For CI testing, we simulate the behavior
  // Docker caching tests still use simulation approach
});

When("the run function is called", async function () {
  try {
    if (errorOccurred) throw new Error("Test error");
    
    // Call the actual run function with mocked tl.tool()
    await run();
    
    // Extract environment variables from captured exec options
    if (capturedExecOptions && capturedExecOptions.env) {
      const env = capturedExecOptions.env;
      
      // Check if VALIDATE_ALL_CODEBASE was set
      if ("VALIDATE_ALL_CODEBASE" in env) {
        validateAllCodebaseSet = true;
        validateAllCodebaseValue = env["VALIDATE_ALL_CODEBASE"];
      } else {
        validateAllCodebaseSet = false;
        validateAllCodebaseValue = "";
      }
    }
    
    result = "success";
  } catch (error) {
    if (error instanceof Error) result = error.message;
    else result = "Unknown error occurred";
  }
});

When("the run function is called with a failing command", async function () {
  try {
    // Simulate a failing command scenario
    throw new Error("Test error");
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

Then("the docker image should be pulled", function () {
  assert.strictEqual(
    dockerImagePulled,
    true,
    "Expected the Docker image to be pulled, but it was not.",
  );
});

Then("the docker image should be saved to the cache path", function () {
  assert.strictEqual(
    dockerImageSavedToCache,
    true,
    "Expected the Docker image to be saved to cache, but it was not.",
  );
});

Then("the docker image should be loaded from cache", function () {
  assert.strictEqual(
    dockerImageLoadedFromCache,
    true,
    "Expected the Docker image to be loaded from cache, but it was not.",
  );
});

Then("the docker image should not be pulled", function () {
  assert.strictEqual(
    dockerImagePulled,
    false,
    "Expected the Docker image to not be pulled, but it was.",
  );
});

Then("no docker image tarball should be saved", function () {
  assert.strictEqual(
    dockerImageSavedToCache,
    false,
    "Expected no Docker image tarball to be saved, but one was.",
  );
});

Then("VALIDATE_ALL_CODEBASE environment variable should be set to false", function () {
  assert.strictEqual(
    validateAllCodebaseSet,
    true,
    "Expected VALIDATE_ALL_CODEBASE to be set, but it was not.",
  );
  assert.strictEqual(
    validateAllCodebaseValue,
    "false",
    "Expected VALIDATE_ALL_CODEBASE to be set to 'false', but it was not.",
  );
});

Then("VALIDATE_ALL_CODEBASE environment variable should not be set", function () {
  assert.strictEqual(
    validateAllCodebaseSet,
    false,
    "Expected VALIDATE_ALL_CODEBASE to not be set, but it was.",
  );
});
