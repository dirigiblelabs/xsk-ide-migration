const process = require('bpm/v4/process');
const execution = process.getExecutionContext();

process.setVariable(execution.getId(), 'migrationState', 'TUNNEL_CLOSING');

const userDataJson = process.getVariable(execution.getId(), 'userData');
const userData = JSON.parse(userDataJson);

const NeoTunnelService = require('ide-migration/server/migration/api/neo-tunnel-service');
const neoTunnelService = new NeoTunnelService();
neoTunnelService.closeTunnel(userData.connectionId);

process.setVariable(execution.getId(), 'migrationState', 'TUNNEL_CLOSED');