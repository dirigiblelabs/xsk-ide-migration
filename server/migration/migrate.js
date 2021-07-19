let exec = require("core/v4/exec");
let HanaRepository = require('migration/hana-repository');

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

try {

    let repo = new HanaRepository(connection);
    repo.getAllDeliveryUnits(function(error, res){
        console.log("Delivery units fetched: " + res.length);
    })


} catch(e) {
    console.log(JSON.stringify(e.message));
} finally {
    connection.close();
}

