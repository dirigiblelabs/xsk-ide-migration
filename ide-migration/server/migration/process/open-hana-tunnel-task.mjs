import { process } from "@dirigible/bpm";
import { NeoTunnelService } from "../api/neo-tunnel-service.mjs";
import { MigrationTask } from "./task.mjs";
import { migrationInputStateStore } from "../api/state/migration-input-state.mjs";

export class OpenHanaTunnelTask extends MigrationTask {
    execution = process.getExecutionContext();

    constructor() {
        super("TUNNEL_OPENING", "TUNNEL_OPENED", "TUNNEL_OPENING_FAILED");
    }

    run() {
        const migrationState = migrationInputStateStore.getState();

        const account = migrationState.neoCredentials.subaccount;
        const host = migrationState.neoCredentials.hostName;
        const databaseId = migrationState.hanaCredentials.databaseSchema;
        const token = migrationState.token;

        const neoTunnelService = new NeoTunnelService();

        const openedTunnelData = neoTunnelService.openTunnel(
            account,
            host,
            token,
            databaseId
        );

        migrationState.tunnelConnectionId = openedTunnelData.tunnelConnectionId.toString();
        migrationState.databaseConnectionUrl = openedTunnelData.jdbcUrl;
        migrationInputStateStore.saveState(migrationState);
    }
}
