const MigrationController = require('ide-migration/server/migration/controllers/migrate');
const TunnelController = require('ide-migration/server/migration/controllers/tunnel-controller');
const tasksService = require('bpm/v4/tasks');
const processService = require('bpm/v4/process');

class MigrationFacade {

    constructor() {
        console.log("Migration facade initialized");
        this.migrationController = new MigrationController();
        this.tunnelController = new TunnelController();
    }

    startProcess(ctx, req, res) {
        var process = require('bpm/v4/process');
        const userDataJson = req.getJSON(); // "{\"neo\":{\"hostName\":\"eu2.hana.ondemand.com\",\"subaccount\":\"e6c9b8dff\",\"username\":\"v.mutafov@sap.com\",\"password\":\"test123\"},\"hana\":{\"databaseSchema\":\"slbinno\",\"username\":\"C5326377\",\"password\":\"test123321\"},\"connectionId\":\"63e31364-7d7e-4740-9f56-e05579268e58\",\"vendor\":\"migration.sap.com\",\"workspace\":\"workspace\",\"du\":\"MIGR_TOOLS\"}"

        const processInstanceId = process.start('migrationProcess', {"userData": JSON.stringify(userDataJson)});

        const response = {
          processInstanceId: processInstanceId
        };

        res.print(JSON.stringify(response));
    }

    selectDeliveryUnitAndWorkspaceForProcess(ctx, req, res) {
      const userDataJson = req.getJSON();
      const tasksJson = org.eclipse.dirigible.api.v3.bpm.BpmFacade.getTasks();
      const tasks = JSON.parse(tasksJson);
      for (const task of tasks) {
        if (task.processInstanceId === userDataJson.processInstanceId.toString()) {
          tasksService.completeTask(task.id, {"userData": JSON.stringify(userDataJson)});
          break;
        }
      }
    }

    getProcessState(ctx, req, res) {
      const userDataJson = req.getJSON();
      const processInstanceIdString = userDataJson.processInstanceId.toString();
      const migrationState = processService.getVariable(processInstanceIdString, "migrationState");
      const response = {
        migrationState: migrationState
      };

      if (migrationState === "WORKSPACES_LISTED") {
        const workspacesJson = processService.getVariable(processInstanceIdString, "workspaces");
        const deliveryUnitsJson = processService.getVariable(processInstanceIdString, "deliveryUnits");
        const connectionId = processService.getVariable(processInstanceIdString, "connectionId");
        response.workspaces = JSON.parse(workspacesJson);
        response.deliveryUnits = JSON.parse(deliveryUnitsJson);
        response.connectionId = connectionId;
      }

      res.print(JSON.stringify(response));
    }

}

module.exports = MigrationFacade;
