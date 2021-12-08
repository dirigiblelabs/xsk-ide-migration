const process = require('bpm/v4/process');
const execution = process.getExecutionContext();
const workspaceManager = require("platform/v4/workspace");

try {
    process.setVariable(execution.getId(), 'migrationState', 'WORKSPACES_LISTING');

    const workspaces = workspaceManager.getWorkspacesNames();
    process.setVariable(execution.getId(), 'workspaces', JSON.stringify(workspaces));
    process.setVariable(execution.getId(), 'migrationState', 'WORKSPACES_LISTED');
} catch (e) {
    process.setVariable(execution.getId(), 'migrationState', 'WORKSPACES_LISTING_FAILED');
    process.setVariable(execution.getId(), 'WORKSPACES_LISTING_FAILED_REASON', e.toString());
}
