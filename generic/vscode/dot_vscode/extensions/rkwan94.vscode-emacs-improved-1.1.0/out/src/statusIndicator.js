"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
var Mode;
(function (Mode) {
    Mode[Mode["Mark"] = 0] = "Mark";
    Mode[Mode["Cua"] = 1] = "Cua";
    // Keybinding Progress Modes
    // - VSCode only supports 2-key chords
    // - These states are used to listen for additional keys
    Mode[Mode["Register"] = 2] = "Register";
    Mode[Mode["RegisterSave"] = 3] = "RegisterSave";
    Mode[Mode["RegisterInsert"] = 4] = "RegisterInsert";
    Mode[Mode["RectangleMark"] = 5] = "RectangleMark";
    Mode[Mode["NoKeyBinding"] = 6] = "NoKeyBinding";
})(Mode = exports.Mode || (exports.Mode = {}));
const IconMapper = {
    [Mode.Mark]: "markdown",
    [Mode.Cua]: "clippy",
    [Mode.Register]: "server",
    [Mode.RectangleMark]: "three-bars",
};
class StatusIndicator {
    constructor() {
        this.deactivateTempModes = () => {
            this.activeModes = this.activeModes.filter(i => i === Mode.Cua);
            this.statusBarIcons = this.statusBarIcons.filter(i => i === IconMapper[Mode.Cua]);
            this.refreshStatusBar();
        };
        this.deactivate = (mode) => {
            this.activeModes = this.activeModes.filter(i => i !== mode);
            this.statusBarIcons = this.statusBarIcons.filter(i => i !== IconMapper[mode]);
            this.refreshStatusBar();
        };
        this.activate = (mode) => {
            if (!this.activeModes.some(i => i === mode)) {
                this.activeModes.push(mode);
            }
            this.refreshStatusBar();
        };
        this.setStatusBarMessage = (text, duration = 1000) => {
            this.statusBarItem.text = this.tempMessage(text);
            // put the mode indicators back in
            setTimeout(() => {
                this.statusBarItem.text = this.statusText();
            }, duration);
        };
        this.setStatusBarPermanentMessage = (text) => {
            if (text === "") {
                this.statusBarItem.text = this.statusText();
            }
            else {
                this.statusBarItem.text = `EMACS: ${text}`;
            }
        };
        this.refreshStatusBar = () => {
            this.statusBarIcons = this.activeModes.map(i => IconMapper[i]);
            this.statusBarItem.text = this.statusText();
            this.statusBarItem.tooltip = this.toolTipText();
        };
        this.tempMessage = (msg) => `EMACS: ${msg}`;
        this.statusText = () => `EMACS: ${this.statusBarIcons.map(i => `$(${i})`).join(" ")}`;
        this.toolTipText = () => {
            let text = "";
            text = this.activeModes.map(i => `${Mode[i]} mode active`).join("\n");
            return text;
        };
        this.statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
        this.statusBarIcons = [];
        this.activeModes = [];
        this.statusBarItem.text = this.statusText();
        this.statusBarItem.tooltip = this.toolTipText();
        this.statusBarItem.show();
    }
    toggleMode(mode) {
        if (this.activeModes.some(i => i === mode)) {
            const index = this.activeModes.indexOf(mode);
            this.activeModes.splice(index, 1);
            this.statusBarIcons = this.statusBarIcons.filter(i => i !== IconMapper[mode]);
        }
        else {
            this.activeModes.push(mode);
            this.statusBarIcons.push(IconMapper[mode]);
        }
        this.refreshStatusBar();
    }
    isModeActive(mode) {
        return this.activeModes.some(i => i === mode);
    }
    setKeybindingProgress(mode) {
        if (!this.isModeActive(Mode.Register)) {
            this.setStatusBarMessage("Operation failed: not in Register Mode", 2000);
        }
        else {
            this.activeModes.push(mode);
            this.activeModes = this.activeModes.filter(i => i !== Mode.Register);
            this.statusBarIcons = this.statusBarIcons.filter(i => i !== IconMapper[Mode.Register]);
        }
    }
    keybindingProgressMode() {
        const value = this.activeModes.find(i => i === Mode.Register ||
            i === Mode.RegisterSave ||
            i === Mode.RegisterInsert ||
            i === Mode.RectangleMark);
        return value ? value : Mode.NoKeyBinding;
    }
}
exports.default = StatusIndicator;
//# sourceMappingURL=statusIndicator.js.map