const exec = require("core/v4/exec");
const canonicalPrefix = "/usr/local/tomcat/target/dirigible/repository/root/users/dirigible/workspace/"
const neoPath = "xsk-ide-migration/server/migration/neo.sh";

class TunnelController {

    openTunnel(credentials, completion) {
        const account = credentials.account;
        const host = credentials.host;
        const user = credentials.user;
        const password = credentials.password;
        const db = credentials.db;

        const script = `bash ${canonicalPrefix + neoPath} -a "${account}" -h "${host}" -u "${user}" -p "${password}" -i "${db}"`;

        const response = exec.exec(script, {"NEO_CLIENT_PATH": "/usr/local/tomcat/migration-tools/neo/neo-sdk/tools/neo.sh"});
        console.log(response)
        const neoCredentials = JSON.parse(response.substring(response.indexOf("{")));

        completion(null, neoCredentials);
    }
}

module.exports = TunnelController;