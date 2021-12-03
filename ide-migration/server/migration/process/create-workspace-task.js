const process = require('bpm/v4/process');
const execution = process.getExecutionContext();

try {
    const MigrationService = require('ide-migration/server/migration/api/migration-service');

    process.setVariable(execution.getId(), 'migrationState', 'EXECUTING_CREATE_WORKSPACE');
    const userDataJson = process.getVariable(execution.getId(), 'userData');
    const userData = JSON.parse(userDataJson);

    const migrationService = new MigrationService();

    for (let i = 0; i < userData.du.length; i++) {
        migrationService.createMigratedWorkspace(userData.workspace, userData.du[i]);
    }
    process.setVariable(execution.getId(), 'userData', JSON.stringify(userData));
    process.setVariable(execution.getId(), 'migrationState', 'WORKSPACE_CREATE_EXECUTED');
} catch (e) {
    console.log('WORKSPACE_CREATE failed with error:');
    console.log(e.message);
    process.setVariable(execution.getId(), 'migrationState', 'WORKSPACE_CREATE_FAILED');
    process.setVariable(execution.getId(), 'WORKSPACE_CREATE_FAILED_REASON', e.toString());
}