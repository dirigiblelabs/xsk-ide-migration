const rs = require("http/v4/rs");

const MigrationFacade = require("ide-migration/server/migration/api/migrate-facade")

class MigrationRouter {

  start() {
    let facade = new MigrationFacade()
    rs.service()
      .resource("start-process")
        .post(facade.startProcess)
      .resource("continue-process")
        .post(facade.selectDeliveryUnitAndWorkspaceForProcess)
      .resource("get-process")
        .post(facade.getProcessState)
      .execute();
  }
}

module.exports = MigrationRouter;
