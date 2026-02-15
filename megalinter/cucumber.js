const path = require("path");

module.exports = {
  default: {
    paths: [path.join(__dirname, "features/*.feature")],
    require: [path.join(__dirname, "features/step_definitions/run.steps.js")],
    format: ["progress", "json:cucumber-report.json"],
  },
};
