module.exports = {
  default: {
    paths: ["features/**/*.feature"],
    require: ["features/step_definitions/run.steps.js"],
    format: ["progress"],
  },
};
