// @ts-ignore
import { process } from "@dirigible/bpm";
const execution = process.getExecutionContext();
import { MigrationService } from "../api/migration-service";
// const git = require('git/v4/client'); 

import { TrackService } from "../api/track-service";
const trackService = new TrackService();
const XSKProjectMigrationInterceptor = Java.type("com.sap.xsk.modificators.XSKProjectMigrationInterceptor")

try {
	process.setVariable(execution.getId(), 'migrationState', 'POPULATING_PROJECTS');
	trackService.updateMigrationStatus('POPULATING PROJECTS');
	const userDataJson = process.getVariable(execution.getId(), 'userData');
	const userData = JSON.parse(userDataJson);

	const migrationService = new MigrationService();
	const workspace = userData.workspace;
    const modificator = new XSKProjectMigrationInterceptor();

    for (const deliveryUnit of userData.du) {
        const locals = deliveryUnit.locals;
        if (!(locals && locals.length > 0)) {
            throw ("Delivery unit is empty");
        }
        for (const local of locals) {
            migrationService.addFileToWorkspace(workspace, local.repositoryPath, local.relativePath, local.projectName);
        }
        const projectName = locals[0].projectName;
        modificator.interceptXSKProject(workspace, projectName);
        org.eclipse.dirigible.api.v4.git.GitFacade.initRepository('migration', '', workspace, locals[0].projectName, locals[0].projectName, "Migration initial commit");

        const generated = deliveryUnit['deployableArtifactsResult']['generated'];
        for (const gen of generated) {
            migrationService.addFileToWorkspace(workspace, gen.repositoryPath, gen.relativePath, locals[0].projectName);
        }
        let repositoryName = locals[0].projectName;
        org.eclipse.dirigible.api.v4.git.GitFacade.commit('migration', '', userData.workspace, repositoryName, 'Artifacts handled', true);
    }
    process.setVariable(execution.getId(), 'migrationState', 'MIGRATION_EXECUTED');
	trackService.updateMigrationStatus('MIGRATION EXECUTED');
} catch (e: any) {
	console.log('POPULATING_PROJECTS failed with error:');
	console.log(e.message);
	process.setVariable(execution.getId(), 'migrationState', 'POPULATING_PROJECTS_FAILED');
	trackService.updateMigrationStatus('POPULATING PROJECTS FAILED');
	process.setVariable(execution.getId(), 'POPULATING_PROJECTS_FAILED_REASON', e.toString());
}
