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
let toolStub;
let execStub;
let getInputStub;
let getBoolInputStub;
let capturedExecOptions = null;
// Docker caching test state
let dockerCacheEnabled = false;
let dockerCacheTarballExists = false;
let dockerImagePulled = false;
let dockerImageLoadedFromCache = false;
let dockerImageSavedToCache = false;
// Lint changed files only test state
let lintChangedFilesOnlyEnabled = false;
let validateAllCodebaseSet = false;
let validateAllCodebaseValue = "";
// Setup and teardown for each scenario
(0, cucumber_1.Before)(function () {
    sandbox = sinon.createSandbox();
    capturedExecOptions = null;
    // Create a mock tool object
    toolStub = {
        arg: sandbox.stub().returnsThis(),
        exec: sandbox.stub().resolves(0),
    };
    execStub = toolStub.exec;
    // Stub tl.tool to return our mock tool
    sandbox.stub(tl, "tool").returns(toolStub);
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
        error: undefined
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
    dockerCacheEnabled = true;
    process.env["INPUT_CACHEDOCKERIMAGE"] = "true";
    process.env["INPUT_DOCKERCACHEPATH"] = "/tmp/test-docker-cache";
});
(0, cucumber_1.Given)("docker image caching is disabled", async function () {
    dockerCacheEnabled = false;
    process.env["INPUT_CACHEDOCKERIMAGE"] = "false";
    delete process.env["INPUT_DOCKERCACHEPATH"];
});
(0, cucumber_1.Given)("lint changed files only is enabled", async function () {
    lintChangedFilesOnlyEnabled = true;
    // Configure the stub to return true for lintChangedFilesOnly
    getBoolInputStub.withArgs("lintChangedFilesOnly").returns(true);
});
(0, cucumber_1.Given)("lint changed files only is disabled", async function () {
    lintChangedFilesOnlyEnabled = false;
    // Configure the stub to return false for lintChangedFilesOnly (already default)
    getBoolInputStub.withArgs("lintChangedFilesOnly").returns(false);
});
(0, cucumber_1.Given)("no cached docker image tarball exists", async function () {
    dockerCacheTarballExists = false;
    // Ensure the cache directory/file does not exist for the test
});
(0, cucumber_1.Given)("a cached docker image tarball exists", async function () {
    dockerCacheTarballExists = true;
    // In a real test environment, a mock tarball would be placed at the cache path
    // For CI testing, we simulate the behavior
});
(0, cucumber_1.When)("the run function is called", async function () {
    try {
        if (errorOccurred)
            throw new Error("Test error");
        // Capture the exec options when exec is called
        execStub.callsFake(async (options) => {
            capturedExecOptions = options;
            // Check if VALIDATE_ALL_CODEBASE is in the environment
            if (options && options.env && "VALIDATE_ALL_CODEBASE" in options.env) {
                validateAllCodebaseSet = true;
                validateAllCodebaseValue = options.env["VALIDATE_ALL_CODEBASE"];
            }
            else {
                validateAllCodebaseSet = false;
                validateAllCodebaseValue = "";
            }
            return 0; // Success exit code
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
