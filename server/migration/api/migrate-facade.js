let HanaRepository = require('server/migration/repository/hana-repository');
let workspaceManager = require("platform/v4/workspace");

const MigrationController = require('server/migration/controllers/migrate');
const TunnelController = require('server/migration/controllers/tunnel-controller');

class MigrationFacade {

    constructor() {
        this.migrationController = new MigrationController();
        this.tunnelController = new TunnelController();
    }

    setupConnection(ctx, req, res) {
        const body = req.getJSON();

        this.migrationController.setupConnection(body.db, body.neoCredentials, body.cuser, body.hanaPass);

        res.print({success: true});
    }

    getAllDeliveryUnits(ctx, req, res) {

        this.migrationController.getAllDeliveryUnits((err, dus) => {
            if (err) {
                return res.print({success: false, err})
            }
            return res.print({success: true, dus});
        })
    }

    copyAllFilesForDu(ctx, req, res) {
        const du = req.getJSON().du;

        this.migrationController.copyAllFilesForDu(du, err => {
            return res.print({success: err === null});
        })
    }

    openTunnel(ctx, req, res) {

        const credentials = req.getJSON().credentials;

        this.tunnelController.openTunnel(credentials, (err, result) => {
            res.print(neoCredentials);
        })

        
    }

}

module.exports = MigrationFacade;


