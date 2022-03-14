import { process } from "@dirigible/bpm";
import { MigrationService } from "../api/migration-service.mjs";
import { MigrationTask } from "./task.mjs";
import { DeliveryUnitsProvider } from "../api/delivery-units-provider.mjs";
import { migrationInputStateStore } from "../api/state/migration-input-state.mjs";
import { deliveryUnitProjectStateStore } from "../api/state/delivery-unit-project-state.mjs";

export class CopyFilesTask extends MigrationTask {
    execution = process.getExecutionContext();

    constructor() {
        super("COPY_FILES_EXECUTING", "COPY_FILES_EXECUTED", "COPY_FILES_FAILED");
    }

    run() {
        const migrationState = migrationInputStateStore.getState();
        const deliveryUnitsProvider = new DeliveryUnitsProvider(migrationState.hanaCredentials, migrationState.databaseConnectionUrl);

        const migrationService = new MigrationService();

        for (const deliveryUnitName of migrationState.selectedDeliveryUnitNames) {
            const filesMetadata = deliveryUnitsProvider.getAllDeliveryUnitFilesMetadata(deliveryUnitName);
            if (filesMetadata) {
                const locals = migrationService.downloadAllDeliveryUnitFilesLocally(deliveryUnitsProvider, deliveryUnitName, migrationState.selectedWorkspaceName, filesMetadata);

            }
        }
    }
}
