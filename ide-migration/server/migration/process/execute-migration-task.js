try {
    const MigrationService = require('ide-migration/server/migration/api/migration-service');

    const process = require('bpm/v4/process');
    const execution = process.getExecutionContext();

    process.setVariable(execution.getId(), 'migrationState', 'MIGRATION_EXECUTING');
    const userDataJson = process.getVariable(execution.getId(), 'userData');
    const userData = JSON.parse(userDataJson);
    const userDatabaseData = userData.hana;
    const connectionUrl = process.getVariable(execution.getId(), 'connectionUrl');

    const migrationService = new MigrationService();

    for (let i = 0; i < userData.du.length; i++) {
        migrationService.setupConnection(userDatabaseData.databaseSchema, userDatabaseData.username, userDatabaseData.password, connectionUrl);
        let files = migrationService.getAllFilesForDU(userData.du[i]);
        let locals = migrationService.copyFilesLocally(userData.workspace, files);
        let workspace = migrationService.createMigratedWorkspace(userData.workspace, userData.du[i]);
        let deployables = [];
        for (let i = 0; i < locals.length; i++) {
            const local = locals[i];
            deployables = migrationService.addFileToWorkspace(workspace, local.resource.getPath(), local.runLocation, local.projectName, deployables);
        }
        migrationService.handlePossibleDeployableArtifacts(deployables);
    }

    process.setVariable(execution.getId(), 'migrationState', 'MIGRATION_EXECUTED');
} catch (e) {
    console.log(err)
    console.log('error copying');
    console.log(err.message)
    process.setVariable(execution.getId(), 'migrationState', 'MIGRATION_FAILED');
    process.setVariable(execution.getId(), 'MIGRATION_FAILED_REASON', e.toString());
}