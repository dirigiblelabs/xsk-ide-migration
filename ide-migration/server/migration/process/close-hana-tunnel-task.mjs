import { process } from "@dirigible/bpm";
import { TrackService } from "../../../../../../Downloads/ide-migration 7/server/migration/api/track-service.mjs";
import { NeoTunnelService } from "../../../../../../Downloads/ide-migration 7/server/migration/api/neo-tunnel-service.mjs";

export class CloseHanaTunnelTask {
    execution = process.getExecutionContext();
    trackService = new TrackService();

    run() {
        try {
            process.setVariable(this.execution.getId(), "migrationState", "TUNNEL_CLOSING");
            this.trackService.updateMigrationStatus("TUNNEL_CLOSING");

            const userDataJson = process.getVariable(this.execution.getId(), "userData");
            const userData = JSON.parse(userDataJson);

            const neoTunnelService = new NeoTunnelService();
            neoTunnelService.closeTunnel(userData.connectionId);

            process.setVariable(this.execution.getId(), "migrationState", "TUNNEL_CLOSED");
            this.trackService.updateMigrationStatus("TUNNEL CLOSED");
        } catch (e) {
            process.setVariable(this.execution.getId(), "migrationState", "TUNNEL_CLOSING_FAILED");
            this.trackService.updateMigrationStatus("TUNNEL CLOSING FAILED");
            process.setVariable(this.execution.getId(), "TUNNEL_CLOSING_FAILED_REASON", e.toString());
        }
    }
}
