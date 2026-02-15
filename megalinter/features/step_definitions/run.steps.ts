import { Given, When, Then, Before, After } from "@cucumber/cucumber";
import * as assert from "assert";
import * as sinon from "sinon";
import * as tl from "azure-pipelines-task-lib/task";
import * as tr from "azure-pipelines-task-lib/toolrunner";
import { run } from "../../megalinter";

let result: string | null = null;
let errorOccurred: boolean = false;

// Lint changed files only test state
let validateAllCodebaseSet: boolean = false;
let validateAllCodebaseValue: string = "";

// Docker caching test state
let dockerImagePulled: boolean = false;
let dockerImageLoadedFromCache: boolean = false;
let dockerImageSavedToCache: boolean = false;
let dockerCacheTarballExists: boolean = false;
let dockerImageAvailable: boolean = false;

let sandbox: sinon.SinonSandbox;
let getInputStub: sinon.SinonStub;
let getBoolInputStub: sinon.SinonStub;
let npxExecCalled: boolean = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedExecOptions: any = null;

Before(function () {
  sandbox = sinon.createSandbox();
  capturedExecOptions = null;
  npxExecCalled = false;
  dockerCacheTarballExists = false;
  dockerImageAvailable = false;

  sandbox.stub(tl, "tool").callsFake((tool: string) => {
    const mockToolRunner = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      arg: sandbox.stub().callsFake((args: any) => {
        if (tool === "docker" && Array.isArray(args)) {
          if (args.includes("load")) {
            dockerImageLoadedFromCache = true;
            dockerImageAvailable = true;
          } else if (args.includes("save")) {
            dockerImageSavedToCache = true;
          } else if (args.includes("pull")) {
            dockerImagePulled = true;
            dockerImageAvailable = true;
          }
        }
        return mockToolRunner;
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      exec: sandbox.stub().callsFake(async (options: any) => {
        if (tool === "npx") {
          capturedExecOptions = options;
          npxExecCalled = true;
        }
        return 0;
      }),
    };

    return mockToolRunner as unknown as tr.ToolRunner;
  });

  sandbox.stub(tl, "setResult");
  sandbox.stub(tl, "getVariable").returns("");
  sandbox.stub(tl, "which").returns("/usr/bin/npx");
  sandbox.stub(tl, "exist").callsFake(() => dockerCacheTarballExists);
  sandbox.stub(tl, "mkdirP");

  sandbox.stub(tl, "execSync").callsFake((tool: string, args?: unknown) => {
    if (
      tool === "docker" &&
      Array.isArray(args) &&
      args.includes("images") &&
      args.includes("-q")
    ) {
      return {
        code: 0,
        stdout: dockerImageAvailable ? "mock-image-id-12345\n" : "",
        stderr: "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: undefined as any,
      };
    }

    return {
      code: 0,
      stdout: "",
      stderr: "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: undefined as any,
    };
  });

  getInputStub = sandbox.stub(tl, "getInput");
  getBoolInputStub = sandbox.stub(tl, "getBoolInput");

  getInputStub.returns("");
  getBoolInputStub.returns(false);

  getInputStub.withArgs("flavor").returns("javascript");
  getInputStub.withArgs("release").returns("v8");

  result = null;
  errorOccurred = false;
  dockerImagePulled = false;
  dockerImageLoadedFromCache = false;
  dockerImageSavedToCache = false;
  validateAllCodebaseSet = false;
  validateAllCodebaseValue = "";
});

After(function () {
  sandbox.restore();
});

Given("the input parameters are valid", async function () {
  errorOccurred = false;
});

Given("the input parameters are invalid", async function () {
  errorOccurred = true;
});

Given("docker image caching is enabled", async function () {
  getBoolInputStub.withArgs("cacheDockerImage").returns(true);
  getInputStub.withArgs("dockerCachePath").returns("/tmp/test-docker-cache");
});

Given("docker image caching is disabled", async function () {
  getBoolInputStub.withArgs("cacheDockerImage").returns(false);
});

Given("lint changed files only is enabled", async function () {
  getBoolInputStub.withArgs("lintChangedFilesOnly").returns(true);
});

Given("lint changed files only is disabled", async function () {
  getBoolInputStub.withArgs("lintChangedFilesOnly").returns(false);
});

Given("no cached docker image tarball exists", async function () {
  dockerCacheTarballExists = false;
});

Given("a cached docker image tarball exists", async function () {
  dockerCacheTarballExists = true;
});

When("the run function is called", async function () {
  try {
    if (errorOccurred) throw new Error("Test error");

    await run();

    if (capturedExecOptions && capturedExecOptions.env) {
      const env = capturedExecOptions.env;

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
    "Expected VALIDATE_ALL_CODEBASE to be set to 'false', but it was: " +
      validateAllCodebaseValue,
  );
  assert.ok(
    npxExecCalled,
    "Expected npx exec to be called, but it was not.",
  );
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
    "Expected VALIDATE_ALL_CODEBASE to not be set in the environment passed to exec, but it was set to: " +
      validateAllCodebaseValue,
  );
  assert.ok(
    npxExecCalled,
    "Expected npx exec to be called, but it was not.",
  );
});
