"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const terminal_1 = require("./terminal");
exports.executeRunTestCommand = (config) => (uri) => __awaiter(this, void 0, void 0, function* () {
    executeTestCommand(config, uri, config.unitTestCommand, config.integrationTestCommand);
});
exports.executeWatchTestCommand = (config) => (uri) => __awaiter(this, void 0, void 0, function* () {
    executeTestCommand(config, uri, config.unitTestWatchCommand, config.integrationTestWatchCommand);
});
const executeTestCommand = (config, uri, unitCommand, integrationCommand) => __awaiter(this, void 0, void 0, function* () {
    if (vscode_1.workspace.rootPath && uri) {
        const filePath = exports.getFilePath(uri.path, vscode_1.workspace.rootPath);
        const command = exports.isUnit(filePath) ? unitCommand : integrationCommand;
        sendTextsToTerminal([
            `cd ${vscode_1.workspace.rootPath}/${config.makefilePath}`,
            `make ${command} ${config.filePathEnv}=${filePath}`
        ]);
    }
});
exports.getFilePath = (path, workspaceRootPath) => path.split(workspaceRootPath + "/")[1];
exports.isUnit = (filePath) => filePath.indexOf("unit") !== -1;
exports.executeMakefileCommand = (config) => (argument) => __awaiter(this, void 0, void 0, function* () {
    sendTextsToTerminal([
        `cd ${vscode_1.workspace.rootPath}/${config.makefilePath}`,
        `make ${argument}`
    ]);
});
const sendTextToTerminal = (text) => __awaiter(this, void 0, void 0, function* () {
    if (terminal_1.ensureTerminalExists()) {
        const terminal = yield terminal_1.selectTerminal();
        if (terminal) {
            terminal.sendText(text);
        }
    }
});
const sendTextsToTerminal = (texts) => __awaiter(this, void 0, void 0, function* () {
    for (let i = 0; i < texts.length; i++) {
        sendTextToTerminal(texts[i]);
    }
});
//# sourceMappingURL=commands.js.map