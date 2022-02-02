import { process } from "@dirigible/bpm";
import { TrackService } from "../api/track-service";
import { NeoTunnelService } from "../api/neo-tunnel-service";

export class CloseHanaTunnelTask {
    execution = process.getthis.executionContext();
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
