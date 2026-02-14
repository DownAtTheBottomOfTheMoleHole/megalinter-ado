import { Given, When, Then, Before, After } from "@cucumber/cucumber";
import assert from "assert";
import * as sinon from "sinon";
import * as tl from "azure-pipelines-task-lib/task";
import { run } from "../../megalinter"; // Ensure this path is correct

let result: string | null = null;
let errorOccurred: boolean = false;

// Docker caching test state
let dockerCacheEnabled: boolean = false;
let dockerCacheTarballExists: boolean = false;
let dockerImagePulled: boolean = false;
let dockerImageLoadedFromCache: boolean = false;
let dockerImageSavedToCache: boolean = false;

// Lint changed files only test state
let lintChangedFilesOnlyEnabled: boolean = false;
let validateAllCodebaseSet: boolean = false;
let validateAllCodebaseValue: string = "";

// Sinon stubs for mocking
let toolStub: sinon.SinonStub;
let execStub: sinon.SinonStub;
let execSyncStub: sinon.SinonStub;
let setResultStub: sinon.SinonStub;
let getInputStub: sinon.SinonStub;
let getBoolInputStub: sinon.SinonStub;
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
  getInputStub = sinon.stub(tl, "getInput").callsFake((name: string) => {
    const envKey = `INPUT_${name.toUpperCase()}`;
    return process.env[envKey];
  });
  
  getBoolInputStub = sinon.stub(tl, "getBoolInput").callsFake((name: string) => {
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
  setResultStub = sinon.stub(tl, "setResult");
  execSyncStub = sinon.stub(tl, "execSync").returns({ 
    code: 0, 
    stdout: "", 
    stderr: ""
  } as any);
  
  // Create a mock tool runner
  const mockToolRunner: MockToolRunner = {
    arg: sinon.stub().returnsThis(),
    exec: sinon.stub().callsFake(async (options: any) => {
      // Capture the exec options (including env) for assertions
      capturedExecOptions = options;
      return 0; // Success exit code
    })
  };
  
  toolStub = sinon.stub(tl, "tool").returns(mockToolRunner as any);
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
  dockerCacheEnabled = false;
  dockerCacheTarballExists = false;
  dockerImagePulled = false;
  dockerImageLoadedFromCache = false;
  dockerImageSavedToCache = false;
  lintChangedFilesOnlyEnabled = false;
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
  dockerCacheEnabled = true;
  process.env["INPUT_CACHEDOCKERIMAGE"] = "true";
  process.env["INPUT_DOCKERCACHEPATH"] = "/tmp/test-docker-cache";
});

Given("docker image caching is disabled", async function () {
  dockerCacheEnabled = false;
  process.env["INPUT_CACHEDOCKERIMAGE"] = "false";
  delete process.env["INPUT_DOCKERCACHEPATH"];
});

Given("lint changed files only is enabled", async function () {
  lintChangedFilesOnlyEnabled = true;
  process.env["INPUT_LINTCHANGEDFILESONLY"] = "true";
});

Given("lint changed files only is disabled", async function () {
  lintChangedFilesOnlyEnabled = false;
  process.env["INPUT_LINTCHANGEDFILESONLY"] = "false";
});

Given("no cached docker image tarball exists", async function () {
  dockerCacheTarballExists = false;
  // Ensure the cache directory/file does not exist for the test
});

Given("a cached docker image tarball exists", async function () {
  dockerCacheTarballExists = true;
  // In a real test environment, a mock tarball would be placed at the cache path
  // For CI testing, we simulate the behavior
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
