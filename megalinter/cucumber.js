const path = require("path");

module.exports = {
  default: {
    require: [path.join(__dirname, "features/step_definitions/run.steps.js")],
    format: ["progress", "json:cucumber-report.json"],
  },
};
