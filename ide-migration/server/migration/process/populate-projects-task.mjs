import { process } from "@dirigible/bpm";
import { MigrationService } from "../api/migration-service.mjs";
import { MigrationTask } from "./task.mjs";
import { configurations as config } from "@dirigible/core";
import { DiffToolService } from "../api/diff-tool-executor.mjs";
import { ProjectFileContentTransformer } from "../api/transformations/project-file-content-transformer.mjs";
import { migrationInputStateStore } from "../api/state/migration-input-state.mjs";

export class PopulateProjectsTask extends MigrationTask {
    execution = process.getExecutionContext();
    projectFileContentTransformer = new ProjectFileContentTransformer();

    constructor() {
        super("POPULATING_PROJECTS", "MIGRATION_EXECUTED", "POPULATING_PROJECTS_FAILED");
    }

    run() {
        const migrationState = migrationInputStateStore.getState();
        const userDataJson = process.getVariable(this.execution.getId(), "userData");
        const userData = JSON.parse(userDataJson);

        const migrationService = new MigrationService();
        const workspace = migrationState.selectedWorkspaceName;

        for (const deliveryUnit of migrationState.selectedDeliveryUnitNames) {
            const localFiles = deliveryUnit.locals;
            if (!(localFiles && localFiles.length > 0)) {
                console.warn("Delivery unit is empty.");
                continue;
            }

            migrationService.addFilesWithoutGenerated(localFiles);
            migrationService.addGeneratedFiles(userData, deliveryUnit, workspace, localFiles);
            this.projectFileContentTransformer.performExternalModifications(workspace, localFiles);

            process.setVariable(this.execution.getId(), "migrationState", "MIGRATION_EXECUTED");

            const workspaceHolderFolder = config.get("user.dir") + "/target/dirigible/repository/root"
            const diffTool = new DiffToolService();
            const diffViewData = diffTool.diffFolders(`${workspaceHolderFolder}/${workspace}_unmodified`, `${workspaceHolderFolder}/${workspace}`);
            process.setVariable(this.execution.getId(), "diffViewData", JSON.stringify(diffViewData));
        }
    }
}
