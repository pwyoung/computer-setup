"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fileType_1 = require("../controllers/fileType");
const jobStatusManager_1 = require("./jobStatusManager");
const utils = require("../utils");
const authorization_1 = require("../azure/authorization");
function submitActionPreValidation(fileType) {
    if (!authorization_1.CredentialsManagerInstance.isAuthorization) {
        vscode.window.showErrorMessage('Please login using Azure credential, or run command "Big Data: Link a Cluster" using Ambari credential');
        return false;
    }
    if (jobStatusManager_1.JobStatusManager.Instance.isRunning()) {
        vscode.window.showErrorMessage('Another job is running!');
        return false;
    }
    let selectedDoc = utils.getCurrentActiveDocument();
    if (!selectedDoc) {
        utils.debug('no selected document');
        return false;
    }
    let currentDoc = selectedDoc;
    if (fileType === fileType_1.FileType.PySpark && currentDoc.languageId !== 'python') {
        vscode.window.showErrorMessage('The file extension should be \'py\'');
        return false;
    }
    if (fileType === fileType_1.FileType.Hql && currentDoc.languageId !== 'hql') {
        vscode.window.showErrorMessage('The file extension should be \'hql\' or \'hive\'');
        return false;
    }
    if (currentDoc.getText().length === 0) {
        vscode.window.showErrorMessage('Submitted file should not be empty!');
        return false;
    }
    return true;
}
exports.submitActionPreValidation = submitActionPreValidation;

//# sourceMappingURL=jobPreValidation.js.map
