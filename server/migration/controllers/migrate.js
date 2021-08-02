let HanaRepository = require('xsk-ide-migration/server/migration/repository/hana-repository');
let workspaceManager = require("platform/v4/workspace");
var database = require("db/v4/database");


class MigrationController {

    connection = null;
    repo = null;

    setupConnection(db, neoCredentials, cuser, hanaPass) {
            database.createDataSource(db, "com.sap.db.jdbc.Driver", neoCredentials['url'], cuser, hanaPass, null);

            this.connection = database.getConnection('dynamic', db);
            this.repo = new HanaRepository(this.connection);
    }

    getAllDeliveryUnits(completion) {
        
        if (!this.repo) {
            
            return completion("Repository not initialized", null);       
        }
        
        try {
            this.repo.getAllDeliveryUnits(function(error, result){
                // console.log("Delivery units fetched: " + JSON.stringify(result));
                completion(null, result);
            });
        } catch (error) {
            completion(error)
        } 
    }

    copyAllFilesForDu(du, completion) {
        if (!this.repo) {
            return completion("Repository not initialized", null);
        }
        //const du = {"ach":"","caption":"","lastUpdate":"2021-06-18 11:47:41.1100000","name":"MIGR_TOOLS","ppmsID":"","responsible":"","sp_PPMS_ID":"","vendor":"migration.sap.com","version":"","version_patch":"","version_sp":""};
        let context = {};
        try {
            this.repo.getAllFilesForDu(context, du, (err, files, packages) => {
                console.log("Files list: " + JSON.stringify(files));
                this.dumpSourceFiles(files, du, function(err){
                    completion(err);
                })
            })
        } catch (error) {
            console.error(error)
            completion(error);
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


