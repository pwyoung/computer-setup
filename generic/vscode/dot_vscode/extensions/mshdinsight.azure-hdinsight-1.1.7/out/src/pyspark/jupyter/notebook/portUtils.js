"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../../../common");
const tcpPortUsed = require("tcp-port-used");
function getAvailablePort(protocol, host, startPort, numberOfPortsToTry = 10) {
    let portsToTry = Array(numberOfPortsToTry).fill(0).map((v, index) => startPort + index);
    let def = common_1.createDeferred();
    function checkPortAvailability() {
        if (portsToTry.length === 0) {
            def.reject('None available');
        }
        let port = portsToTry.shift();
        isPortAvailable(host, port)
            .then(available => {
            if (available) {
                def.resolve(port);
            }
            else {
                checkPortAvailability();
            }
        });
    }
    checkPortAvailability();
    return def.promise;
}
exports.getAvailablePort = getAvailablePort;
function isPortAvailable(host, port) {
    let def = common_1.createDeferred();
    tcpPortUsed.check(port, host)
        .then(function (inUse) {
        def.resolve(!inUse);
    }, () => {
        def.resolve(false);
    });
    return def.promise;
}

//# sourceMappingURL=portUtils.js.map
