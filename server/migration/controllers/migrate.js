let HanaRepository = require('migration/repository/hana-repository');
let workspaceManager = require("platform/v4/workspace");

class MigrationController {

    connection = null;
    repo = null;

    setupConnection(ctx, req, res) {
        const body = req.getJSON();
        database.createDataSource(body.db, "com.sap.db.jdbc.Driver", body.neoCredentials['url'], body.cuser, body.hanaPass, null);

        this.connection = database.getConnection('dynamic', db);
        this.repo = repo = new HanaRepository(connection);

        res.print({success: true});
    }

    getAllDeliveryUnits(ctx, req, res) {

        if (!this.repo) {
            return error;
        }
        try {
            this.repo.getAllDeliveryUnits(function(error, result){
                // console.log("Delivery units fetched: " + JSON.stringify(result));

                res.print({result});
            });
        } catch (error) {
            
        } 
    }

    copyAllFilesForDu(ctx, req, res) {
        if (!this.repo) {
            return error;
        }
        //const du = {"ach":"","caption":"","lastUpdate":"2021-06-18 11:47:41.1100000","name":"MIGR_TOOLS","ppmsID":"","responsible":"","sp_PPMS_ID":"","vendor":"migration.sap.com","version":"","version_patch":"","version_sp":""};
        const du = body.du;
        let context = {};
        try {
            this.repo.getAllFilesForDu(context, du, (err, files, packages) => {
                // console.log("Files list: " + JSON.stringify(files));
                dumpSourceFiles(files, du, function(err){
                    res.print({success: true});
                })
            })
        } catch (error) {
            
        } 
    }

    dumpSourceFiles(lists, du, callback) {

        let workspace = workspaceManager.getWorkspace(du.name)
        if (!workspace) {
            workspaceManager.createWorkspace(du.name)
            workspace = workspaceManager.getWorkspace(du.name)
        }
        for(let i = 0; i < lists.length; i++) {
            const file = lists[i];
            let project = workspace.getProject(file.packageId)
            if (!project) {
                workspace.createProject(file.packageId)
                project = workspace.getProject(file.packageId)
            }
            project.createFile(file.RunLocation)
            
        }
        callback(null);
    }

}

module.exports = MigrationController;


