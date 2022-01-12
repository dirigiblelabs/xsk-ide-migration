// @ts-ignore
import { exec, configurations } from "@dirigible/core";
const DIRIGIBLE_EXEC_COMMAND_LOGGING_ENABLED = "DIRIGIBLE_EXEC_COMMAND_LOGGING_ENABLED";
export class MigrationToolExecutor {
    execute(script, data) {
        const defaultLoggingConfig = configurations.get(DIRIGIBLE_EXEC_COMMAND_LOGGING_ENABLED);
        configurations.set(DIRIGIBLE_EXEC_COMMAND_LOGGING_ENABLED, "false");
        const execResult = exec.exec(script, data);
        if (defaultLoggingConfig) {
            configurations.set(DIRIGIBLE_EXEC_COMMAND_LOGGING_ENABLED, defaultLoggingConfig);
        }
        return execResult;
    }
}
