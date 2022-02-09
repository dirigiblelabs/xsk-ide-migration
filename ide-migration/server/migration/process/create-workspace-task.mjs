import { process } from "@dirigible/bpm";
import { MigrationService } from "../api/migration-service.mjs";
import { TrackService } from "../api/track-service.mjs";

export class CreateWorkspaceTask {
    execution = process.getExecutionContext();
    trackService = new TrackService();

    run() {
        try {
            console.log("In create workspace")
            process.setVariable(this.execution.getId(), "migrationState", "EXECUTING_CREATE_WORKSPACE");
            this.trackService.updateMigrationStatus("CREATING WORKSPACE");
            const userDataJson = process.getVariable(this.execution.getId(), "userData");
            const migrationType = process.getVariable(this.execution.getId(), "migrationType")
            console.log("Status" +  migrationType);
            const userData = JSON.parse(userDataJson);

            const migrationService = new MigrationService();


            if (migrationType ==='FROM_LOCAL_ZIP') {
                migrationService.createMigratedWorkspace(userData.selectedWorkspace);
            }else{
                for (let i = 0; i < userData.du.length; i++) {
                    migrationService.createMigratedWorkspace(userData.workspace, userData.du[i]);
                }
            }


            process.setVariable(this.execution.getId(), "userData", JSON.stringify(userData));
            process.setVariable(this.execution.getId(), "migrationState", "WORKSPACE_CREATE_EXECUTED");
            this.trackService.updateMigrationStatus("CREATING WORKSPACE EXECUTED");
        } catch (e) {
            console.log("WORKSPACE_CREATE failed with error:");
            console.log(e.message);
            process.setVariable(this.execution.getId(), "migrationState", "WORKSPACE_CREATE_FAILED");
            this.trackService.updateMigrationStatus("CREATING WORKSPACE FAILED");
            process.setVariable(this.execution.getId(), "WORKSPACE_CREATE_FAILED_REASON", e.toString());
        }
    }
}
