const rs = require("http/v4/rs");

const MigrationFacade = require("ide-migration/server/migration/api/migrate-facade")

class MigrationRouter {

    start() {
      let facade = new MigrationFacade()
      rs.service()
      .resource("setup-migration")
        .post(facade.openTunnelAndFechDus)
      .resource("delivery-units")
        .post(facade.getAllDeliveryUnits)
      .resource("execute-migration")
        .post(facade.copyAllFilesForDu)
      .execute();
    }
}

module.exports = MigrationRouter;