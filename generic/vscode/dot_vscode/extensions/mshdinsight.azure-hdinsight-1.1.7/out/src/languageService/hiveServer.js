'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const productConstants_1 = require("../productConstants");
class HiveServer {
    /**
     * constructor
     */
    constructor() {
        this._port = productConstants_1.ProductConstants.DefaultLanguagePort;
    }
    makeRequest(data, action) {
        return new Promise((resolve, reject) => {
            var dataStr = JSON.stringify(data);
            var options = {
                port: this._port,
                path: action,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength((dataStr))
                }
            };
            var req = http.request(options, (res) => {
                console.log(`STATUS: ${res.statusCode}`);
                console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
                res.setEncoding('utf8');
                var output = '';
                res.on('data', (chunk) => {
                    console.log(`BODY: ${chunk}`);
                    output += chunk;
                });
                res.on('end', () => {
                    console.log('No more data in response.');
                    console.log(`BODY: ${output}`);
                    var resultObject = JSON.parse(output);
                    return resolve(resultObject);
                });
            });
            req.on('error', (e) => {
                console.log(`problem with request: ${e.message}`);
            });
            // write data to request body
            req.write(dataStr);
            req.end();
        }).catch(err => {
            return null;
        });
    }
}
exports.HiveServer = HiveServer;

//# sourceMappingURL=hiveServer.js.map
