"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const utils = require("../utils");
const telemetry_1 = require("../telemetry");
const hiveServer_1 = require("../languageService/hiveServer");
const hiveCompletionItemProvider_1 = require("../languageService/hiveCompletionItemProvider");
const hiveDiagnosticsProvider_1 = require("../languageService/hiveDiagnosticsProvider");
const productConstants_1 = require("../productConstants");
const monoHelper_1 = require("../cross/monoHelper");
let _languageServiceRuntimeFolder = '';
const _HQLId = 'HQL';
let _languageService;
let languageServiceStartTime = 5;
let _isHiveLanguageServiceEnabled = false;
function isLanguageServiceEnabled() {
    return _isHiveLanguageServiceEnabled;
}
exports.isLanguageServiceEnabled = isLanguageServiceEnabled;
function initializeHiveLanguageService(context) {
    if (_isHiveLanguageServiceEnabled) {
        return;
    }
    _isHiveLanguageServiceEnabled = true;
    const _selector = {
        language: 'hql',
        scheme: 'file'
    };
    const _hiveServer = new hiveServer_1.HiveServer();
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(_selector, new hiveCompletionItemProvider_1.HiveCompletionItemProvider(_hiveServer, '/GetCompletionList'), ' ', '.'));
    context.subscriptions.push(hiveDiagnosticsProvider_1.reportDiagnostics());
    copyLanguageServiceToUserFolder().then(() => {
        startLanguageService(path.join(_languageServiceRuntimeFolder, 'HQLLanguageServiceWrapper.exe'));
    });
}
exports.initializeHiveLanguageService = initializeHiveLanguageService;
function killLanguageService() {
    return new Promise((resolve, reject) => {
        let command = '';
        switch (process.platform) {
            case 'win32':
                command = 'taskkill /F -im HQLLanguageServiceWrapper.exe';
                break;
            case 'linux':
            case 'darwin':
                command = `kill $(ps aux | grep '[H]QLLanguageServiceWrapper' | awk '{print $2}')`;
                break;
        }
        cp.exec(command, (err, stdout, stderr) => {
            return resolve();
        });
    });
}
exports.killLanguageService = killLanguageService;
function startLanguageService(path) {
    telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('LanguageService', { Action: 'hdinsgiht.Launch' });
    languageServiceStartTime--;
    let command;
    let paras = [`start`, `http://localhost:${productConstants_1.ProductConstants.DefaultLanguagePort}/`];
    switch (process.platform) {
        case 'win32':
            command = path;
            break;
        case 'linux':
        case 'darwin':
            let isMonoEnabled = monoHelper_1.checkMonoEnvironment();
            if (isMonoEnabled) {
                command = 'mono';
                paras = [path, `start`, `http://localhost:${productConstants_1.ProductConstants.DefaultLanguagePort}/`, `>1.txt`];
                break;
            }
    }
    killLanguageService().then(() => {
        _languageService = cp.spawn(command, paras);
        _languageService.stdout.on('data', (data) => {
            utils.debug(`the ${5 - languageServiceStartTime} time start language service, stdout: ${JSON.stringify(data)}`);
        });
        _languageService.stderr.on('data', (data) => {
            utils.debug(`the ${5 - languageServiceStartTime} time start language service, stderr: ${JSON.stringify(data)}`);
        });
        _languageService.on('close', (code) => {
            utils.debug('process exited with code: ' + code);
            if (languageServiceStartTime > 0) {
                startLanguageService(path);
            }
            else {
                telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('LanguageService', { Action: 'hdinsight.LunchFailedTooManyTimes' });
            }
        });
    });
}
function copyLanguageServiceToUserFolder() {
    const tempFolder = os.tmpdir();
    utils.cleanUserFolder(tempFolder, _HQLId);
    const folder = _HQLId + utils.generateUuid();
    _languageServiceRuntimeFolder = path.join(tempFolder, folder);
    fs.mkdirSync(_languageServiceRuntimeFolder);
    const sourceFolder = path.join(utils.getRootInstallDirectory(), 'LanguageService');
    const promises = utils.copyFolder(sourceFolder, _languageServiceRuntimeFolder);
    return Promise.all(promises);
}

//# sourceMappingURL=languageService.js.map
