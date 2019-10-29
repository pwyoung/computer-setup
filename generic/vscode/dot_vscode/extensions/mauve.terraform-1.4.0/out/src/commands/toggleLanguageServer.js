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
const vscode = require("vscode");
const command_1 = require("./command");
const configuration_1 = require("../configuration");
const languageclient_1 = require("../languageclient");
const _ = require("lodash");
class ToggleLanguageServerCommand extends command_1.Command {
    constructor(ctx) {
        super(ToggleLanguageServerCommand.CommandName, ctx, command_1.CommandType.PALETTE);
    }
    perform(prompt = true) {
        return __awaiter(this, void 0, void 0, function* () {
            // Disable indexing
            let indexConfig = _.clone(configuration_1.getConfiguration().indexing);
            indexConfig.enabled = !indexConfig.enabled;
            // Enable LSP
            let langServerConfig = _.clone(configuration_1.getConfiguration().languageServer);
            langServerConfig.enabled = !langServerConfig.enabled;
            // Update config
            yield vscode.workspace.getConfiguration().update("terraform.indexing", indexConfig, vscode.ConfigurationTarget.Global);
            yield vscode.workspace.getConfiguration().update("terraform.languageServer", langServerConfig, vscode.ConfigurationTarget.Global);
            // Reload the window to start the server
            if (langServerConfig.enabled) {
                yield new languageclient_1.ExperimentalLanguageClient(this.ctx).start();
            }
            else {
                yield languageclient_1.ExperimentalLanguageClient.stopIfRunning();
            }
            return true;
        });
    }
}
ToggleLanguageServerCommand.CommandName = "toggleLanguageServer";
exports.ToggleLanguageServerCommand = ToggleLanguageServerCommand;

//# sourceMappingURL=toggleLanguageServer.js.map
