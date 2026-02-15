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
    sandbox.stub(tl, "tool").callsFake((tool) => {
        const mockToolRunner = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            arg: sandbox.stub().callsFake((_args) => {
                return mockToolRunner;
            }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            exec: sandbox.stub().callsFake(async (options) => {
                if (tool === "npx") {
                    capturedExecOptions = options;
                    npxExecCalled = true;
                }
                return 0;
            }),
        };
        return mockToolRunner;
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
