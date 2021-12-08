const process = require('bpm/v4/process');
const execution = process.getExecutionContext();
const MigrationService = require('ide-migration/server/migration/api/migration-service');

try {
    process.setVariable(execution.getId(), 'migrationState', 'COPY_FILES_EXECUTING');
    const userDataJson = process.getVariable(execution.getId(), 'userData');
    const userData = JSON.parse(userDataJson);
    const userDatabaseData = userData.hana;
    const connectionUrl = process.getVariable(execution.getId(), 'connectionUrl');

    const migrationService = new MigrationService();

    for (const deliveryUnit of userData.du) {
        migrationService.setupConnection(userDatabaseData.databaseSchema, userDatabaseData.username, userDatabaseData.password, connectionUrl);
        const files = migrationService.getAllFilesForDU(deliveryUnit);
        const locals = migrationService.copyFilesLocally(userData.workspace, files);
        deliveryUnit.locals = locals;
    }
    
    process.setVariable(execution.getId(), 'userData', JSON.stringify(userData));
    process.setVariable(execution.getId(), 'migrationState', 'COPY_FILES_EXECUTED');
} catch (e) {
    console.log('COPY_FILES failed with error:');
    console.log(e.message);
    process.setVariable(execution.getId(), 'migrationState', 'COPY_FILES_FAILED');
    process.setVariable(execution.getId(), 'COPY_FILES_FAILED_REASON', e.toString());
}