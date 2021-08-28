const exec = require("core/v4/exec");
const config = require("core/v4/configurations");

const neoClientPath = config.get("user.dir") + "/target/dirigible/resources-neo-sdk/tools/neo.sh";

class TunnelController {

    openTunnel(credentials, completion) {
        const account = credentials.account;
        const host = credentials.host;
        const user = credentials.user;
        const password = credentials.password;
        const db = credentials.db;

        const script = `${neoClientPath} open-db-tunnel -a "${account}" -h "${host}" -u "${user}" -p "${password}" -i "${db}" --output json --background`;

        const commandResult = JSON.parse(exec.exec(script, {
            "JAVA_HOME": config.get("JAVA8_HOME")
        }));
        console.log(commandResult)
        if (commandResult.errorMsg) {
          throw "[NEO CLIENT ERROR]" + neoOutput.errorMsg
        }

        completion(null, commandResult.result);
    }
}

module.exports = TunnelController;
