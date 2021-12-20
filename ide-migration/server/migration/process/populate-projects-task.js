const process = require('bpm/v4/process');
const execution = process.getExecutionContext();
const MigrationService = require('ide-migration/server/migration/api/migration-service');
const git = require('utils/git');
var repositoryManager = require("platform/v4/repository");

try {
    process.setVariable(execution.getId(), 'migrationState', 'POPULATING_PROJECTS');
    const userDataJson = process.getVariable(execution.getId(), 'userData');
    const userData = JSON.parse(userDataJson);

    const migrationService = new MigrationService();
    const workspace = userData.workspace;

    for (const deliveryUnit of userData.du) {
        const locals = deliveryUnit.locals;
        if (!(locals && locals.length > 0)) {
            throw ("Delivery unit is empty");
        }
        for (const local of locals) {
            migrationService.addFileToWorkspace(workspace, local.repositoryPath, local.relativePath, local.projectName);
        }
        git.initRepository('migration', '', workspace, locals[0].projectName, locals[0].projectName, "Migration initial commit");

        const generated = deliveryUnit['deployableArtifactsResult']['generated'];
        for (const gen of generated) {
            migrationService.addFileToWorkspace(workspace, gen.repositoryPath, gen.relativePath, locals[0].projectName);
        }
        let repositoryName = locals[0].projectName;
        git.commit('migration', '', userData.workspace, repositoryName, 'Artifacts handled', true);

        repositoryManager.deleteCollection(userData.workspace);

    }
    process.setVariable(execution.getId(), 'migrationState', 'MIGRATION_EXECUTED');
} catch (e) {
    console.log("POPULATING_PROJECTS failed with error:");
    console.log(e.message);
    process.setVariable(execution.getId(), 'migrationState', 'POPULATING_PROJECTS_FAILED');
    process.setVariable(execution.getId(), 'POPULATING_PROJECTS_FAILED_REASON', e.toString());
}