import { process } from "@dirigible/bpm";
import { MigrationService } from "../api/migration-service.mjs";
import { MigrationTask } from "./task.mjs";
import { configurations as config } from "@dirigible/core";
import { TrackService } from "../api/track-service";
import { DiffToolService } from "../api/diff-tool-executor.mjs";
import { MigrationDB } from "../api/migration-db.mjs";

export class PopulateProjectsTask extends MigrationTask {
    execution = process.getExecutionContext();

    constructor() {
        super("POPULATING_PROJECTS", "MIGRATION_EXECUTED", "POPULATING_PROJECTS_FAILED");
    }

    run() {
        const userDataJson = process.getVariable(this.execution.getId(), "userData");
        const userData = JSON.parse(userDataJson);

        const migrationService = new MigrationService();
        const workspace = userData.workspace;
        for (const deliveryUnit of userData.du) {
            const localFiles = deliveryUnit.locals;
            if (!(localFiles && localFiles.length > 0)) {
                console.warn("Delivery unit is empty.");
                continue;
            }

            console.log("START ADDFILESWITHOUTGENERATED");
            migrationService.addFilesWithoutGenerated(workspace, localFiles);
            console.log("START ADDGENERATED");
            migrationService.addGeneratedFiles(deliveryUnit, workspace, localFiles);
            console.log("START MODIFYFILES");
            migrationService.modifyFiles(workspace, localFiles);
            console.log("START COMMIT");
            migrationService.commitProjectModifications(workspace, localFiles);

        }

        process.setVariable(this.execution.getId(), "migrationState", "MIGRATION_EXECUTED");
        this.trackService.updateMigrationStatus("MIGRATION EXECUTED");

        const workspaceHolderFolder = config.get("user.dir") + "/target/dirigible/repository/root"
        const diffTool = new DiffToolService();
        const diffViewData = diffTool.diffFolders(`${workspaceHolderFolder}/${workspace}_unmodified`, `${workspaceHolderFolder}/${workspace}`);
        migrationService.removeTemporaryFolders(workspace);
        process.setVariable(this.execution.getId(), "diffViewData", JSON.stringify(diffViewData));
    }
}
