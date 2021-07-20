let exec = require("core/v4/exec");
let HanaRepository = require('migration/hana-repository');
let workspaceManager = require("platform/v4/workspace");
let canonicalPrefix = "/usr/local/tomcat/target/dirigible/repository/root/users/dirigible/workspace/"
let neoPath = "migration/neo.sh";

let account = ""
let host = ""
let user = ""
let password = ""
let db = ""
let cuser = "";
let hanaPass = "";

const script = `bash ${canonicalPrefix + neoPath} -a "${account}" -h "${host}" -u "${user}" -p "${password}" -i "${db}"`;
// console.log(script);

let response = exec.exec(script, {"NEO_CLIENT_PATH": canonicalPrefix + "neo/tools/neo.sh"});

let neoCredentials = JSON.parse(response.substring(response.indexOf("{")));
// console.log("CREDS: " + JSON.stringify(neoCredentials));

var database = require("db/v4/database");

database.createDataSource(db, "com.sap.db.jdbc.Driver", neoCredentials['url'], cuser, hanaPass, null);

var connection = database.getConnection('dynamic', db);

let utf8 = org.eclipse.dirigible.api.v3.utils.UTF8Facade;
let context = {};
try {

    let repo = new HanaRepository(connection);
    repo.getAllDeliveryUnits(function(error, res){
        // console.log("Delivery units fetched: " + JSON.stringify(res));
        const du = {"ach":"","caption":"","lastUpdate":"2021-06-18 11:47:41.1100000","name":"MIGR_TOOLS","ppmsID":"","responsible":"","sp_PPMS_ID":"","vendor":"migration.sap.com","version":"","version_patch":"","version_sp":""};
        
        repo.getAllFilesForDu(context, du, (err, files, packages) => {
            // console.log("Files list: " + JSON.stringify(files));
            dumpSourceFiles(files, du, null)
        })
    })


} catch(e) {
    console.log(JSON.stringify(e.message));
} finally {
    connection.close();
}

function dumpSourceFiles(lists, du, callback) {

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
}

