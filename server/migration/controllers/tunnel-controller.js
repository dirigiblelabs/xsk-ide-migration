let exec = require("core/v4/exec");
let canonicalPrefix = "/usr/local/tomcat/target/dirigible/repository/root/users/dirigible/workspace/"
let neoPath = "migration/neo.sh";

class TunnelController {

    openTunnel(ctx, req, res) {

        const credentials = req.getJSON().credentials;

        let account = credentials.account;
        let host = credentials.host;
        let user = credentials.user;
        let password = credentials.password;
        let db = credentials.db;

        const script = `bash ${canonicalPrefix + neoPath} -a "${account}" -h "${host}" -u "${user}" -p "${password}" -i "${db}"`;
        // console.log(script);

        let response = exec.exec(script, {"NEO_CLIENT_PATH": canonicalPrefix + "neo/tools/neo.sh"});

        let neoCredentials = JSON.parse(response.substring(response.indexOf("{")));

        res.print(neoCredentials);
    }
}

module.exports = TunnelController;