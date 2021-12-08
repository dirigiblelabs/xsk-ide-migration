const process = require('bpm/v4/process');
const execution = process.getExecutionContext();
const MigrationService = require('ide-migration/server/migration/api/migration-service');

try {
    process.setVariable(execution.getId(), 'migrationState', 'POPULATING_PROJECTS');
    const userDataJson = process.getVariable(execution.getId(), 'userData');
    const userData = JSON.parse(userDataJson);

    const migrationService = new MigrationService();
    const workspace = userData.workspace;

    for (const deliveryUnit of userData.du) {
        const locals = deliveryUnit.locals;
        for (const local of locals) {
            migrationService.addFileToWorkspace(workspace, local.repositoryPath, local.relativePath, local.projectName);
        }
    }
    process.setVariable(execution.getId(), 'migrationState', 'MIGRATION_EXECUTED');
} catch (e) {
    console.log("POPULATING_PROJECTS failed with error:");
    console.log(e.message);
    process.setVariable(execution.getId(), 'migrationState', 'POPULATING_PROJECTS_FAILED');
    process.setVariable(execution.getId(), 'POPULATING_PROJECTS_FAILED_REASON', e.toString());
}