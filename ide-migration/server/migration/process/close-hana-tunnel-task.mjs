import { process } from "@dirigible/bpm";
import { NeoTunnelService } from "../api/neo-tunnel-service.mjs";
import { MigrationTask } from "./task.mjs";
import { migrationInputStateStore } from "../api/state/migration-input-state.mjs";

export class CloseHanaTunnelTask extends MigrationTask {
    execution = process.getExecutionContext();

    constructor() {
        super("TUNNEL_CLOSING", "TUNNEL_CLOSED", "TUNNEL_CLOSING_FAILED");
    }

    run() {
        const migrationState = migrationInputStateStore.getState();
        const neoTunnelService = new NeoTunnelService();
        neoTunnelService.closeTunnel(migrationState.tunnelConnectionId);
    }
}
