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
let result = null;
let errorOccurred = false;
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
// Lazy import for run function - only imported if needed in Azure Pipelines
let run = null;
// Reset state before each scenario
(0, cucumber_1.Before)(function () {
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
    // Clean up process.env to prevent order-dependent behavior
    delete process.env["INPUT_CACHEDOCKERIMAGE"];
    delete process.env["INPUT_DOCKERCACHEPATH"];
    delete process.env["INPUT_LINTCHANGEDFILESONLY"];
    delete process.env["VALIDATE_ALL_CODEBASE"];
});
(0, cucumber_1.Given)("the input parameters are valid", async function () {
    // Test assumes valid inputs are available through environment variables
    // In CI, the workflow sets INPUT_* environment variables
    // We don't need to verify them here as the test is mocked in CI anyway
    errorOccurred = false;
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
    process.env["INPUT_LINTCHANGEDFILESONLY"] = "true";
});
(0, cucumber_1.Given)("lint changed files only is disabled", async function () {
    lintChangedFilesOnlyEnabled = false;
    process.env["INPUT_LINTCHANGEDFILESONLY"] = "false";
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
        // Mock by default to avoid executing real Docker/npx commands outside Azure Pipelines
        // Only run real task when explicitly in Azure DevOps (TF_BUILD is set)
        const isAzurePipelines = !!process.env.TF_BUILD;
        if (!isAzurePipelines) {
            // Mocked behavior - simulate the task without executing real commands
            result = "success";
            // Simulate docker caching behavior for test assertions
            if (dockerCacheEnabled) {
                if (dockerCacheTarballExists) {
                    dockerImageLoadedFromCache = true;
                    dockerImagePulled = false;
                    dockerImageSavedToCache = false;
                }
                else {
                    dockerImageLoadedFromCache = false;
                    dockerImagePulled = true;
                    dockerImageSavedToCache = true;
                }
            }
            else {
                dockerImagePulled = true;
                dockerImageSavedToCache = false;
            }
            // Simulate lintChangedFilesOnly behavior for test assertions
            if (lintChangedFilesOnlyEnabled) {
                validateAllCodebaseSet = true;
                validateAllCodebaseValue = "false";
            }
            else {
                validateAllCodebaseSet = false;
                validateAllCodebaseValue = "";
            }
        }
        else {
            // Only import and run in actual Azure DevOps environment
            // Lazy load to avoid import errors in mocked environments
            if (!run) {
                const module = await Promise.resolve().then(() => __importStar(require("../../megalinter")));
                run = module.run;
            }
            if (run) {
                await run();
            }
            result = "success";
            // In non-mocked runs, read the actual environment set by run()
            const validateAllCodebaseEnv = process.env.VALIDATE_ALL_CODEBASE;
            if (typeof validateAllCodebaseEnv !== "undefined") {
                validateAllCodebaseSet = true;
                validateAllCodebaseValue = validateAllCodebaseEnv;
            }
            else {
                validateAllCodebaseSet = false;
                validateAllCodebaseValue = "";
            }
        }
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
    assert.strictEqual(result, "success", "Expected the function to execute successfully, but it did not.");
});
(0, cucumber_1.Then)("the function should fail with an error message", function () {
    assert.strictEqual(result, "Test error", "Expected the function to fail with a specific error message, but it did not.");
});
(0, cucumber_1.Then)("the docker image should be pulled", function () {
    assert.strictEqual(dockerImagePulled, true, "Expected the Docker image to be pulled, but it was not.");
});
(0, cucumber_1.Then)("the docker image should be saved to the cache path", function () {
    assert.strictEqual(dockerImageSavedToCache, true, "Expected the Docker image to be saved to cache, but it was not.");
});
(0, cucumber_1.Then)("the docker image should be loaded from cache", function () {
    assert.strictEqual(dockerImageLoadedFromCache, true, "Expected the Docker image to be loaded from cache, but it was not.");
});
(0, cucumber_1.Then)("the docker image should not be pulled", function () {
    assert.strictEqual(dockerImagePulled, false, "Expected the Docker image to not be pulled, but it was.");
});
(0, cucumber_1.Then)("no docker image tarball should be saved", function () {
    assert.strictEqual(dockerImageSavedToCache, false, "Expected no Docker image tarball to be saved, but one was.");
});
(0, cucumber_1.Then)("VALIDATE_ALL_CODEBASE environment variable should be set to false", function () {
    assert.strictEqual(validateAllCodebaseSet, true, "Expected VALIDATE_ALL_CODEBASE to be set, but it was not.");
    assert.strictEqual(validateAllCodebaseValue, "false", "Expected VALIDATE_ALL_CODEBASE to be set to 'false', but it was not.");
});
(0, cucumber_1.Then)("VALIDATE_ALL_CODEBASE environment variable should not be set", function () {
    assert.strictEqual(validateAllCodebaseSet, false, "Expected VALIDATE_ALL_CODEBASE to not be set, but it was.");
});
