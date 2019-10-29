"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
class ProductConstants {
    static get DefaultLanguagePort() {
        return vscode_1.workspace.getConfiguration('hqlLanguageServer')['languageWrapperPort'];
    }
    static get DefaultHiveInteractivePort() {
        return vscode_1.workspace.getConfiguration('hqlInteractiveServer')['wrapperPort'];
    }
    static get WorkingFolder() {
        let profile = process.platform === 'win32' ? 'USERPROFILE' : 'HOME';
        return path.join(process.env[profile], '.msvscode.hdinsight');
    }
}
exports.ProductConstants = ProductConstants;

//# sourceMappingURL=productConstants.js.map
