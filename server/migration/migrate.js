let exec = require("core/v4/exec");
let HanaRepository = require('migration/hana-repository');
var RepositoryResponse = require('migration/repository-response');

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

let response = exec.exec(script, {"NEO_CLIENT_PATH": canonicalPrefix + "neo/tools/neo.sh"});

let neoCredentials = JSON.parse(response.substring(response.indexOf("{")));

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
            console.log("Files list: " + JSON.stringify(files));
        })
    })


} catch(e) {
    console.log(JSON.stringify(e.message));
} finally {
    connection.close();
}

