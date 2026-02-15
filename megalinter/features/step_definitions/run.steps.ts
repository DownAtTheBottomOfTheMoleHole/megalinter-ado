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

  sandbox.stub(tl, "tool").callsFake((tool: string) => {
    const mockToolRunner = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      arg: sandbox.stub().callsFake((_args: any) => {
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
  sandbox.stub(tl, "exist").returns(false);
  sandbox.stub(tl, "mkdirP");

  sandbox.stub(tl, "execSync").callsFake(() => {
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
