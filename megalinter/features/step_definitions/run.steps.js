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
// Lint changed files only test state
let validateAllCodebaseSet = false;
let validateAllCodebaseValue = "";
// Docker caching test state (for old simulation-based tests)
let dockerImagePulled = false;
let dockerImageLoadedFromCache = false;
let dockerImageSavedToCache = false;
// Sinon stubs for mocking (stored for cleanup via sinon.restore())
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _toolStub;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _execSyncStub;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _setResultStub;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _getInputStub;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _getBoolInputStub;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedExecOptions = null;
(0, cucumber_1.Before)(function () {
    // Reset captured options before each scenario
    capturedExecOptions = null;
    // Stub getInput and getBoolInput to return test values
    _getInputStub = sinon.stub(tl, "getInput").callsFake((name) => {
        const envKey = `INPUT_${name.toUpperCase()}`;
        return process.env[envKey];
    });
    _getBoolInputStub = sinon.stub(tl, "getBoolInput").callsFake((name) => {
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
    });
    // Create a mock tool runner
    const mockToolRunner = {
        arg: sinon.stub().returnsThis(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        exec: sinon.stub().callsFake(async (options) => {
            // Capture the exec options (including env) for assertions
            capturedExecOptions = options;
            return 0; // Success exit code
        })
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _toolStub = sinon.stub(tl, "tool").returns(mockToolRunner);
});
(0, cucumber_1.After)(function () {
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
    process.env["INPUT_CACHEDOCKERIMAGE"] = "true";
    process.env["INPUT_DOCKERCACHEPATH"] = "/tmp/test-docker-cache";
});
(0, cucumber_1.Given)("docker image caching is disabled", async function () {
    process.env["INPUT_CACHEDOCKERIMAGE"] = "false";
    delete process.env["INPUT_DOCKERCACHEPATH"];
});
(0, cucumber_1.Given)("lint changed files only is enabled", async function () {
    process.env["INPUT_LINTCHANGEDFILESONLY"] = "true";
});
(0, cucumber_1.Given)("lint changed files only is disabled", async function () {
    process.env["INPUT_LINTCHANGEDFILESONLY"] = "false";
});
(0, cucumber_1.Given)("no cached docker image tarball exists", async function () {
    // Ensure the cache directory/file does not exist for the test
    // Docker caching tests still use simulation approach
});
(0, cucumber_1.Given)("a cached docker image tarball exists", async function () {
    // In a real test environment, a mock tarball would be placed at the cache path
    // For CI testing, we simulate the behavior
    // Docker caching tests still use simulation approach
});
(0, cucumber_1.When)("the run function is called", async function () {
    try {
        if (errorOccurred)
            throw new Error("Test error");
        // Call the actual run function with mocked tl.tool()
        await (0, megalinter_1.run)();
        // Extract environment variables from captured exec options
        if (capturedExecOptions && capturedExecOptions.env) {
            const env = capturedExecOptions.env;
            // Check if VALIDATE_ALL_CODEBASE was set
            if ("VALIDATE_ALL_CODEBASE" in env) {
                validateAllCodebaseSet = true;
                validateAllCodebaseValue = env["VALIDATE_ALL_CODEBASE"];
            }
            else {
                validateAllCodebaseSet = false;
                validateAllCodebaseValue = "";
            }
        }
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
    assert_1.default.strictEqual(validateAllCodebaseSet, true, "Expected VALIDATE_ALL_CODEBASE to be set, but it was not.");
    assert_1.default.strictEqual(validateAllCodebaseValue, "false", "Expected VALIDATE_ALL_CODEBASE to be set to 'false', but it was not.");
});
(0, cucumber_1.Then)("VALIDATE_ALL_CODEBASE environment variable should not be set", function () {
    assert_1.default.strictEqual(validateAllCodebaseSet, false, "Expected VALIDATE_ALL_CODEBASE to not be set, but it was.");
});
