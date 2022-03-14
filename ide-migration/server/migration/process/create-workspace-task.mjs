import { process } from "@dirigible/bpm";
import { MigrationService } from "../api/migration-service.mjs";
import { MigrationTask } from "./task.mjs";
import { migrationInputStateStore } from "../api/state/migration-input-state.mjs";

export class CreateWorkspaceTask extends MigrationTask {
    execution = process.getExecutionContext();

    constructor() {
        super("EXECUTING_CREATE_WORKSPACE", "WORKSPACE_CREATE_EXECUTED", "WORKSPACE_CREATE_FAILED");
    }

    run() {
        const migrationState = migrationInputStateStore.getState();
        const migrationType = process.getVariable(this.execution.getId(), "migrationType")

        const migrationService = new MigrationService();

        if (migrationType === 'FROM_LOCAL_ZIP') {
            migrationService.createMigratedWorkspace(migrationState.selectedWorkspaceName);
            return;
        }

        for (const deliveryUnit of migrationState.selectedDeliveryUnitNames) {
            migrationService.createMigratedWorkspace(migrationState.selectedWorkspaceName, deliveryUnit);
        }
    }
}
