const MigrationService = require('ide-migration/server/migration/api/migration-service');
const TrackService = require('ide-migration/server/migration/api/track-service')
const process = require('bpm/v4/process');
const execution = process.getExecutionContext();
const migrationService = new MigrationService();
const trackService = new TrackService()
trackService.setupTable()

try {
    process.setVariable(execution.getId(), 'migrationState', 'MIGRATION_EXECUTING');
    const userDataJson = process.getVariable(execution.getId(), 'userData');
    const userData = JSON.parse(userDataJson);
    const userDatabaseData = userData.hana;
    const connectionUrl = process.getVariable(execution.getId(), 'connectionUrl');

    for (let i = 0; i < userData.du.length; i++) {
        try {
            trackService.addEntry(userData.du[i].name, Date.now(), 'QUEUED');
        } catch (e) {}
    }
    for (let i = 0; i < userData.du.length; i++) {
        console.log(`MIGRATING ${userData.du[i].name} IN WORKSPACE ${userData.workspace} (${(i + 1).toString()} of ${userData.du.length})`);
        try {
            try {
                trackService.updateOnStart(userData.du[i].name);
            } catch (e) {
            }

            migrationService.setupConnection(userDatabaseData.databaseSchema, userDatabaseData.username, userDatabaseData.password, connectionUrl);
            migrationService.copyAllFilesForDu(
                {
                    name: userData.du[i].name,
                    vendor: userData.du[i].vendor
                },
                userData.workspace
            );

            try {
                trackService.updateEntry(userData.du[i].name);
            } catch (e) {
            }

        } catch {
            trackService.updateOnFail(userData.du[i].name);
        }
    }
    process.setVariable(execution.getId(), 'migrationState', 'MIGRATION_EXECUTED');
} catch (e) {
    process.setVariable(execution.getId(), 'migrationState', 'MIGRATION_FAILED');
    process.setVariable(execution.getId(), 'MIGRATION_FAILED_REASON', e.toString());
}
