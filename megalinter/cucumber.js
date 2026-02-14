module.exports = {
  default: {
    require: ["features/step_definitions/run.steps.js"],
    format: ["progress", "json:cucumber-report.json"],
  },
};
