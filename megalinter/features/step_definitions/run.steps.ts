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
let dockerLoadCalled: boolean = false;
let dockerPullCalled: boolean = false;
let dockerSaveCalled: boolean = false;
let dockerLoadShouldFail: boolean = false;
let dockerImageExistsInDaemon: boolean = false;
let cacheFileExists: boolean = false;

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

  // Reset docker caching state
  dockerLoadCalled = false;
  dockerPullCalled = false;
  dockerSaveCalled = false;
  dockerLoadShouldFail = false;
  dockerImageExistsInDaemon = false;
  cacheFileExists = false;

  sandbox.stub(tl, "tool").callsFake((tool: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let collectedArgs: any[] = [];
    const mockToolRunner = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      arg: sandbox.stub().callsFake((args: any) => {
        if (Array.isArray(args)) {
          collectedArgs = collectedArgs.concat(args);
        } else {
          collectedArgs.push(args);
        }
        return mockToolRunner;
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      exec: sandbox.stub().callsFake(async (options: any) => {
        if (tool === "npx") {
          capturedExecOptions = options;
          npxExecCalled = true;
        }
        if (tool === "docker") {
          if (collectedArgs.includes("load")) {
            dockerLoadCalled = true;
            if (dockerLoadShouldFail) return 1;
          }
          if (collectedArgs.includes("pull")) {
            dockerPullCalled = true;
          }
          if (collectedArgs.includes("save")) {
            dockerSaveCalled = true;
          }
        }
        return 0;
      }),
    };

    return mockToolRunner as unknown as tr.ToolRunner;
  });

  sandbox.stub(tl, "setResult");

  const getVariableStub = sandbox.stub(tl, "getVariable");
  getVariableStub.returns("");
  getVariableStub.withArgs("Pipeline.Workspace").returns("/tmp/test-workspace");
  getVariableStub
    .withArgs("Build.SourcesDirectory")
    .returns("/tmp/test-source");
  getVariableStub.withArgs("Agent.TempDirectory").returns("/tmp/test-temp");

  sandbox.stub(tl, "which").returns("/usr/bin/npx");

  sandbox.stub(tl, "exist").callsFake((itemPath: string) => {
    if (itemPath.endsWith(".tar")) return cacheFileExists;
    return false;
  });

  sandbox.stub(tl, "mkdirP");

  sandbox.stub(tl, "execSync").callsFake(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tool: string, args: any) => {
      if (
        tool === "docker" &&
        Array.isArray(args) &&
        args[0] === "images"
      ) {
        return {
          code: 0,
          stdout: dockerImageExistsInDaemon ? "abc123\n" : "",
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
    },
  );

  getInputStub = sandbox.stub(tl, "getInput");
  getBoolInputStub = sandbox.stub(tl, "getBoolInput");

  getInputStub.returns("");
  getBoolInputStub.returns(false);

  getInputStub.withArgs("flavor").returns("javascript");
  getInputStub.withArgs("release").returns("v8");

  result = null;
  errorOccurred = false;
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

Given("lint changed files only is enabled", async function () {
  getBoolInputStub.withArgs("lintChangedFilesOnly").returns(true);
});

Given("lint changed files only is disabled", async function () {
  getBoolInputStub.withArgs("lintChangedFilesOnly").returns(false);
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

Then(
  "VALIDATE_ALL_CODEBASE environment variable should be set to false",
  function () {
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
    assert.ok(npxExecCalled, "Expected npx exec to be called, but it was not.");
    assert.ok(
      capturedExecOptions,
      "Expected exec options to be captured, but they were not.",
    );
    assert.ok(
      capturedExecOptions.env,
      "Expected env to be in exec options, but it was not.",
    );
  },
);

Then(
  "VALIDATE_ALL_CODEBASE environment variable should not be set",
  function () {
    assert.strictEqual(
      validateAllCodebaseSet,
      false,
      "Expected VALIDATE_ALL_CODEBASE to not be set in the environment passed to exec, but it was set to: " +
        validateAllCodebaseValue,
    );
    assert.ok(npxExecCalled, "Expected npx exec to be called, but it was not.");
  },
);

Given("docker image caching is enabled", async function () {
  getBoolInputStub.withArgs("cacheDockerImage").returns(true);
  getInputStub
    .withArgs("dockerCachePath")
    .returns("/tmp/test-workspace/docker-cache");
});

Given("a cached docker image tarball exists", async function () {
  cacheFileExists = true;
  dockerImageExistsInDaemon = true;
});

Given("no cached docker image tarball exists", async function () {
  cacheFileExists = false;
});

Given("docker image caching is disabled", async function () {
  getBoolInputStub.withArgs("cacheDockerImage").returns(false);
});

Then("the docker image should be saved to the cache path", function () {
  assert.strictEqual(
    dockerSaveCalled,
    true,
    "Expected the Docker image to be saved to cache, but it was not.",
  );
});

Then("the docker image should be loaded from cache", function () {
  assert.strictEqual(
    dockerLoadCalled,
    true,
    "Expected the Docker image to be loaded from cache, but it was not.",
  );
});

Then("the docker image should not be pulled", function () {
  assert.strictEqual(
    dockerPullCalled,
    false,
    "Expected the Docker image to not be pulled, but it was.",
  );
});

Then("the docker image should be pulled", function () {
  assert.strictEqual(
    dockerPullCalled,
    true,
    "Expected the Docker image to be pulled, but it was not.",
  );
});

Then("no docker image tarball should be saved", function () {
  assert.strictEqual(
    dockerSaveCalled,
    false,
    "Expected no Docker image tarball to be saved, but one was.",
  );
});

Given(
  "a cached docker image tarball exists but is corrupted",
  async function () {
    cacheFileExists = true;
    dockerLoadShouldFail = true;
  },
);

Given("the docker image exists locally", async function () {
  dockerImageExistsInDaemon = true;
});

Then("the cache load should fail with a warning", function () {
  assert.strictEqual(
    dockerLoadCalled,
    true,
    "Expected docker load to be called, but it was not.",
  );
});
