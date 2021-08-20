const exec = require("core/v4/exec");
const canonicalPrefix = "/usr/local/tomcat/target/dirigible/repository/root/users/dirigible/workspace/"

const neoPath = __context.get("__neo_path") || canonicalPrefix + "xsk-ide-migration/server/migration/neo.sh";
const neoClientPath = __context.get("__neo_client_path") || "/usr/local/tomcat/migration-tools/neo/neo-sdk/tools/neo.sh"

class TunnelController {

    openTunnel(credentials, completion) {
        const account = credentials.account;
        const host = credentials.host;
        const user = credentials.user;
        const password = credentials.password;
        const db = credentials.db;

        const script = `bash ${neoPath} -a "${account}" -h "${host}" -u "${user}" -p "${password}" -i "${db}"`;

        const response = exec.exec(script, {"NEO_CLIENT_PATH": neoClientPath});
        console.log(response)
        const neoCredentials = JSON.parse(response.substring(response.indexOf("{")));

        completion(null, neoCredentials);
    }
}

module.exports = TunnelController;