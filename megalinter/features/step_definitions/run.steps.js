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
Object.defineProperty(exports, "__esModule", { value: true });
const cucumber_1 = require("@cucumber/cucumber");
const assert = __importStar(require("assert"));
const sinon = __importStar(require("sinon"));
const tl = __importStar(require("azure-pipelines-task-lib/task"));
const megalinter_1 = require("../../megalinter");
let result = null;
let errorOccurred = false;
// Lint changed files only test state
let validateAllCodebaseSet = false;
let validateAllCodebaseValue = "";
// Docker caching test state
let dockerLoadCalled = false;
let dockerPullCalled = false;
let dockerSaveCalled = false;
let dockerLoadShouldFail = false;
let dockerImageExistsInDaemon = false;
let cacheFileExists = false;
let sandbox;
let getInputStub;
let getBoolInputStub;
let npxExecCalled = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedExecOptions = null;
(0, cucumber_1.Before)(function () {
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
    sandbox.stub(tl, "tool").callsFake((tool) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let collectedArgs = [];
        const mockToolRunner = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            arg: sandbox.stub().callsFake((args) => {
                if (Array.isArray(args)) {
                    collectedArgs = collectedArgs.concat(args);
                }
                else {
                    collectedArgs.push(args);
                }
                return mockToolRunner;
            }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            exec: sandbox.stub().callsFake(async (options) => {
                if (tool === "npx") {
                    capturedExecOptions = options;
                    npxExecCalled = true;
                }
                if (tool === "docker") {
                    if (collectedArgs.includes("load")) {
                        dockerLoadCalled = true;
                        if (dockerLoadShouldFail)
                            return 1;
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
        return mockToolRunner;
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
    sandbox.stub(tl, "exist").callsFake((itemPath) => {
        if (itemPath.endsWith(".tar"))
            return cacheFileExists;
        return false;
    });
    sandbox.stub(tl, "mkdirP");
    sandbox.stub(tl, "execSync").callsFake(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tool, args) => {
        if (tool === "docker" &&
            Array.isArray(args) &&
            args[0] === "images") {
            return {
                code: 0,
                stdout: dockerImageExistsInDaemon ? "abc123\n" : "",
                stderr: "",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                error: undefined,
            };
        }
        return {
            code: 0,
            stdout: "",
            stderr: "",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            error: undefined,
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
(0, cucumber_1.After)(function () {
    sandbox.restore();
});
(0, cucumber_1.Given)("the input parameters are valid", async function () {
    errorOccurred = false;
});
(0, cucumber_1.Given)("the input parameters are invalid", async function () {
    errorOccurred = true;
});
(0, cucumber_1.Given)("lint changed files only is enabled", async function () {
    getBoolInputStub.withArgs("lintChangedFilesOnly").returns(true);
});
(0, cucumber_1.Given)("lint changed files only is disabled", async function () {
    getBoolInputStub.withArgs("lintChangedFilesOnly").returns(false);
});
(0, cucumber_1.When)("the run function is called", async function () {
    try {
        if (errorOccurred)
            throw new Error("Test error");
        await (0, megalinter_1.run)();
        if (capturedExecOptions && capturedExecOptions.env) {
            const env = capturedExecOptions.env;
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
    assert.strictEqual(result, "success", "Expected the function to execute successfully, but it did not.");
});
(0, cucumber_1.Then)("the function should fail with an error message", function () {
    assert.strictEqual(result, "Test error", "Expected the function to fail with a specific error message, but it did not.");
});
(0, cucumber_1.Then)("VALIDATE_ALL_CODEBASE environment variable should be set to false", function () {
    assert.strictEqual(validateAllCodebaseSet, true, "Expected VALIDATE_ALL_CODEBASE to be set in the environment passed to exec, but it was not.");
    assert.strictEqual(validateAllCodebaseValue, "false", "Expected VALIDATE_ALL_CODEBASE to be set to 'false', but it was: " +
        validateAllCodebaseValue);
    assert.ok(npxExecCalled, "Expected npx exec to be called, but it was not.");
    assert.ok(capturedExecOptions, "Expected exec options to be captured, but they were not.");
    assert.ok(capturedExecOptions.env, "Expected env to be in exec options, but it was not.");
});
(0, cucumber_1.Then)("VALIDATE_ALL_CODEBASE environment variable should not be set", function () {
    assert.strictEqual(validateAllCodebaseSet, false, "Expected VALIDATE_ALL_CODEBASE to not be set in the environment passed to exec, but it was set to: " +
        validateAllCodebaseValue);
    assert.ok(npxExecCalled, "Expected npx exec to be called, but it was not.");
});
(0, cucumber_1.Given)("docker image caching is enabled", async function () {
    getBoolInputStub.withArgs("cacheDockerImage").returns(true);
    getInputStub
        .withArgs("dockerCachePath")
        .returns("/tmp/test-workspace/docker-cache");
});
(0, cucumber_1.Given)("a cached docker image tarball exists", async function () {
    cacheFileExists = true;
    dockerImageExistsInDaemon = true;
});
(0, cucumber_1.Given)("no cached docker image tarball exists", async function () {
    cacheFileExists = false;
});
(0, cucumber_1.Given)("docker image caching is disabled", async function () {
    getBoolInputStub.withArgs("cacheDockerImage").returns(false);
});
(0, cucumber_1.Then)("the docker image should be saved to the cache path", function () {
    assert.strictEqual(dockerSaveCalled, true, "Expected the Docker image to be saved to cache, but it was not.");
});
(0, cucumber_1.Then)("the docker image should be loaded from cache", function () {
    assert.strictEqual(dockerLoadCalled, true, "Expected the Docker image to be loaded from cache, but it was not.");
});
(0, cucumber_1.Then)("the docker image should not be pulled", function () {
    assert.strictEqual(dockerPullCalled, false, "Expected the Docker image to not be pulled, but it was.");
});
(0, cucumber_1.Then)("the docker image should be pulled", function () {
    assert.strictEqual(dockerPullCalled, true, "Expected the Docker image to be pulled, but it was not.");
});
(0, cucumber_1.Then)("no docker image tarball should be saved", function () {
    assert.strictEqual(dockerSaveCalled, false, "Expected no Docker image tarball to be saved, but one was.");
});
(0, cucumber_1.Given)("a cached docker image tarball exists but is corrupted", async function () {
    cacheFileExists = true;
    dockerLoadShouldFail = true;
});
(0, cucumber_1.Given)("the docker image exists locally", async function () {
    dockerImageExistsInDaemon = true;
});
(0, cucumber_1.Then)("the cache load should fail with a warning", function () {
    assert.strictEqual(dockerLoadCalled, true, "Expected docker load to be called, but it was not.");
});
