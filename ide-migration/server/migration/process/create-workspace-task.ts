// @ts-ignore
import { process } from "@dirigible/bpm";
const execution = process.getExecutionContext();
import { MigrationService } from "../api/migration-service";
import { TrackService } from "../api/track-service";
const trackService = new TrackService();
try {
	process.setVariable(execution.getId(), 'migrationState', 'EXECUTING_CREATE_WORKSPACE');
	trackService.updateMigrationStatus('CREATING WORKSPACE');
	const userDataJson = process.getVariable(execution.getId(), 'userData');
	const userData = JSON.parse(userDataJson);

	const migrationService = new MigrationService();

	for (let i = 0; i < userData.du.length; i++) {
		migrationService.createMigratedWorkspace(userData.workspace);
	}
	process.setVariable(execution.getId(), 'userData', JSON.stringify(userData));
	process.setVariable(execution.getId(), 'migrationState', 'WORKSPACE_CREATE_EXECUTED');
	trackService.updateMigrationStatus('CREATING WORKSPACE EXECUTED');
} catch (e: any) {
	console.log('WORKSPACE_CREATE failed with error:');
	console.log(e.message);
	process.setVariable(execution.getId(), 'migrationState', 'WORKSPACE_CREATE_FAILED');
	trackService.updateMigrationStatus('CREATING WORKSPACE FAILED');
	process.setVariable(execution.getId(), 'WORKSPACE_CREATE_FAILED_REASON', e.toString());
}
