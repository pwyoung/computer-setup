"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConnectionSettings {
    constructor(connectString, userName, password, isAuthorized = true) {
        this.connectString = connectString;
        this.userName = userName;
        this.password = password;
        this.isAuthorized = isAuthorized;
    }
    connectionKey() {
        return `${this.connectString}\t${this.userName}`;
    }
}
exports.ConnectionSettings = ConnectionSettings;

//# sourceMappingURL=ConnectionSettings.js.map
