var rs = require("http/v4/rs");

const MigrationController = require('migration/controllers/migration-controller');
const TunnelController = require('migration/controllers/tunnel-controller');

class MigrationRouter {

    start() {
      rs.service()
      .resource("open-tunnel")
        .post(TunnelController.openTunnel)
      .resource("setup")
        .post(MigrationController.setupConnection)
      .resource("delivery-units")
        .post(MigrationController.getAllDeliveryUnits)
      .resource("copy-files")
        .post(MigrationController.copyAllFilesForDu)
      .execute();
    }
}

module.exports = MigrationRouter;


