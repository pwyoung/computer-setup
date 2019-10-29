'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const vscode_1 = require("vscode");
const platform_1 = require("./platform");
const utils = require("../utils");
function checkMonoEnvironment() {
    if (platform_1.Platform.Windows !== utils.getPlatform()) {
        const result = cp.spawnSync('mono', ['--version'], { encoding: 'utf8' });
        if (result.error || result.stderr) {
            const getDotnetMessage = 'Get Mono';
            vscode_1.window.showErrorMessage('Please download and install Mono, and then restart VSCode', getDotnetMessage).then((result) => {
                if (result === getDotnetMessage) {
                    utils.openInBrowser('https://www.mono-project.com/');
                }
                return false;
            });
        }
        else {
            return true;
        }
    }
    return true;
}
exports.checkMonoEnvironment = checkMonoEnvironment;

//# sourceMappingURL=monoHelper.js.map
