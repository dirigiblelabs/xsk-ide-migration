let exec = require("core/v4/exec");
let canonicalPrefix = "/usr/local/tomcat/target/dirigible/repository/root/users/dirigible/workspace/"
let neoPath = "server/migration/neo.sh";

class TunnelController {

    openTunnel(credentials, completion) {

        let account = credentials.account;
        let host = credentials.host;
        let user = credentials.user;
        let password = credentials.password;
        let db = credentials.db;

        const script = `bash ${canonicalPrefix + neoPath} -a "${account}" -h "${host}" -u "${user}" -p "${password}" -i "${db}"`;
        // console.log(script);

        let response = exec.exec(script, {"NEO_CLIENT_PATH": canonicalPrefix + "server/neo/tools/neo.sh"});
        console.log(response)
        let neoCredentials = JSON.parse(response.substring(response.indexOf("{")));

        completion(neoCredentials);
    }
}

module.exports = TunnelController;