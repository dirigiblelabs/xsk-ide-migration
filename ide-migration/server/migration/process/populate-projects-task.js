const process = require('bpm/v4/process');
const execution = process.getExecutionContext();

try {
    const MigrationService = require('ide-migration/server/migration/api/migration-service');

    process.setVariable(execution.getId(), 'migrationState', 'POPULATING_PROJECTS');
    const userDataJson = process.getVariable(execution.getId(), 'userData');
    const userData = JSON.parse(userDataJson);

    const migrationService = new MigrationService();

    for (let i = 0; i < userData.du.length; i++) {
        let locals = userData.du[i].locals;
        let workspace = userData.workspace;
        for (let i = 0; i < locals.length; i++) {
            const local = locals[i];
            migrationService.addFileToWorkspace(workspace, local.path, local.projectName);
        }
    }
    process.setVariable(execution.getId(), 'migrationState', 'MIGRATION_EXECUTED');
} catch (e) {
    console.log("POPULATING_PROJECTS failed with error:");
    console.log(e.message);
    process.setVariable(execution.getId(), 'migrationState', 'POPULATING_PROJECTS_FAILED');
    process.setVariable(execution.getId(), 'POPULATING_PROJECTS_FAILED_REASON', e.toString());
}