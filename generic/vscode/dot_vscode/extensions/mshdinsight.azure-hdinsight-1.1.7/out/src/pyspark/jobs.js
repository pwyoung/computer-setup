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
const path = require("path");
const productConstants_1 = require("../productConstants");
const Constants = require("../constants/constants");
const jupyterService_1 = require("./jupyterService");
const jupyterMain = require("./main");
const sparkMagic = require("./sparkmagic");
const fileType_1 = require("../controllers/fileType");
const jobPreValidation_1 = require("../job/jobPreValidation");
const utils = require("../utils");
const authorization_1 = require("../azure/authorization");
const jobType_1 = require("../job/jobType");
const clusters_1 = require("../cluster/clusters");
let _jupyterStarted = false;
let _lastHdiConnectString = '';
function submitPySParkInteractiveAction(context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!_jupyterStarted) {
            const jupyterPath = path.join(productConstants_1.ProductConstants.WorkingFolder, Constants.jupyterDir);
            const jupyterService = jupyterService_1.default.getInstance(jupyterPath);
            const preCheck = yield jupyterService.preCheck();
            if (!preCheck) {
                return;
            }
            const isJupyterInstalled = yield jupyterService.validate();
            if (!isJupyterInstalled) {
                const installed = yield jupyterService.install();
                if (!installed) {
                    return;
                }
                // double check after the installation
                const isInstalledWell = yield jupyterService.validate();
                if (!isInstalledWell) {
                    return;
                }
            }
            // In case of the break upgrade of python extension, register related commands  using our own jupyter window
            const jupyter = new jupyterMain.Jupyter(jupyterService.getPythonPath());
            context.subscriptions.push(jupyter);
        }
        try {
            yield submitPySparkInteractive(jobPreValidation_1.submitActionPreValidation);
        }
        catch (ex) {
            utils.error(`Submit PySpark Interactive Job error: ${utils.exceptionToString(ex)}`, true);
        }
    });
}
exports.submitPySParkInteractiveAction = submitPySParkInteractiveAction;
function submitPySparkInteractive(validation) {
    return __awaiter(this, void 0, void 0, function* () {
        const jupyterConfig = vscode.workspace.getConfiguration('hdinsightJupyter');
        const pythonExtensionEnable = jupyterConfig.get('pythonExtensionEnabled', true);
        if (validation && validation(fileType_1.FileType.PySpark)) {
            const currentDoc = yield utils.getSavedDocument();
            const clusterName = yield clusters_1.selectCluster(currentDoc.fileName, jobType_1.JobType.SparkInteractive);
            const selectedCluster = authorization_1.CredentialsManagerInstance.getCluster(clusterName);
            if (!selectedCluster) {
                throw new Error('no cluster selected!');
            }
            // Currently http header 'X-Requested-By' is not supported on Sparkmagic of Python3 (Python2 is OK).
            // But the header is required for spark 2.2/2.3 clsuter. We have to disable pyspark3kernel(only use pysparkkernel)
            const sparkVersion = selectedCluster.getSparkVersion();
            if (sparkVersion.indexOf('2.2') >= 0 || sparkVersion.indexOf('2.3') >= 0 || sparkVersion === 'unknown') {
                jupyterService_1.default.getInstance().pyspark3kernelDisabled = true;
                if (pythonExtensionEnable) {
                    jupyterService_1.default.getInstance().increasePriorityOfPysparkkernel();
                }
            }
            else {
                jupyterService_1.default.getInstance().pyspark3kernelDisabled = false;
                if (pythonExtensionEnable) {
                    jupyterService_1.default.getInstance().increasePriorityOfPyspark3kernel();
                }
            }
            const pythonConfig = vscode.workspace.getConfiguration('python');
            // set related config information for python extension
            if (pythonExtensionEnable) {
                // set our virtual environment path
                try {
                    yield pythonConfig.update('pythonPath', jupyterService_1.default.getInstance().getPythonPath(), false);
                }
                catch (err) {
                    utils.error(err);
                    vscode.window.showErrorMessage('Please open the script in a folder/workspace, because we need modify some folder/workspace settings before submitting it.');
                    return;
                }
                if (!_jupyterStarted) {
                    utils.log(`The connected cluster for the PySpark interactive query is: ${selectedCluster.getConnectString()}`);
                }
                if (!_jupyterStarted) {
                    const moreDetails = 'More Details';
                    vscode.window
                        .showInformationMessage('We have changed your pythonPath to the hdinsight virtual environment for this folder. If you want to use your own python env in this floder, you need switch it back manually.', moreDetails)
                        .then((message) => {
                        if (message === moreDetails) {
                            vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(Constants.ManuallySpecifyPythonInterpreterDocLink));
                        }
                    });
                }
            }
            // activate python extension
            const pythonExtension = vscode.extensions.getExtension('ms-python.python');
            if (pythonExtension === undefined) {
                return;
            }
            if (pythonExtensionEnable) {
                if (pythonExtension.isActive === false) {
                    try {
                        yield pythonExtension.activate();
                    }
                    catch (err) {
                        utils.error(err);
                        return;
                    }
                }
            }
            const hdiConnectString = selectedCluster.getConnectString();
            const url = selectedCluster.getLivyEndpoint();
            const userName = yield selectedCluster.getAmbariUserName();
            const password = yield selectedCluster.getAmbariPassword();
            const isChanged = sparkMagic.generateConf(userName, password, url);
            if (isChanged) {
                // try to shutdown the jupyter kernel if the configuration changed
                if (!pythonExtensionEnable) {
                    yield vscode.commands.executeCommand('hdinsgiht.jupyter.shutdown');
                }
                else {
                    if (_jupyterStarted) {
                        utils.log('......');
                        utils.log(`The connected cluster for PySpark interactive query has been changed from ${_lastHdiConnectString} to ${hdiConnectString}.`);
                        utils.warn(`Click the ‘Restart’ button either in the information dialog or at the upper-right corner in the interactive tab, then re-submit your interactive query to ${hdiConnectString} after the Jupyter service gets restarted. `);
                    }
                    // this method calls an information message, which needs to be clicked manually.
                    yield vscode.commands.executeCommand('python.datascience.restartkernel');
                }
            }
            if (!pythonExtensionEnable) {
                vscode.commands.executeCommand('hdinsgiht.jupyter.runSelectionLine');
            }
            else {
                // TODO: python interactive output has filtered the kernel/link information. Consider running `%%info` automatically for the first submit.
                vscode.commands.executeCommand('python.datascience.execSelectionInteractive');
            }
            _jupyterStarted = true;
            _lastHdiConnectString = hdiConnectString;
        }
    });
}
// Deprecated for now!!! return true if validation is disabled. else return false
function openEnvCheckWindowForValidation() {
    return __awaiter(this, void 0, void 0, function* () {
        const validation = 'Continue Validation';
        const disableValidation = 'Disable Validation';
        const moreDetails = 'More Details';
        const dontShowAgain = `Don't show again`;
        const documentLink = 'https://docs.microsoft.com/en-us/azure/hdinsight/hdinsight-for-vscode';
        const windowMessage = `To submit interactive PySpark queries, Spark & Hive Tools will validate and setup the following environment: \
    Python, Pip, Jupyter, Sparkmagic, Spark Kernel, Matplotlib and Python extension of VSCode.`;
        const azureConfig = vscode.workspace.getConfiguration('hdinsight');
        let keyConf = azureConfig.get('disablePysparkEnvironmentValidation', 'undefined');
        let isPythonEnvValidationDisabled = keyConf === 'undefined' ? undefined : keyConf === 'yes' ? true : false;
        if (isPythonEnvValidationDisabled === undefined) {
            let message = yield vscode.window.showInformationMessage(windowMessage, validation, disableValidation, moreDetails);
            const open = require('opener');
            switch (message) {
                case moreDetails:
                    open(documentLink);
                    // reopen the pickup window
                    return yield openEnvCheckWindowForValidation();
                case disableValidation:
                    isPythonEnvValidationDisabled = true;
                    keyConf = 'yes';
                    yield azureConfig.update('disablePysparkEnvironmentValidation', 'yes', vscode.ConfigurationTarget.Global);
                    break;
                case validation:
                    keyConf = 'no';
                    isPythonEnvValidationDisabled = false;
                    yield azureConfig.update('disablePysparkEnvironmentValidation', 'no', vscode.ConfigurationTarget.Global);
                    break;
                default:
                    isPythonEnvValidationDisabled = false;
            }
        }
        if ((yield azureConfig.get('disablePysparkValidationWindow')) !== true) {
            vscode.window
                .showInformationMessage(`Config 'hdinsight.disablePysparkEnvironmentValidation' has been set as ` +
                `${keyConf}, change it by selecting File->Preferences->Settings`, dontShowAgain)
                .then((message) => {
                if (message === dontShowAgain) {
                    azureConfig.update('disablePysparkValidationWindow', true, vscode.ConfigurationTarget.Global);
                }
            });
        }
        return isPythonEnvValidationDisabled;
    });
}
exports.openEnvCheckWindowForValidation = openEnvCheckWindowForValidation;

//# sourceMappingURL=jobs.js.map
