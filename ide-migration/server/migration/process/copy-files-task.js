try {
    const MigrationService = require('ide-migration/server/migration/api/migration-service');

    const process = require('bpm/v4/process');
    const execution = process.getExecutionContext();

    process.setVariable(execution.getId(), 'migrationState', 'COPY_FILES_EXECUTING');
    const userDataJson = process.getVariable(execution.getId(), 'userData');
    const userData = JSON.parse(userDataJson);
    const userDatabaseData = userData.hana;
    const connectionUrl = process.getVariable(execution.getId(), 'connectionUrl');

    const migrationService = new MigrationService();

    for (let i = 0; i < userData.du.length; i++) {
        migrationService.setupConnection(userDatabaseData.databaseSchema, userDatabaseData.username, userDatabaseData.password, connectionUrl);
        let files = migrationService.getAllFilesForDU(userData.du[i]);
        let locals = migrationService.copyFilesLocally(userData.workspace, files);
        userData.du['locals'] = locals;
    }
    process.setVariable(execution.getId(), 'userData', JSON.stringify(userData));
    process.setVariable(execution.getId(), 'migrationState', 'COPY_FILES_EXECUTED');
} catch (e) {
    console.log(err)
    process.setVariable(execution.getId(), 'migrationState', 'COPY_FILES_FAILED');
    process.setVariable(execution.getId(), 'COPY_FILES_FAILED_REASON', e.toString());
}