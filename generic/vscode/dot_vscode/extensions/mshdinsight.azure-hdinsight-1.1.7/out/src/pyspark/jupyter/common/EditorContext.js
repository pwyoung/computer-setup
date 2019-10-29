"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class EditorContextKey {
    constructor(name) {
        this._name = name;
    }
    set(value) {
        if (this._lastValue === value) {
            return;
        }
        this._lastValue = value;
        vscode_1.commands.executeCommand('setContext', this._name, this._lastValue);
    }
}
exports.EditorContextKey = EditorContextKey;

//# sourceMappingURL=EditorContext.js.map
