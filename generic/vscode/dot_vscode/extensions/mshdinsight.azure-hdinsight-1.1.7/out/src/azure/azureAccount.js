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
const newSettings_1 = require("../newSettings");
const environment_1 = require("./environment");
const authorization_1 = require("./authorization");
let azureAccountAPI;
function setAzureAccountAPI() {
    const azureAccountExtension = vscode.extensions.getExtension('ms-vscode.azure-account');
    azureAccountAPI = azureAccountExtension ? azureAccountExtension.exports : undefined;
    if (azureAccountAPI) {
        azureAccountAPI.onStatusChanged((status) => __awaiter(this, void 0, void 0, function* () {
            if (status === 'LoggedIn') {
                if (authorization_1.CredentialsManagerInstance.isAuthorization()) {
                    yield authorization_1.logout(true);
                }
                yield newSettings_1.SettingsManagerNew.Instance.setAzureEnvironment(environment_1.HDIEnvironment.GLOBAL.getName());
                authorization_1.CredentialsManagerInstance.hdiEnvironment = environment_1.HDIEnvironment.GLOBAL;
                yield vscode.commands.executeCommand('setContext', 'hdinsight.authorization', true);
                yield vscode.commands.executeCommand('setContext', 'hdinsight.displayTreeview', true);
            }
            if (status === 'LoggedOut') {
                authorization_1.CredentialsManagerInstance.clearAuthorizationInfo();
                yield vscode.commands.executeCommand('setContext', 'hdinsight.authorization', false);
                yield vscode.commands.executeCommand('setContext', 'hdinsight.displayTreeview', false);
            }
        }));
    }
}
exports.setAzureAccountAPI = setAzureAccountAPI;
function getAzureAccountAPI() {
    return azureAccountAPI;
}
exports.getAzureAccountAPI = getAzureAccountAPI;

//# sourceMappingURL=azureAccount.js.map
