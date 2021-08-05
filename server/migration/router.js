const rs = require("http/v4/rs");

const MigrationFacade = require("xsk-ide-migration/server/migration/api/migrate-facade")

class MigrationRouter {

    start() {
      let facade = new MigrationFacade()
      rs.service()
      .resource("open-tunnel")
        .post(facade.openTunnel)
      .resource("setup")
        .post(facade.setupConnection)
      .resource("delivery-units")
        .post(facade.getAllDeliveryUnits)
      .resource("copy-files")
        .post(facade.copyAllFilesForDu)
      .execute();
    }
}

module.exports = MigrationRouter;


