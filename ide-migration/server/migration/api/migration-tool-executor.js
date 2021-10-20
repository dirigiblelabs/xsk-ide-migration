const exec = require("core/v4/exec");
const config = require("core/v4/configurations");

class MigrationToolExecutor {
    constructor() {
        config.set("DIRIGIBLE_EXEC_DISABLE_COMMAND_LOGGING", "false");
    }

    execute(script, data) {
        return exec.exec(script, data);
    }
}

module.exports = MigrationToolExecutor;