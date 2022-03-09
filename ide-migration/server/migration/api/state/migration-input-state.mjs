import { process } from "@dirigible/bpm";

export const migrationInputStateStore = {
    saveState(migrationInputState) {
        const execution = process.getExecutionContext();
        const serializedMigrationInputState = JSON.stringify(migrationInputState);
        process.setVariable(execution.getId(), getMigrationInputStateKey(), serializedMigrationInputState);
    },

    getState() {
        const execution = process.getExecutionContext();
        const serializedMigrationInputState = process.getVariable(execution.getId(), getMigrationInputStateKey());
        return JSON.parse(serializedMigrationInputState);
    }
}

export function getMigrationInputStateKey() {
    return "migrationInputState";
}

export class MigrationState {
    constructor(
        hanaCredentials,
        neoCredentials,
        token
    ) {
        this.hanaCredentials = hanaCredentials;
        this.neoCredentials = neoCredentials;
        this.token = token;
    }

    selectedDeliveryUnitNames;
    selectedWorkspaceName;
    databaseConnectionUrl;
    tunnelConnectionId
}