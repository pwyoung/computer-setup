"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const signaling_1 = require("phosphor/lib/core/signaling");
const vscode = require("vscode");
class KernelImpl extends vscode.Disposable {
    constructor(kernelUUID, kernelSpec, jupyterClient) {
        super(() => { });
        this.kernelUUID = kernelUUID;
        this.kernelSpec = kernelSpec;
        this.jupyterClient = jupyterClient;
        this.watchCallbacks = [];
        this.id = this.kernelUUID;
        this.name = this.kernelSpec.name;
        this.baseUrl = '<unknown>';
    }
    raiseOnStatusChange(status) {
        this.status = status;
    }
    addWatchCallback(watchCallback) {
        return this.watchCallbacks.push(watchCallback);
    }
    _callWatchCallbacks() {
        return this.watchCallbacks.forEach(watchCallback => {
            watchCallback();
        });
    }
    get status() {
        return this._status;
    }
    set status(value) {
        if (value === this._status) {
            return;
        }
        this._status = value;
        this.statusChanged.emit(value);
    }
    getSpec() {
        return Promise.resolve(this.kernelSpec);
    }
    sendShellMessage(msg, expectReply, disposeOnDone) {
        throw new Error('Method not implemented.');
    }
    interrupt() {
        throw new Error('Method not implemented.');
    }
    restart() {
        throw new Error('Method not implemented.');
    }
    reconnect() {
        throw new Error('Method not implemented.');
    }
    shutdown() {
        throw new Error('Method not implemented.');
    }
    requestKernelInfo() {
        throw new Error('Method not implemented.');
    }
    requestComplete(content) {
        throw new Error('Method not implemented.');
    }
    requestInspect(content) {
        throw new Error('Method not implemented.');
    }
    requestHistory(content) {
        throw new Error('Method not implemented.');
    }
    requestExecute(content, disposeOnDone) {
        throw new Error('Method not implemented.');
    }
    requestIsComplete(content) {
        throw new Error('Method not implemented.');
    }
    requestCommInfo(content) {
        throw new Error('Method not implemented.');
    }
    sendInputReply(content) {
        throw new Error('Method not implemented.');
    }
    connectToComm(targetName, commId) {
        throw new Error('Method not implemented.');
    }
    registerCommTarget(targetName, callback) {
        throw new Error('Method not implemented.');
    }
    registerMessageHook(msgId, hook) {
        throw new Error('Method not implemented.');
    }
    dispose() {
        throw new Error('Method not implemented.');
    }
}
exports.KernelImpl = KernelImpl;
signaling_1.defineSignal(KernelImpl.prototype, 'statusChanged');

//# sourceMappingURL=kernel.js.map
