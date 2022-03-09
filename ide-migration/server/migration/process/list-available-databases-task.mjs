import { process } from "@dirigible/bpm";
import { NeoDatabasesService } from "../api/neo-databases-service.mjs";
import { MigrationTask } from "./task.mjs";
import { migrationInputStateStore } from "../api/state/migration-input-state.mjs";

export class ListAvailableDatabasesTask extends MigrationTask {
    execution = process.getExecutionContext();

    constructor() {
        super("DATABASES_LISTING", "DATABASES_LISTED", "DATABASES_LISTING_FAILED");
    }

    run() {
        const migrationState = migrationInputStateStore.getState();

        const account = migrationState.neoCredentials.subaccount;
        const host = migrationState.neoCredentials.hostName;
        const token = migrationState.token;

        const neoDatabasesService = new NeoDatabasesService();
        const databases = neoDatabasesService.getAvailableDatabases(
            account,
            host,
            token
        );

        process.setVariable(this.execution.getId(), "databases", JSON.stringify(databases));
    }
}
