let MigrationController = require('server/migration/controllers/migrate');
let TunnelController = require('server/migration/controllers/tunnel-controller')

let migrationController = new MigrationController();
let tunnelController = new TunnelController();

let neoCredentials = null;

function openTunnelTest() {
    console.log("opening tunnel...")
    let credentials = {
        account: "",
        host: "",
        user: "",
        password: "",
        db: ""
    }

    tunnelController.openTunnel(credentials, result => {
        console.log(result)
        if (result.host) {
            neoCredentials = result;
            setupConnectionTest();
        } else {
            console.error("Wrong credentials")
        }
        
    })
}

function setupConnectionTest() {
    let db = ""
    let cuser = "";
    let hanaPass = "";
    migrationController.setupConnection(db, neoCredentials, cuser, hanaPass) 
    getAllDUsTest()
}

function getAllDUsTest() {
    migrationController.getAllDeliveryUnits((err, units) => {
        // console.log(units)
        if (units.length > 0) {
            const du = {"ach":"","caption":"","lastUpdate":"2021-06-18 11:47:41.1100000","name":"MIGR_TOOLS","ppmsID":"","responsible":"","sp_PPMS_ID":"","vendor":"migration.sap.com","version":"","version_patch":"","version_sp":""};
            migrationController.copyAllFilesForDu(du, (err) => {
                if (err) {
                    console.log("Error copying")
                    console.error(err);
                } else {
                    console.log("MIGRATION DONE!")
                }
            })
        }
    })
}


openTunnelTest();