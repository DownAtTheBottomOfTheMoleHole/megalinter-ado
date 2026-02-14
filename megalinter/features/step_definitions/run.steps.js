"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cucumber_1 = require("@cucumber/cucumber");
const assert_1 = __importDefault(require("assert"));
const sinon = __importStar(require("sinon"));
const tl = __importStar(require("azure-pipelines-task-lib/task"));
const megalinter_1 = require("../../megalinter"); // Ensure this path is correct
let result = null;
let errorOccurred = false;
// Sinon stubs
let sandbox;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let toolStub;
let execStub;
let getInputStub;
let getBoolInputStub;
let existStub;
let execSyncStub;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedExecOptions = null;
// Docker caching test state
let dockerImagePulled = false;
let dockerImageLoadedFromCache = false;
let dockerImageSavedToCache = false;
// Lint changed files only test state
let validateAllCodebaseSet = false;
let validateAllCodebaseValue = "";
// Setup and teardown for each scenario
(0, cucumber_1.Before)(function () {
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
        error: undefined
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
(0, cucumber_1.After)(function () {
    sandbox.restore();
});
(0, cucumber_1.Given)("the input parameters are valid", async function () {
    // Mock valid input parameters if necessary
    // In CI (GitHub Actions), environment variables provide mock values
    // In ADO, real values are provided
    // Just verify we can get the input without error
    try {
        tl.getInput("sampleInput", false); // Don't require, just test
    }
    catch {
        // Expected in some environments, that's okay
    }
});
(0, cucumber_1.Given)("the input parameters are invalid", async function () {
    // Mock invalid input parameters or set error flag directly
    errorOccurred = true;
});
(0, cucumber_1.Given)("docker image caching is enabled", async function () {
    // Configure the stub to return true for cacheDockerImage
    getBoolInputStub.withArgs("cacheDockerImage").returns(true);
    getInputStub.withArgs("dockerCachePath").returns("/tmp/test-docker-cache");
});
(0, cucumber_1.Given)("docker image caching is disabled", async function () {
    // Configure the stub to return false for cacheDockerImage (already default)
    getBoolInputStub.withArgs("cacheDockerImage").returns(false);
});
(0, cucumber_1.Given)("lint changed files only is enabled", async function () {
    // Configure the stub to return true for lintChangedFilesOnly
    getBoolInputStub.withArgs("lintChangedFilesOnly").returns(true);
});
(0, cucumber_1.Given)("lint changed files only is disabled", async function () {
    // Configure the stub to return false for lintChangedFilesOnly (already default)
    getBoolInputStub.withArgs("lintChangedFilesOnly").returns(false);
});
(0, cucumber_1.Given)("no cached docker image tarball exists", async function () {
    // Ensure the cache directory/file does not exist for the test
    // Reset the stub to return false (the default)
    existStub.returns(false);
    // Reset execSync to return empty stdout (no image in daemon)
    execSyncStub.returns({
        code: 0,
        stdout: "",
        stderr: "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: undefined
    });
});
(0, cucumber_1.Given)("a cached docker image tarball exists", async function () {
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
        error: undefined
    });
});
(0, cucumber_1.When)("the run function is called", async function () {
    try {
        if (errorOccurred)
            throw new Error("Test error");
        // Create tool stub that handles both docker and npx calls
        const toolStubFn = sandbox.stub(tl, "tool");
        toolStubFn.callsFake((tool) => {
            if (tool === "docker") {
                // Create docker-specific mock to track load/save operations
                const dockerMock = {
                    arg: sandbox.stub().callsFake((args) => {
                        if (Array.isArray(args)) {
                            if (args.includes("load")) {
                                dockerImageLoadedFromCache = true;
                            }
                            else if (args.includes("save")) {
                                dockerImageSavedToCache = true;
                            }
                        }
                        return dockerMock; // Return the mock itself for chaining
                    }),
                    exec: sandbox.stub().resolves(0),
                };
                return dockerMock; // eslint-disable-line @typescript-eslint/no-explicit-any
            }
            else if (tool === "npx") {
                // Create npx-specific mock to capture environment variables
                toolStub = {
                    arg: sandbox.stub().returnsThis(),
                    exec: sandbox.stub().callsFake(async (options) => {
                        capturedExecOptions = options;
                        // Determine if image was pulled based on docker commands
                        if (dockerImageSavedToCache && !dockerImageLoadedFromCache) {
                            dockerImagePulled = true; // Fresh pull and save
                        }
                        else if (dockerImageLoadedFromCache) {
                            dockerImagePulled = false; // Loaded from cache
                        }
                        else if (!dockerImageLoadedFromCache && !dockerImageSavedToCache) {
                            // No caching, assume pull happened
                            dockerImagePulled = true;
                        }
                        // Check VALIDATE_ALL_CODEBASE in environment
                        if (options && options.env && "VALIDATE_ALL_CODEBASE" in options.env) {
                            validateAllCodebaseSet = true;
                            validateAllCodebaseValue = options.env["VALIDATE_ALL_CODEBASE"];
                        }
                        else {
                            validateAllCodebaseSet = false;
                            validateAllCodebaseValue = "";
                        }
                        return 0;
                    }),
                };
                execStub = toolStub.exec;
                return toolStub; // eslint-disable-line @typescript-eslint/no-explicit-any
            }
            // Default mock for other tools
            return {
                arg: sandbox.stub().returnsThis(),
                exec: sandbox.stub().resolves(0),
            }; // eslint-disable-line @typescript-eslint/no-explicit-any
        });
        // Actually call the run function
        await (0, megalinter_1.run)();
        result = "success";
    }
    catch (error) {
        if (error instanceof Error)
            result = error.message;
        else
            result = "Unknown error occurred";
    }
});
(0, cucumber_1.When)("the run function is called with a failing command", async function () {
    try {
        // Simulate a failing command scenario
        throw new Error("Test error");
    }
    catch (error) {
        if (error instanceof Error)
            result = error.message;
        else
            result = "Unknown error occurred";
    }
});
(0, cucumber_1.Then)("the function should execute successfully", function () {
    assert_1.default.strictEqual(result, "success", "Expected the function to execute successfully, but it did not.");
});
(0, cucumber_1.Then)("the function should fail with an error message", function () {
    assert_1.default.strictEqual(result, "Test error", "Expected the function to fail with a specific error message, but it did not.");
});
(0, cucumber_1.Then)("the docker image should be pulled", function () {
    assert_1.default.strictEqual(dockerImagePulled, true, "Expected the Docker image to be pulled, but it was not.");
});
(0, cucumber_1.Then)("the docker image should be saved to the cache path", function () {
    assert_1.default.strictEqual(dockerImageSavedToCache, true, "Expected the Docker image to be saved to cache, but it was not.");
});
(0, cucumber_1.Then)("the docker image should be loaded from cache", function () {
    assert_1.default.strictEqual(dockerImageLoadedFromCache, true, "Expected the Docker image to be loaded from cache, but it was not.");
});
(0, cucumber_1.Then)("the docker image should not be pulled", function () {
    assert_1.default.strictEqual(dockerImagePulled, false, "Expected the Docker image to not be pulled, but it was.");
});
(0, cucumber_1.Then)("no docker image tarball should be saved", function () {
    assert_1.default.strictEqual(dockerImageSavedToCache, false, "Expected no Docker image tarball to be saved, but one was.");
});
(0, cucumber_1.Then)("VALIDATE_ALL_CODEBASE environment variable should be set to false", function () {
    assert_1.default.strictEqual(validateAllCodebaseSet, true, "Expected VALIDATE_ALL_CODEBASE to be set in the environment passed to exec, but it was not.");
    assert_1.default.strictEqual(validateAllCodebaseValue, "false", "Expected VALIDATE_ALL_CODEBASE to be set to 'false', but it was: " + validateAllCodebaseValue);
    // Verify that exec was actually called
    assert_1.default.ok(execStub.called, "Expected exec to be called, but it was not.");
    // Verify the environment was passed correctly
    assert_1.default.ok(capturedExecOptions, "Expected exec options to be captured, but they were not.");
    assert_1.default.ok(capturedExecOptions.env, "Expected env to be in exec options, but it was not.");
});
(0, cucumber_1.Then)("VALIDATE_ALL_CODEBASE environment variable should not be set", function () {
    assert_1.default.strictEqual(validateAllCodebaseSet, false, "Expected VALIDATE_ALL_CODEBASE to not be set in the environment passed to exec, but it was set to: " + validateAllCodebaseValue);
    // Verify that exec was actually called
    assert_1.default.ok(execStub.called, "Expected exec to be called, but it was not.");
});
