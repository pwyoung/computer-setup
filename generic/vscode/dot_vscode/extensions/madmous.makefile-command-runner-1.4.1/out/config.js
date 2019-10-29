"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
exports.CONFIGURATION_NAME = 'makefileCommandRunner';
const getConfig = () => {
    const config = vscode_1.workspace.getConfiguration(exports.CONFIGURATION_NAME);
    return {
        makefilePath: config.makefilePath,
        makefileName: config.makefileName,
        unitTestCommand: config.unitTestCommand,
        integrationTestCommand: config.integrationTestCommand,
        filePathEnv: config.filePathEnv,
        unitTestWatchCommand: config.unitTestWatchCommand,
        integrationTestWatchCommand: config.integrationTestWatchCommand
    };
};
exports.default = getConfig;
//# sourceMappingURL=config.js.map