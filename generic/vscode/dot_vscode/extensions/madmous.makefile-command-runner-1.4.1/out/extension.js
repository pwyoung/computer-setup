"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const commands_1 = require("./commands");
const config_1 = require("./config");
const provider_1 = require("./provider");
exports.activate = (context) => {
    const config = config_1.default();
    const provider = new provider_1.default(config);
    context.subscriptions.push(vscode_1.commands.registerCommand("extension.executeRunTestCommand", commands_1.executeRunTestCommand(config)), vscode_1.commands.registerCommand("extension.executeWatchTestCommand", commands_1.executeWatchTestCommand(config)), vscode_1.commands.registerCommand("extension.executeMakefileCommand", commands_1.executeMakefileCommand(config)), vscode_1.window.registerTreeDataProvider("makefile", provider), vscode_1.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration(config_1.CONFIGURATION_NAME)) {
            vscode_1.commands.executeCommand("workbench.action.reloadWindow");
        }
    }));
};
exports.deactivate = () => { };
//# sourceMappingURL=extension.js.map