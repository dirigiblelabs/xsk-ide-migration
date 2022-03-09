import { process } from "@dirigible/bpm";
import { MigrationTask } from "./task.mjs";
import { DeliveryUnitsProvider } from "../api/delivery-units-provider.mjs";
import { migrationInputStateStore } from "../api/state/migration-input-state.mjs";

export class ListDeliveryUnitsTask extends MigrationTask {
    execution = process.getExecutionContext();

    constructor() {
        super("DELIVERY_UNITS_LISTING", "DELIVERY_UNITS_LISTED", "DELIVERY_UNITS_LISTING_FAILED");
    }

    run() {
        const migrationState = migrationInputStateStore.getState();

        const deliveryUnitsProvider = new DeliveryUnitsProvider(
            migrationState.hanaCredentials, 
            migrationState.databaseConnectionUrl
        );

        const deliveryUnits = deliveryUnitsProvider.getAllDeliveryUnitNames();
        process.setVariable(this.execution.getId(), "deliveryUnits", JSON.stringify(deliveryUnits));
    }
}
