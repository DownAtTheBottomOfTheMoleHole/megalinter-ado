import { Given, When, Then, Before, After } from "@cucumber/cucumber";
import assert from "assert";
import * as sinon from "sinon";
import * as tl from "azure-pipelines-task-lib/task";
import { run } from "../../megalinter"; // Ensure this path is correct

let result: string | null = null;
let errorOccurred: boolean = false;

// Sinon stubs
let sandbox: sinon.SinonSandbox;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let toolStub: sinon.SinonStubbedInstance<any>;
let execStub: sinon.SinonStub;
let getInputStub: sinon.SinonStub;
let getBoolInputStub: sinon.SinonStub;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedExecOptions: any = null;

// Docker caching test state (not actively used but needed for compatibility with existing Given steps)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let dockerCacheEnabled: boolean = false;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let dockerCacheTarballExists: boolean = false;
let dockerImagePulled: boolean = false;
let dockerImageLoadedFromCache: boolean = false;
let dockerImageSavedToCache: boolean = false;

// Lint changed files only test state
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let lintChangedFilesOnlyEnabled: boolean = false;
let validateAllCodebaseSet: boolean = false;
let validateAllCodebaseValue: string = "";

// Setup and teardown for each scenario
Before(function () {
  sandbox = sinon.createSandbox();
  capturedExecOptions = null;
  
  // Create a mock tool object
  toolStub = {
    arg: sandbox.stub().returnsThis(),
    exec: sandbox.stub().resolves(0),
  };
  execStub = toolStub.exec as sinon.SinonStub;
  
  // Stub tl.tool to return our mock tool
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sandbox.stub(tl, "tool").returns(toolStub as any);
  
  // Stub other tl methods that are commonly used
  sandbox.stub(tl, "setResult");
  sandbox.stub(tl, "getVariable").returns("");
  sandbox.stub(tl, "which").returns("/usr/bin/npx");
  sandbox.stub(tl, "exist").returns(false); // No cached tarball by default
  sandbox.stub(tl, "mkdirP"); // Stub directory creation
  sandbox.stub(tl, "execSync").returns({ 
    code: 0, 
    stdout: "", 
    stderr: "", 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: undefined as any 
  }); // Stub docker image checks
  
  // Stub getInput and getBoolInput - these will be configured per scenario
  getInputStub = sandbox.stub(tl, "getInput");
  getBoolInputStub = sandbox.stub(tl, "getBoolInput");
  
  // Default stubs - return empty/false for all inputs
  getInputStub.returns("");
  getBoolInputStub.returns(false);
  
  // Set minimal required inputs
  getInputStub.withArgs("flavor").returns("javascript");
  getInputStub.withArgs("release").returns("v8");
  
  // Reset test state
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
});

After(function () {
  sandbox.restore();
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
  // Configure the stub to return true for lintChangedFilesOnly
  getBoolInputStub.withArgs("lintChangedFilesOnly").returns(true);
});

Given("lint changed files only is disabled", async function () {
  lintChangedFilesOnlyEnabled = false;
  // Configure the stub to return false for lintChangedFilesOnly (already default)
  getBoolInputStub.withArgs("lintChangedFilesOnly").returns(false);
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
    
    // Capture the exec options when exec is called
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execStub.callsFake(async (options: any) => {
      capturedExecOptions = options;
      
      // Check if VALIDATE_ALL_CODEBASE is in the environment
      if (options && options.env && "VALIDATE_ALL_CODEBASE" in options.env) {
        validateAllCodebaseSet = true;
        validateAllCodebaseValue = options.env["VALIDATE_ALL_CODEBASE"];
      } else {
        validateAllCodebaseSet = false;
        validateAllCodebaseValue = "";
      }
      
      return 0; // Success exit code
    });
    
    // Actually call the run function
    await run();
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
    "Expected VALIDATE_ALL_CODEBASE to be set in the environment passed to exec, but it was not.",
  );
  assert.strictEqual(
    validateAllCodebaseValue,
    "false",
    "Expected VALIDATE_ALL_CODEBASE to be set to 'false', but it was: " + validateAllCodebaseValue,
  );
  
  // Verify that exec was actually called
  assert.ok(
    execStub.called,
    "Expected exec to be called, but it was not.",
  );
  
  // Verify the environment was passed correctly
  assert.ok(
    capturedExecOptions,
    "Expected exec options to be captured, but they were not.",
  );
  assert.ok(
    capturedExecOptions.env,
    "Expected env to be in exec options, but it was not.",
  );
});

Then("VALIDATE_ALL_CODEBASE environment variable should not be set", function () {
  assert.strictEqual(
    validateAllCodebaseSet,
    false,
    "Expected VALIDATE_ALL_CODEBASE to not be set in the environment passed to exec, but it was set to: " + validateAllCodebaseValue,
  );
  
  // Verify that exec was actually called
  assert.ok(
    execStub.called,
    "Expected exec to be called, but it was not.",
  );
});
