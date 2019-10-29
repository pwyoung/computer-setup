'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const path = require("path");
const cp = require("child_process");
const xmlhttprequest_1 = require("xmlhttprequest");
const WebSocket = require("ws");
const authorization_1 = require("./azure/authorization");
const hdiCluster = require("./cluster/clusters");
const utils = require("./utils");
const jobs = require("./hive/jobs");
const languageService = require("./hive/languageService");
const telemetry_1 = require("./telemetry");
const hiveController_1 = require("./controllers/hiveController");
const jobType_1 = require("./job/jobType");
const fileType_1 = require("./controllers/fileType");
const jupyterService_1 = require("./pyspark/jupyterService");
const helper = require("./utils/helpers");
const seccluster_1 = require("./cluster/seccluster");
const jobs_1 = require("./pyspark/jobs");
const jobPreValidation_1 = require("./job/jobPreValidation");
const defaultOpenedEditorValidation_1 = require("./controllers/defaultOpenedEditorValidation");
const azureAccount_1 = require("./azure/azureAccount");
const pickUpManager_1 = require("./utils/pickUpManager");
const newSettings_1 = require("./newSettings");
global['XMLHttpRequest'] = xmlhttprequest_1.XMLHttpRequest;
global['WebSocket'] = WebSocket;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // maintain the variable of currentActiveEditor
    utils.currentActiveEditorRegister();
    // telemetry initialization
    telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('HDInsightExtLaunched', { Action: 'hdinsight.Launch' });
    // get azure account API
    azureAccount_1.setAzureAccountAPI();
    // binding commands
    commandsBinding(context);
    // openTextChangedEvent will not been triggered for first active document when vscode open.
    // so we need initlize Hive language service manually when extension initlize
    defaultOpenedEditorValidation_1.defaultOpenedEditorValidation(context);
    // try to login from cached refresh token
    authorization_1.loginCheck(true, context);
    helper.openSurvey();
    //TODO race condition here.
    // Comment two lines below for now, because currently the sparkdotnet functions are disabled.
    // And users are required to have prerequistes before using the below functions.
    // utils.setupWorker();
    // utils.checkDotnetEnvironment();
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
    jupyterService_1.default.getInstance().shutdown();
    telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('HDInsightExtExited', { Action: 'hdinsgiht.Exit' });
    telemetry_1.TelemetryManager.Instance.stop();
    languageService.killLanguageService();
    seccluster_1.closeAllSession();
}
exports.deactivate = deactivate;
// The command has been defined in the package.json file
// Now provide the implementation of the command with  registerCommand
// The commandId parameter must match the command field in package.json
function commandsBinding(context) {
    // const loginAction = vscode.commands.registerCommand('hdinsight.login', async () => {
    //     TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsight.Login' });
    //     await vscode.commands.executeCommand('setContext', 'hdinsight.displayTreeview', false);
    //     login(false, context);
    // });
    // context.subscriptions.push(loginAction);
    // const logoutAction = vscode.commands.registerCommand('hdinsight.logout', async () => {
    //     TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsgiht.Logout' });
    //     await vscode.commands.executeCommand('azure-account.logout');
    //     logout();
    // });
    //context.subscriptions.push(logoutAction);
    const listClusterAction = vscode.commands.registerCommand('hdinsight.listCluster', () => {
        telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsight.ListCluster' });
        hdiCluster.listClusters();
    });
    context.subscriptions.push(listClusterAction);
    const setClusterAction = vscode.commands.registerCommand('hdinsight.setCluster', () => {
        telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsight.SetDefaultCluster' });
        let isSparkCluster = false;
        let currentActiveDoc = utils.getCurrentActiveDocument();
        if (currentActiveDoc) {
            isSparkCluster = currentActiveDoc.languageId === 'python';
        }
        hdiCluster.setClusters(isSparkCluster);
    });
    context.subscriptions.push(setClusterAction);
    // const setAzureEnvironmentAction = vscode.commands.registerCommand('hdinsight.setAzureEnvironment', () => {
    //     TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsight.SetAzureEnvironment' });
    //     setAzureEnvironment(context);
    // });
    // context.subscriptions.push(setAzureEnvironmentAction);
    const submitHiveJobAction = vscode.commands.registerCommand('hdinsight.hive.submitHiveJob', (args) => {
        telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsight.SubmitHiveJob' });
        utils.logclear();
        if (jobPreValidation_1.submitActionPreValidation(fileType_1.FileType.Hql)) {
            utils.logclear();
            jobs.hiveQuery(hiveController_1.getOrCreateHiveController(context), true);
        }
    });
    context.subscriptions.push(submitHiveJobAction);
    const sparkDotnetReadmeAction = vscode.commands.registerCommand('hdinsight.spark.sparkDotnetReadme', () => {
        telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsight.sparkDotnetReadme' });
        utils.logclear();
        const readmePath = path.join(__dirname, '..', '..', 'sparkdotnet', 'Spark.NET.MD');
        vscode.workspace.openTextDocument(readmePath).then(doc => vscode.window.showTextDocument(doc));
    });
    //context.subscriptions.push(sparkDotnetReadmeAction);
    const submitPysparkJobAction = vscode.commands.registerCommand('hdinsight.spark.submitPysparkJob', () => {
        telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsight.SubmitPySparkJob' });
        utils.logclear();
        if (jobPreValidation_1.submitActionPreValidation(fileType_1.FileType.PySpark)) {
            let currentDoc = utils.getCurrentActiveDocument();
            utils.getSavedDocument(currentDoc).then(doc => {
                return hdiCluster.selectCluster(currentDoc.fileName, jobType_1.JobType.PySparkBatch);
            }).then(clusterName => {
                jobs.submitPysparkJob(clusterName, currentDoc.fileName);
            });
        }
    });
    context.subscriptions.push(submitPysparkJobAction);
    const cancelJobAction = vscode.commands.registerCommand('hdinsight.hivequerycancel', (doc) => __awaiter(this, void 0, void 0, function* () {
        telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsight.hivequerycancel' });
        yield hiveController_1.getOrCreateHiveController(context).onCancelQuery();
    }));
    context.subscriptions.push(cancelJobAction);
    const submitSparkDotnetJobAction = vscode.commands.registerCommand('hdinsight.sparkDotnet.submitSparkDotnetToRemote', () => __awaiter(this, void 0, void 0, function* () {
        telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsight.submitSparkDotnetToRemote' });
        utils.logclear();
        let selectedWorkspace = yield pickUpManager_1.selectWorkspaceFolder("Please choose a folder to create the cs project for spark dotnet");
        if (selectedWorkspace) {
            let dirPath = selectedWorkspace.uri.fsPath;
            let projectFile = yield pickUpManager_1.selectSpecifiedFiles(dirPath, 'Pick up a project file (.csproj) for spark dotnet', ".csproj");
            let executableFile = yield pickUpManager_1.selectSpecifiedFiles(`${dirPath}\\bin\\Release\\netcoreapp2.1\\`, 'Pick up a executable file (.dll) for spark dotnet local run', ".dll");
            let parametersToPass = yield vscode.window.showInputBox({
                ignoreFocusOut: true,
                prompt: '[Optional] Command line arguments',
                value: `wasb:///example/data/people.json`
            });
            let udfToPass = yield vscode.window.showInputBox({
                ignoreFocusOut: true,
                prompt: '<comma-separated list of assemblies that contain UDF definitions, if any>',
                value: executableFile
            });
            let sparkDotNetJarPath = yield pickUpManager_1.selectSpecifiedFiles(`${dirPath}\\bin\\Release\\netcoreapp2.1\\`, 'Pick up a jar file (.jar) for spark dotnet', ".jar");
            vscode.window.showInformationMessage("Submitting .NET for Spark job");
            cp.exec(`dotnet restore -r netcoreapp2.1 ${projectFile} && dotnet publish -c Release -f netcoreapp2.1 -r ubuntu.16.04-x64 ${projectFile}`, { cwd: `${dirPath}` }, (error, stdout, stderr) => {
                if (error) {
                    utils.log(`Failed due to ${error} ${stdout} ${stderr}`);
                    return;
                }
                var myenv = Object.assign({}, process.env);
                newSettings_1.SettingsManagerNew.Instance.updatePATH("hdinsightSpark.NET", "7z", myenv);
                cp.exec(`7z a ${dirPath}\\Example.zip`, { cwd: `${dirPath}\\bin\\Release\\netcoreapp2.1\\ubuntu.16.04-x64\\publish\\`, env: myenv }, (error, stdout, stderr) => __awaiter(this, void 0, void 0, function* () {
                    if (error) {
                        utils.log(`Failed due to ${error} ${stdout} ${stderr}`);
                        return;
                    }
                    let clusterName = yield hdiCluster.selectCluster(selectedWorkspace.uri.fsPath, jobType_1.JobType.PySparkBatch);
                    let dllList = udfToPass.split(",");
                    let dllPaths = "";
                    dllList.map((dll) => {
                        dllPaths += dllPaths.length > 0 ? `,${dirPath}\\bin\\Release\\netcoreapp2.1\\ubuntu.16.04-x64\\publish\\${dll}`
                            : `${dirPath}\\bin\\Release\\netcoreapp2.1\\ubuntu.16.04-x64\\publish\\${dll}`;
                    });
                    jobs.submitSparkDotnetToRemote(clusterName, `${dirPath}\\Example.zip`, `${dirPath}\\bin\\Release\\netcoreapp2.1\\${sparkDotNetJarPath}`, "org.apache.spark.deploy.DotnetRunner", `${executableFile.substring(0, executableFile.lastIndexOf('.'))},${parametersToPass}`, `${dllPaths}`);
                }));
            });
        }
        else {
            utils.log("You haven't select any folder");
        }
    }));
    //context.subscriptions.push(submitSparkDotnetJobAction);
    const submitSparkDotnetLocalAction = vscode.commands.registerCommand('hdinsight.sparkDotnet.submitLocal', () => __awaiter(this, void 0, void 0, function* () {
        telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsight.submitLocal' });
        utils.logclear();
        let selectedWorkspace = yield pickUpManager_1.selectWorkspaceFolder("Please choose a folder to create the cs project file (.csproj) for spark dotnet");
        if (selectedWorkspace) {
            let dirPath = selectedWorkspace.uri.fsPath;
            let projectFile = yield pickUpManager_1.selectSpecifiedFiles(dirPath, 'Pick up a project file (.csproj) for spark dotnet local run', ".csproj");
            let executableFile = yield pickUpManager_1.selectSpecifiedFiles(`${dirPath}\\bin\\Release\\netcoreapp2.1\\`, 'Pick up a executable file (.dll) for spark dotnet local run', ".dll");
            let optionsToPass = yield vscode.window.showInputBox({
                ignoreFocusOut: true,
                prompt: '[Optional] Additional reference as the default text in the command window',
            });
            let parametersToPass = yield vscode.window.showInputBox({
                ignoreFocusOut: true,
                prompt: '[Optional] Command line arguments',
                value: `%SPARK_HOME%\\examples\\src\\main\\resources\\people.json`
            });
            let sparkDotNetJarPath = yield pickUpManager_1.selectSpecifiedFiles(`${dirPath}\\bin\\Release\\netcoreapp2.1\\`, 'Pick up a jar file (.jar) for spark dotnet', ".jar");
            cp.exec(`dotnet publish -c Release -f netcoreapp2.1 -r win10-x64 ${projectFile}`, { cwd: `${dirPath}` }, (error, stdout, stderr) => {
                if (error) {
                    utils.log(`Failed due to ${error} ${stdout} ${stderr}`);
                    return;
                }
                let commandArgs = `${optionsToPass || ""} --class org.apache.spark.deploy.DotnetRunner --master local ${sparkDotNetJarPath} dotnet ${executableFile} ${parametersToPass} `;
                let cwd = `${dirPath}\\bin\\Release\\netcoreapp2.1\\win10-x64\\publish\\`;
                vscode.window.showInformationMessage("Submitting .NET for Spark (local) job");
                utils.sparkSubmitRunCmd(cwd, commandArgs);
            });
        }
        else {
            utils.log("You haven't select any folder");
        }
    }));
    //context.subscriptions.push(submitSparkDotnetLocalAction);
    function generateSampleSparkDotnetProject() {
        return __awaiter(this, void 0, void 0, function* () {
            let selectedWorkspace = yield pickUpManager_1.selectWorkspaceFolder("Please choose a folder to create the cs project file (.csproj) for spark .NET");
            if (selectedWorkspace) {
                utils.generateSparkDotnetSampleProjWithDependency(selectedWorkspace.uri.fsPath);
            }
            else {
                utils.log("You haven't select any folder");
            }
        });
    }
    const generateSampleSparkDotnetProjectCommand = vscode.commands.registerCommand('hdinsight.sparkDotnet.generateSparkDotnetSampleProject', (args) => __awaiter(this, void 0, void 0, function* () {
        yield generateSampleSparkDotnetProject();
    }));
    //context.subscriptions.push(generateSampleSparkDotnetProjectCommand);
    function addSparkDotnetDependency() {
        return __awaiter(this, void 0, void 0, function* () {
            let selectedWorkspace = yield pickUpManager_1.selectWorkspaceFolder("Please choose a folder to add the dependencies or spark .NET");
            if (selectedWorkspace) {
                utils.addSparkDotnetDependency(selectedWorkspace.uri.fsPath);
            }
            else {
                utils.log("You haven't select any folder");
            }
        });
    }
    const addSparkDotnetDependencyCommand = vscode.commands.registerCommand('hdinsight.sparkDotnet.addSparkDotnetDependency', (args) => __awaiter(this, void 0, void 0, function* () {
        yield addSparkDotnetDependency();
    }));
    //context.subscriptions.push(addSparkDotnetDependencyCommand);
    const pysparkInteractiveAction = vscode.commands.registerCommand('hdinsight.pyspark.interactive', () => __awaiter(this, void 0, void 0, function* () {
        telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsight.pyspark.interactive' });
        try {
            yield jobs_1.submitPySParkInteractiveAction(context);
        }
        catch (ex) {
            utils.error(`PySpark Interactive Error: ${utils.exceptionToString(ex)}`, true);
        }
    }));
    context.subscriptions.push(pysparkInteractiveAction);
    const setParameterAction = vscode.commands.registerCommand('hdinsight.setConfiguration', () => {
        telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsight.setConfiguration' });
        vscode.commands.executeCommand('workbench.action.openWorkspaceSettings');
    });
    context.subscriptions.push(setParameterAction);
    const openTextChangedEvent = vscode.workspace.onDidOpenTextDocument((doc) => {
        if (doc.fileName.endsWith('.git')) {
            return;
        }
        if (doc.fileName.endsWith('.hql') || doc.fileName.endsWith('.hive')) {
            telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('Authoring', { Action: 'hdinsight.OpenHqlFile' });
            if (!languageService.isLanguageServiceEnabled()) {
                languageService.initializeHiveLanguageService(context);
            }
        }
    });
    context.subscriptions.push(openTextChangedEvent);
    const saveTextChangedEvent = vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.fileName.endsWith('.hql') || doc.fileName.endsWith('.hive')) {
            telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('Authoring', { Action: 'hdinsight.SaveHqlFile' });
        }
    });
    context.subscriptions.push(saveTextChangedEvent);
    const interactiveHiveJobAction = vscode.commands.registerCommand('hdinsight.hive.interactiveHiveScript', (args) => {
        telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsight.interactiveHiveScript' });
        if (jobPreValidation_1.submitActionPreValidation(fileType_1.FileType.Hql)) {
            utils.logclear();
            jobs.hiveQuery(hiveController_1.getOrCreateHiveController(context));
        }
    });
    context.subscriptions.push(interactiveHiveJobAction);
    const linkClusterAction = vscode.commands.registerCommand('hdinsight.linkCluster', () => {
        telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsight.linkCluster' });
        seccluster_1.linkCluster();
    });
    context.subscriptions.push(linkClusterAction);
    const unlinkClusterAction = vscode.commands.registerCommand('hdinsight.unlinkCluster', () => {
        telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsight.unlinkCluster' });
        seccluster_1.unlinkCluster();
    });
    context.subscriptions.push(unlinkClusterAction);
}

//# sourceMappingURL=extension.js.map
