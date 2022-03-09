import { process } from "@dirigible/bpm";
import { MigrationService } from "../api/migration-service.mjs";
import { MigrationTask } from "./task.mjs";
import { DeliveryUnitsProvider } from "../api/delivery-units-provider.mjs";
import { migrationInputStateStore } from "../api/state/migration-input-state.mjs";

export class CopyFilesTask extends MigrationTask {
    execution = process.getExecutionContext();

    constructor() {
        super("COPY_FILES_EXECUTING", "COPY_FILES_EXECUTED", "COPY_FILES_FAILED");
    }

    run() {
        const migrationState = migrationInputStateStore.getState();
        const deliveryUnitsProvider = new DeliveryUnitsProvider(migrationState.hanaCredentials, migrationState.databaseConnectionUrl);

        const migrationService = new MigrationService();

        for (const deliveryUnit of migrationState.selectedDeliveryUnitNames) {
            const files = deliveryUnitsProvider.getAllDeliveryUnitFilesMetadata(deliveryUnit);
            if (files) {
                const locals = migrationService.copyFilesLocally(deliveryUnitsProvider, migrationState.selectedWorkspaceName, files);
                deliveryUnit.locals = locals;
            }
        }
    }
}
