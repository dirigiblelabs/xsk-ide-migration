const process = require('bpm/v4/process');
const execution = process.getExecutionContext();

process.setVariable(execution.getId(), 'migrationState', 'TUNNEL_CLOSING');

const userDataJson = process.getVariable(execution.getId(), 'userData');
const userData = JSON.parse(userDataJson);

const TunnelController = require('ide-migration/server/migration/controllers/tunnel-controller');
const tunnelController = new TunnelController();
tunnelController.closeTunnel(userData.sessionId);

process.setVariable(execution.getId(), 'migrationState', 'TUNNEL_CLOSED');