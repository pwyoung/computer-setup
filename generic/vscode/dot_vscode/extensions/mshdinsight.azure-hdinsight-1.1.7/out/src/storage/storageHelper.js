'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const pem = require("pem");
const adal = require("adal-node");
const process = require("process");
const path = require("path");
const ms_rest_1 = require("ms-rest");
const sha1 = require("sha1");
const common_1 = require("../common");
const utils = require("../utils");
const adlsClientId = 'https://datalake.azure.net/';
function getTokenCredentials(conf) {
    return _parsePkcs12(conf.certificateStr, conf.certificatePassword)
        .then(pemCert => {
        // this is a trick to get finger print of a cer 
        const certContents = pemCert.cert.split('\n');
        const certContent = certContents.slice(1, certContents.length - 1).join('\n');
        const buf = Buffer.from(certContent, 'base64');
        const fingerPrint = sha1(buf);
        return _getToken(conf.addTenantId, conf.applicationId, pemCert.key, fingerPrint);
    });
}
exports.getTokenCredentials = getTokenCredentials;
function _getToken(clusterIdentityaadTenantId, appId, certKey, fingerPrint) {
    let def = common_1.createDeferred();
    const authContext = new adal.AuthenticationContext(clusterIdentityaadTenantId);
    authContext.acquireTokenWithClientCertificate(adlsClientId, appId, certKey, fingerPrint, (error, result) => {
        if (error) {
            return def.reject(error);
        }
        else {
            return def.resolve(new ms_rest_1.TokenCredentials(result['accessToken'], result['tokenType']));
        }
    });
    return def.promise;
}
function _parsePkcs12(certificateStr, password) {
    // fix reading cert issue on Windows
    // more details: https://github.com/Dexus/pem/issues/58
    if (process.platform === 'win32' && !process.env.OPENSSL_BIN) {
        pem.config({
            pathOpenSSL: path.join(utils.getRootInstallDirectory(), 'bin', 'openssl', 'openssl.exe')
        });
    }
    let buf = Buffer.from(certificateStr, 'base64');
    let def = common_1.createDeferred();
    pem.readPkcs12(buf, { p12Password: password }, (error, cert) => {
        if (error) {
            return def.reject(error);
        }
        else {
            return def.resolve(cert);
        }
    });
    return def.promise;
}

//# sourceMappingURL=storageHelper.js.map
