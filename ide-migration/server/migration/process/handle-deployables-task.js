const process = require('bpm/v4/process');
const execution = process.getExecutionContext();
const MigrationService = require('ide-migration/server/migration/api/migration-service');

try {
    process.setVariable(execution.getId(), 'migrationState', 'HANDLE_DEPLOYABLES_EXECUTING');
    const userDataJson = process.getVariable(execution.getId(), 'userData');
    const userData = JSON.parse(userDataJson);

    const migrationService = new MigrationService();

    for (let i = 0; i < userData.du.length; i++) {
        let locals = userData.du[i].locals;
        let deployables = [];
        for (let i = 0; i < locals.length; i++) {
            const local = locals[i];
            deployables = migrationService.collectDeployables(userData.workspace, local.path, local.runLocation, local.projectName, deployables);
        }
        migrationService.handlePossibleDeployableArtifacts(deployables);
    }
    process.setVariable(execution.getId(), 'userData', JSON.stringify(userData));
    process.setVariable(execution.getId(), 'migrationState', 'HANDLE_DEPLOYABLES_EXECUTED');
} catch (e) {
    console.log('HANDLE_DEPLOYABLES failed with error:');
    console.log(e.message)
    process.setVariable(execution.getId(), 'migrationState', 'HANDLE_DEPLOYABLES_FAILED');
    process.setVariable(execution.getId(), 'HANDLE_DEPLOYABLES_FAILED_REASON', e.toString());
}