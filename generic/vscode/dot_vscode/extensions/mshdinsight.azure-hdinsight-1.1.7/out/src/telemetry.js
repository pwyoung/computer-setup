"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
const utils_1 = require("./utils");
class TelemetryManager {
    constructor(version) {
        this.extensionId = 'hdinsight-vscode-ext';
        this.defaultExtensionVesion = '0.1.0';
        this.key = '0d100a9f-1650-42ee-bcbe-f194372bf6bb';
        this.vscode_key = 'AIF-d9b70cd4-b9f9-4d70-929b-a071c400b217'; // GDPR policy
        this.extensionVersion = version || this.defaultExtensionVesion;
        this.reporter = new vscode_extension_telemetry_1.default(this.extensionId, this.extensionVersion, this.key);
        this.vscode_reporter = new vscode_extension_telemetry_1.default(this.extensionId, this.extensionVersion, this.vscode_key);
        this._messageQueue = [];
    }
    static get Instance() {
        if (TelemetryManager._instance === null) {
            TelemetryManager._instance = new TelemetryManager(utils_1.getExtensionVersion());
            TelemetryManager._instance.start();
        }
        return TelemetryManager._instance;
    }
    enqueueTelemetryMsg(eventName, properties, measures) {
        this._messageQueue.push(new TelemetryMessage(eventName, properties, measures));
    }
    start() {
        this._interval = setInterval(() => {
            while (this._messageQueue.length > 0) {
                let msg = this._messageQueue.pop();
                if (msg) {
                    this.reporter.sendTelemetryEvent(msg.eventName, msg.properties, msg.mesures);
                    this.vscode_reporter.sendTelemetryEvent(msg.eventName, msg.properties, msg.mesures);
                }
            }
        }, 5000);
    }
    stop() {
        while (this._messageQueue.length > 0) {
            let msg = this._messageQueue.pop();
            if (msg) {
                this.reporter.sendTelemetryEvent(msg.eventName, msg.properties, msg.mesures);
                this.vscode_reporter.sendTelemetryEvent(msg.eventName, msg.properties, msg.mesures);
            }
        }
        clearInterval(this._interval);
    }
}
TelemetryManager._instance = null;
exports.TelemetryManager = TelemetryManager;
class TelemetryMessage {
    constructor(eventName, properties, measures) {
        this.eventName = eventName;
        this.properties = properties;
        this.mesures = measures;
    }
}
exports.TelemetryMessage = TelemetryMessage;

//# sourceMappingURL=telemetry.js.map
