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
const path = require("path");
const telemetry_1 = require("../telemetry");
const utils = require("../utils");
const dontShowAgain = 'Don\'t Show Again';
const moreDetails = 'More Details';
const documentLink = 'https://go.microsoft.com/fwlink/?linkid=859021';
const surveyLink = 'https://go.microsoft.com/fwlink/?linkid=864617';
function openDocumentLink() {
    return __awaiter(this, void 0, void 0, function* () {
        let message = yield vscode_1.window.showInformationMessage('Please get more details from documents:', moreDetails);
        if (message === moreDetails) {
            const open = require('opener');
            open(documentLink);
        }
    });
}
exports.openDocumentLink = openDocumentLink;
function openSurvey() {
    return __awaiter(this, void 0, void 0, function* () {
        const giveFeedback = 'Give Feedback';
        const isSurveyDisabledConfig = 'disableOpenSurveyLink';
        const hdiConfig = vscode_1.workspace.getConfiguration('hdinsight');
        let isSurveyDisabled = hdiConfig.get(isSurveyDisabledConfig);
        if (isSurveyDisabled) {
            return;
        }
        let message = yield vscode_1.window.showInformationMessage('Your feedback is important. Please take a minute to fill out our customer satisfaction survey. Thanks for helping us improve this experience.', giveFeedback, dontShowAgain);
        if (message === giveFeedback) {
            telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsight.opensurvey' });
            const open = require('opener');
            open(surveyLink);
        }
        else if (message === dontShowAgain) {
            yield hdiConfig.update(isSurveyDisabledConfig, true, true);
        }
    });
}
exports.openSurvey = openSurvey;
function eulaCheck() {
    let config = vscode_1.workspace.getConfiguration('hdinsight');
    let version = utils.getExtensionVersion();
    if (config.get('eula') !== 'accept&' + version) {
        let eulaPath = path.join(utils.getRootInstallDirectory(), 'LICENSE.txt');
        let previewUri = vscode_1.Uri.file(eulaPath);
        vscode_1.commands.executeCommand('vscode.open', previewUri).then(() => {
            var accept = 'Accept';
            // var decline: string = 'Decline';
            vscode_1.window.showInformationMessage('You must accept the MICROSOFT SOFTWARE LICENSE TERMS to enable Azure HDInsight Tool for VSCode', accept /*, decline*/).then(result => {
                config.update('eula', 'accept&' + version, true);
            });
        });
    }
}

//# sourceMappingURL=helpers.js.map
