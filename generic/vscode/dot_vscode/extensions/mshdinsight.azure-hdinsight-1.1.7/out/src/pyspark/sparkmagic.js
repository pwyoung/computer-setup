"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
class Credentials {
    constructor(userName, password, url) {
        this.username = userName;
        this.base64_password = new Buffer(password).toString('base64');
        this.url = url;
    }
}
class Conf {
    constructor(userName, password, url) {
        // TODO: Scala support 
        // kernel_scala_credentials: Credentials;
        // for sparkmagic 0.2.3 (clusters v3.4)
        this.should_heartbeat = true;
        // sparkmagic 0.11.2 (clusters v3.5 and v3.6),
        this.livy_server_heartbeat_timeout_seconds = 60;
        this.heartbeat_refresh_seconds = 5;
        this.heartbeat_retry_seconds = 1;
        this.ignore_ssl_errors = true;
        this.kernel_python_credentials = new Credentials(userName, password, url);
        // this.kernel_scala_credentials = new Credentials(userName, password, url);
        this.custom_headers = {
            'X-Requested-By': 'ambari'
        };
    }
}
/**
 * @param username Ambari user name
 * @param password Ambari password
 * @param url Ambari url
 * @returns {boolean} false if the existing configuration meets the conditions; true if we should re-generata the configuration, which means we should restart local Jupyter service
 */
function generateConf(username, password, url) {
    const profile = process.platform === 'win32' ? 'USERPROFILE' : 'HOME';
    const workFolder = path.join(process.env[profile], '.sparkmagic');
    const configFilePath = path.join(workFolder, 'config.json');
    if (fs.existsSync(configFilePath)) {
        const config = fs.readFileSync(configFilePath).toString();
        let configObj = null;
        try {
            configObj = JSON.parse(config);
        }
        catch (ex) {
            // ignore the excepion, we will gernerate a new configuration here
            configObj = null;
        }
        if (configObj && configObj['kernel_python_credentials'] && configObj['kernel_python_credentials']['url'] && configObj['custom_headers']) {
            const originUrl = configObj['kernel_python_credentials']['url'];
            const originUserName = configObj['kernel_python_credentials']['username'];
            const originPassword = configObj['kernel_python_credentials']['base64_password'];
            const xRequestHeader = configObj['custom_headers']['X-Requested-By'];
            // donothing if nothing changed in the configuration
            if (originUrl === url && username === originUserName && (new Buffer(password).toString('base64') === originPassword) && xRequestHeader) {
                return false;
            }
        }
    }
    const conf = new Conf(username, password, url);
    if (!fs.existsSync(workFolder)) {
        fs.mkdirSync(workFolder);
    }
    fs.writeFileSync(configFilePath, JSON.stringify(conf, null, 4));
    return true;
}
exports.generateConf = generateConf;

//# sourceMappingURL=sparkmagic.js.map
