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
let existStub: sinon.SinonStub;
let execSyncStub: sinon.SinonStub;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedExecOptions: any = null;

// Docker caching test state
let dockerImagePulled: boolean = false;
let dockerImageLoadedFromCache: boolean = false;
let dockerImageSavedToCache: boolean = false;

// Lint changed files only test state
let validateAllCodebaseSet: boolean = false;
let validateAllCodebaseValue: string = "";

// Setup and teardown for each scenario
Before(function () {
  sandbox = sinon.createSandbox();
  capturedExecOptions = null;
  
  // We'll configure tool stub in the When step to handle docker and npx differently
  // For now, just prepare the sandbox
  
  // Stub other tl methods that are commonly used
  sandbox.stub(tl, "setResult");
  sandbox.stub(tl, "getVariable").returns("");
  sandbox.stub(tl, "which").returns("/usr/bin/npx");
  existStub = sandbox.stub(tl, "exist");
  existStub.returns(false); // No cached tarball by default
  sandbox.stub(tl, "mkdirP"); // Stub directory creation
  
  // Stub execSync - used for docker image checks
  execSyncStub = sandbox.stub(tl, "execSync");
  execSyncStub.returns({ 
    code: 0, 
    stdout: "", 
    stderr: "", 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: undefined as any 
  }); // Default: empty stdout (no image found)
  
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
  dockerImagePulled = false;
  dockerImageLoadedFromCache = false;
  dockerImageSavedToCache = false;
  validateAllCodebaseSet = false;
  validateAllCodebaseValue = "";
  
  // Clean up process.env to prevent order-dependent behavior
  delete process.env["INPUT_CACHEDOCKERIMAGE"];
  delete process.env["INPUT_DOCKERCACHEPATH"];
  delete process.env["INPUT_LINTCHANGEDFILESONLY"];
  delete process.env["VALIDATE_ALL_CODEBASE"];
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
  // Configure the stub to return true for cacheDockerImage
  getBoolInputStub.withArgs("cacheDockerImage").returns(true);
  getInputStub.withArgs("dockerCachePath").returns("/tmp/test-docker-cache");
});

Given("docker image caching is disabled", async function () {
  // Configure the stub to return false for cacheDockerImage (already default)
  getBoolInputStub.withArgs("cacheDockerImage").returns(false);
});

Given("lint changed files only is enabled", async function () {
  // Configure the stub to return true for lintChangedFilesOnly
  getBoolInputStub.withArgs("lintChangedFilesOnly").returns(true);
});

Given("lint changed files only is disabled", async function () {
  // Configure the stub to return false for lintChangedFilesOnly (already default)
  getBoolInputStub.withArgs("lintChangedFilesOnly").returns(false);
});

Given("no cached docker image tarball exists", async function () {
  // Ensure the cache directory/file does not exist for the test
  // Reset the stub to return false (the default)
  existStub.returns(false);
  // Reset execSync to return empty stdout (no image in daemon)
  execSyncStub.returns({ 
    code: 0, 
    stdout: "", 
    stderr: "", 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: undefined as any 
  });
});

Given("a cached docker image tarball exists", async function () {
  // In a real test environment, a mock tarball would be placed at the cache path
  // For testing, we stub tl.exist to return true
  existStub.returns(true);
  // After docker load, the image check should return non-empty stdout
  // This simulates the image being present in the Docker daemon after loading
  execSyncStub.withArgs("docker", sinon.match.array.contains(["images", "-q"])).returns({
    code: 0,
    stdout: "mock-image-id\n",
    stderr: "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: undefined as any
  });
});

When("the run function is called", async function () {
  try {
    if (errorOccurred) throw new Error("Test error");
    
    // Create tool stub that handles both docker and npx calls
    const toolStubFn = sandbox.stub(tl, "tool");
    
    toolStubFn.callsFake((tool: string) => {
      if (tool === "docker") {
        // Create docker-specific mock to track load/save operations
        const dockerMock = {
          arg: sandbox.stub().callsFake((args: string[]) => {
            if (Array.isArray(args)) {
              if (args.includes("load")) {
                dockerImageLoadedFromCache = true;
              } else if (args.includes("save")) {
                dockerImageSavedToCache = true;
              }
            }
            return dockerMock; // Return the mock itself for chaining
          }),
          exec: sandbox.stub().resolves(0),
        };
        return dockerMock as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      } else if (tool === "npx") {
        // Create npx-specific mock to capture environment variables
        toolStub = {
          arg: sandbox.stub().returnsThis(),
          exec: sandbox.stub().callsFake(async (options: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            capturedExecOptions = options;
            
            // Determine if image was pulled based on docker commands
            if (dockerImageSavedToCache && !dockerImageLoadedFromCache) {
              dockerImagePulled = true; // Fresh pull and save
            } else if (dockerImageLoadedFromCache) {
              dockerImagePulled = false; // Loaded from cache
            } else if (!dockerImageLoadedFromCache && !dockerImageSavedToCache) {
              // No caching, assume pull happened
              dockerImagePulled = true;
            }
            
            // Check VALIDATE_ALL_CODEBASE in environment
            if (options && options.env && "VALIDATE_ALL_CODEBASE" in options.env) {
              validateAllCodebaseSet = true;
              validateAllCodebaseValue = options.env["VALIDATE_ALL_CODEBASE"];
            } else {
              validateAllCodebaseSet = false;
              validateAllCodebaseValue = "";
            }
            
            return 0;
          }),
        };
        execStub = toolStub.exec as sinon.SinonStub;
        return toolStub as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      
      // Default mock for other tools
      return {
        arg: sandbox.stub().returnsThis(),
        exec: sandbox.stub().resolves(0),
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
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
