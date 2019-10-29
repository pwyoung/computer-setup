"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const utils_1 = require("../../../utils");
class ProgressBar {
    constructor() {
        this.promises = [];
        this.progressStatusBar = vscode_1.window.createStatusBarItem();
    }
    static get Instance() {
        return ProgressBar._instance;
    }
    dispose() {
        this.progressStatusBar.dispose();
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = utils_1.nullValue();
        }
    }
    setProgressMessage(message, promise) {
        this.promises.push(promise);
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        this.progressStatusBar.text = message;
        this.progressStatusBar.show();
        let counter = 1;
        const suffix = ['', '.', '..'];
        this.progressInterval = setInterval(() => {
            this.progressStatusBar.text = message + suffix[counter % 3];
            counter++;
            if (counter > 3) {
                counter = 0;
            }
        }, 250);
        promise
            .then(() => {
            this.progressStatusBar.text = '';
            this.progressStatusBar.hide();
            clearInterval(this.progressInterval);
            this.progressInterval = utils_1.nullValue();
        })
            .catch(() => {
            this.progressStatusBar.text = '';
            this.progressStatusBar.hide();
            clearInterval(this.progressInterval);
            this.progressInterval = utils_1.nullValue();
        });
    }
}
ProgressBar._instance = new ProgressBar();
exports.ProgressBar = ProgressBar;

//# sourceMappingURL=progressBar.js.map
