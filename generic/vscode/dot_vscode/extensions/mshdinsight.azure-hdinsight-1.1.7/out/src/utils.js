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
const uuid = require("uuid");
const path = require("path");
const fs = require("fs");
const vscode = require("vscode");
const vscode_1 = require("vscode");
const open = require("opener");
const cp = require("child_process");
const common_1 = require("./common");
const logger_1 = require("./logger");
const platform = require("./cross/platform");
const Constants = require("./constants/constants");
const ms_rest_nodeauth_1 = require("@azure/ms-rest-nodeauth");
const newSettings_1 = require("./newSettings");
const HIVE_LOGGER_NAME = Constants.outputChannelName;
function log(info, isDisplay, isClear) {
    if (isClear) {
        logclear();
    }
    logger_1.Logger.getLogger(HIVE_LOGGER_NAME).log(info, isDisplay);
}
exports.log = log;
function debug(info) {
    // Logger.getLogger(HIVE_LOGGER_NAME).debug(info);
}
exports.debug = debug;
function logclear() {
    logger_1.Logger.getLogger(HIVE_LOGGER_NAME).clear();
}
exports.logclear = logclear;
function logAppend(info) {
    logger_1.Logger.getLogger(HIVE_LOGGER_NAME).append(info);
}
exports.logAppend = logAppend;
function logAppendLine(info) {
    logger_1.Logger.getLogger(HIVE_LOGGER_NAME).appendLine(info);
}
exports.logAppendLine = logAppendLine;
function warn(info, isDisplay) {
    logger_1.Logger.getLogger(HIVE_LOGGER_NAME).log(info, isDisplay, logger_1.LogType.Warning);
}
exports.warn = warn;
function error(info, isDisplay) {
    logger_1.Logger.getLogger(HIVE_LOGGER_NAME).log(info, isDisplay, logger_1.LogType.Error);
}
exports.error = error;
function logHiveServerLogs(info) {
    logger_1.Logger.getLogger(HIVE_LOGGER_NAME).logInfoWithoutPrefix(info);
}
exports.logHiveServerLogs = logHiveServerLogs;
function logWithoutPrefix(info) {
    logger_1.Logger.getLogger(HIVE_LOGGER_NAME).logInfoWithoutPrefix(info);
}
exports.logWithoutPrefix = logWithoutPrefix;
function generateUuid() {
    return uuid.v4();
}
exports.generateUuid = generateUuid;
function openInBrowser(url) {
    open(url, (error, stdout, stderr) => {
        if (error || stderr) {
            let message = error ? JSON.stringify(error) : stderr;
            error(`Failed to open browser due to ${message}`);
        }
    });
}
exports.openInBrowser = openInBrowser;
function getRootInstallDirectory() {
    const rootPath = path.join(__dirname, '..', '..');
    return rootPath;
}
exports.getRootInstallDirectory = getRootInstallDirectory;
function delay(milliseconds) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(milliseconds);
        }, milliseconds);
    });
}
exports.delay = delay;
function copyFolder(sourceFolder, destFolder) {
    if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder);
    }
    const copyFileList = fs.readdirSync(sourceFolder);
    const promises = copyFileList.map((file) => {
        if (fs.statSync(path.join(sourceFolder, file)).isDirectory()) {
            return copyFolder(path.join(sourceFolder, file), path.join(destFolder, file));
        }
        else {
            return fs.writeFileSync(path.join(destFolder, file), fs.readFileSync(path.join(sourceFolder, file)));
        }
    });
    return promises;
}
exports.copyFolder = copyFolder;
function cleanUserFolder(folder, cleanFolderPrefix) {
    try {
        fs.readdirSync(folder).forEach((dir) => {
            if (dir.startsWith(cleanFolderPrefix)) {
                const currentFolder = path.join(folder, dir);
                fs.readdirSync(currentFolder).forEach((file) => {
                    fs.unlinkSync(path.join(currentFolder, file));
                });
                fs.rmdirSync(currentFolder);
            }
        });
    }
    catch (err) {
        // remove temp files. ignore any exceptions.
        debug(`remove Hive language service files error: {JSON.stringify(err)}`);
    }
}
exports.cleanUserFolder = cleanUserFolder;
function getSavedDocument(currentDoc) {
    const currentActiveDoc = getCurrentActiveDocument();
    if (!currentDoc && currentActiveDoc) {
        currentDoc = currentActiveDoc;
    }
    if (!currentDoc) {
        return Promise.reject('no active document');
    }
    let def = common_1.createDeferred();
    if (currentDoc.isDirty) {
        currentDoc.save().then((value) => {
            if (value) {
                def.resolve(currentDoc);
            }
            else {
                vscode_1.window.showInformationMessage('SaveFileFailed');
                def.reject();
            }
        });
        return def.promise;
    }
    else {
        return Promise.resolve(currentDoc);
    }
}
exports.getSavedDocument = getSavedDocument;
function EndOfLine() {
    return process.platform === 'win32' ? '\r\n' : '\n';
}
exports.EndOfLine = EndOfLine;
function getUserAgent() {
    return `HDInsight VSCode extension ${getExtensionVersion()} ${vscode_1.env.sessionId}`;
}
exports.getUserAgent = getUserAgent;
let _pkgConfig = null;
function getPkgConfig() {
    if (!_pkgConfig) {
        _pkgConfig = require('../../package.json');
    }
    return _pkgConfig;
}
exports.getPkgConfig = getPkgConfig;
function getExtensionVersion() {
    return getPkgConfig().version;
}
exports.getExtensionVersion = getExtensionVersion;
let _accountStatusBarItem;
function setHdiStatusBar(info) {
    if (!_accountStatusBarItem) {
        _accountStatusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
    }
    _accountStatusBarItem.text = info;
    _accountStatusBarItem.show();
}
exports.setHdiStatusBar = setHdiStatusBar;
let _currentPlatform;
function getPlatform() {
    if (!_currentPlatform) {
        _currentPlatform = platform.getCurrentPlatform();
    }
    return _currentPlatform;
}
exports.getPlatform = getPlatform;
let _currentActiveTextEditor = typeof (vscode_1.window.activeTextEditor) === 'undefined' || typeof (vscode_1.window.activeTextEditor.viewColumn) === 'undefined' ?
    null : vscode_1.window.activeTextEditor;
function currentActiveEditorRegister() {
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (!editor) {
            setCurrentActiveEditor(null);
            // use viewcolumn to decide whether the event is for a real Editor or not
        }
        else if (typeof editor.viewColumn !== 'undefined') {
            setCurrentActiveEditor(editor);
        }
    });
}
exports.currentActiveEditorRegister = currentActiveEditorRegister;
function setCurrentActiveEditor(editor) {
    _currentActiveTextEditor = editor;
}
function getCurrentActiveEditor() {
    return _currentActiveTextEditor;
}
exports.getCurrentActiveEditor = getCurrentActiveEditor;
function getCurrentActiveDocument() {
    const currentActiveEditor = _currentActiveTextEditor;
    if (currentActiveEditor) {
        return currentActiveEditor.document;
    }
    return null;
}
exports.getCurrentActiveDocument = getCurrentActiveDocument;
let currentProgressInterval;
function setProgressMessage(message, isInterval) {
    if (currentProgressInterval) {
        clearInterval(currentProgressInterval);
        currentProgressInterval = null;
        // to new line
        logAppendLine('');
    }
    setHdiStatusBar(message);
    if (isInterval) {
        let statusBar = 1;
        currentProgressInterval = setInterval(() => {
            setHdiStatusBar(message + ' ' + (statusBar === 0 ? '/' : '\\'));
            logAppend('.');
            statusBar ^= 1;
        }, 700);
    }
}
exports.setProgressMessage = setProgressMessage;
function stopProgressMessage() {
    setProgressMessage('');
}
exports.stopProgressMessage = stopProgressMessage;
/**
 * Format a string. Behaves like C#'s string.Format() function.
 */
function formatString(str, ...args) {
    // This is based on code originally from https://github.com/Microsoft/vscode/blob/master/src/vs/nls.js
    // License: https://github.com/Microsoft/vscode/blob/master/LICENSE.txt
    let result;
    if (args.length === 0) {
        result = str;
    }
    else {
        result = str.replace(/\{(\d+)\}/g, (match, rest) => {
            let index = rest[0];
            return typeof args[index] !== 'undefined' ? args[index] : match;
        });
    }
    return result;
}
exports.formatString = formatString;
function getActiveTextEditorUri() {
    const currentActiveDoc = getCurrentActiveDocument();
    if (currentActiveDoc) {
        return currentActiveDoc.uri.toString();
    }
    return '';
}
exports.getActiveTextEditorUri = getActiveTextEditorUri;
function isEmpty(str) {
    return (!str || '' === str);
}
exports.isEmpty = isEmpty;
function isNotEmpty(str) {
    return (str && '' !== str);
}
exports.isNotEmpty = isNotEmpty;
// CONSTANTS //////////////////////////////////////////////////////////////////////////////////////
const msInH = 3.6e6;
const msInM = 60000;
const msInS = 1000;
/**
 * Takes a string in the format of HH:MM:SS.MS and returns a number representing the time in
 * miliseconds
 * @param value The string to convert to milliseconds
 * @return False is returned if the string is an invalid format,
 *         the number of milliseconds in the time string is returned otherwise.
 */
function parseTimeString(value) {
    if (!value) {
        return false;
    }
    let tempVal = value.split('.');
    if (tempVal.length === 1) {
        // Ideally would handle more cleanly than this but for now handle case where ms not set
        tempVal = [tempVal[0], '0'];
    }
    else if (tempVal.length !== 2) {
        return false;
    }
    let msString = tempVal[1];
    let msStringEnd = msString.length < 3 ? msString.length : 3;
    let ms = parseInt(tempVal[1].substring(0, msStringEnd), 10);
    tempVal = tempVal[0].split(':');
    if (tempVal.length !== 3) {
        return false;
    }
    let h = parseInt(tempVal[0], 10);
    let m = parseInt(tempVal[1], 10);
    let s = parseInt(tempVal[2], 10);
    return ms + (h * msInH) + (m * msInM) + (s * msInS);
}
exports.parseTimeString = parseTimeString;
/**
 * Takes a number of milliseconds and converts it to a string like HH:MM:SS.fff
 * @param value The number of milliseconds to convert to a timespan string
 * @returns A properly formatted timespan string.
 */
function parseNumAsTimeString(value) {
    let tempVal = value;
    let h = Math.floor(tempVal / msInH);
    tempVal %= msInH;
    let m = Math.floor(tempVal / msInM);
    tempVal %= msInM;
    let s = Math.floor(tempVal / msInS);
    tempVal %= msInS;
    let hs = h < 10 ? '0' + h : '' + h;
    let ms = m < 10 ? '0' + m : '' + m;
    let ss = s < 10 ? '0' + s : '' + s;
    let mss = tempVal < 10 ? '00' + tempVal : tempVal < 100 ? '0' + tempVal : '' + tempVal;
    let rs = hs + ':' + ms + ':' + ss;
    return tempVal > 0 ? rs + '.' + mss : rs;
}
exports.parseNumAsTimeString = parseNumAsTimeString;
class Timer {
    constructor() {
        this.start();
    }
    // Get the duration of time elapsed by the timer, in milliseconds
    getDuration() {
        if (!this._startTime) {
            return -1;
        }
        else if (!this._endTime) {
            let endTime = process.hrtime(this._startTime);
            return endTime[0] * 1000 + endTime[1] / 1000000;
        }
        else {
            return this._endTime[0] * 1000 + this._endTime[1] / 1000000;
        }
    }
    start() {
        this._startTime = process.hrtime();
    }
    end() {
        if (!this._endTime) {
            this._endTime = process.hrtime(this._startTime);
        }
    }
}
exports.Timer = Timer;
function nullValue() {
    return undefined;
}
exports.nullValue = nullValue;
function deleteFolderRecursive(deletePath) {
    if (fs.existsSync(deletePath)) {
        fs.readdirSync(deletePath).forEach(function (file, index) {
            var curPath = path.join(deletePath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            }
            else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(deletePath);
    }
}
exports.deleteFolderRecursive = deleteFolderRecursive;
exports.IS_WINDOWS = /^win/.test(process.platform);
exports.PATH_VARIABLE_NAME = exports.IS_WINDOWS ? 'Path' : 'PATH';
const PathValidity = new Map();
function validatePath(filePath) {
    if (filePath.length === 0) {
        return Promise.resolve('');
    }
    if (PathValidity.has(filePath)) {
        return Promise.resolve(PathValidity.get(filePath) ? filePath : '');
    }
    return new Promise(resolve => {
        fs.exists(filePath, exists => {
            PathValidity.set(filePath, exists);
            return resolve(exists ? filePath : '');
        });
    });
}
exports.validatePath = validatePath;
function fsExistsAsync(filePath) {
    return new Promise(resolve => {
        fs.exists(filePath, exists => {
            PathValidity.set(filePath, exists);
            return resolve(exists);
        });
    });
}
exports.fsExistsAsync = fsExistsAsync;
function formatErrorForLogging(error) {
    let message = '';
    if (typeof error === 'string') {
        message = error;
    }
    else {
        if (error.message) {
            message = `Error Message: ${error.message}`;
        }
        if (error.name && error.message.indexOf(error.name) === -1) {
            message += `, (${error.name})`;
        }
        if (error.xhr && error.xhr.responseText) {
            message += `, (${error.xhr.responseText})`;
        }
        const innerException = error.innerException;
        if (innerException && (innerException.message || innerException.name)) {
            if (innerException.message) {
                message += `, Inner Error Message: ${innerException.message}`;
            }
            if (innerException.name && innerException.message.indexOf(innerException.name) === -1) {
                message += `, (${innerException.name})`;
            }
        }
    }
    return message;
}
exports.formatErrorForLogging = formatErrorForLogging;
function getSubDirectories(rootDir) {
    return new Promise(resolve => {
        fs.readdir(rootDir, (error, files) => {
            if (error) {
                return resolve([]);
            }
            let subDirs = [];
            files.forEach(name => {
                const fullPath = path.join(rootDir, name);
                try {
                    if (fs.statSync(fullPath).isDirectory()) {
                        subDirs.push(fullPath);
                    }
                }
                catch (ex) {
                    // do nothing
                }
            });
            resolve(subDirs);
        });
    });
}
exports.getSubDirectories = getSubDirectories;
function isNotNull(item) {
    if (item === undefined || item === null) {
        return false;
    }
    return true;
}
exports.isNotNull = isNotNull;
/**
 *
 * @param ex could be an error or reject object
 */
function exceptionToString(ex) {
    if (ex instanceof Error) {
        return ex.toString();
    }
    else {
        return JSON.stringify(ex);
    }
}
exports.exceptionToString = exceptionToString;
/**
 * pop up input window popupTimesMax times at most
 * @param func vscode input box or quick picker action
 * @param errorMessage error message when input box is empty
 * @param popupTimesMax times the input window will pop up at most
 * @return target string or null
 */
function vscodeInputBoxActionWithRetry(func, errorMessage, popupTimesMax = 2, cancellationToken) {
    return __awaiter(this, void 0, void 0, function* () {
        if (cancellationToken && cancellationToken.isCancellationRequested) {
            return undefined;
        }
        let res = yield func();
        let popupTimes = 1;
        // the inpu string should be trimmed
        if (res) {
            res = res.trim();
        }
        if (res === undefined) {
            return;
        }
        if (popupTimes === popupTimesMax) {
            return res;
        }
        while (res === '' && popupTimes < popupTimesMax) {
            // retry if res is empty
            res = yield func();
            if (res) {
                res = res.trim();
            }
            popupTimes++;
        }
        if (res) {
            res = res.trim();
        }
        if (res === '') {
            throw new Error(errorMessage);
        }
        else {
            return res;
        }
    });
}
exports.vscodeInputBoxActionWithRetry = vscodeInputBoxActionWithRetry;
function checkDotnetEnvironment(force = false) {
    if (force || platform.Platform.Windows != platform.getCurrentPlatform()) {
        const result = cp.spawnSync('dotnet', ['--version'], { encoding: 'utf8' });
        const dotnetVersionPatternRegex = new RegExp(/^2\.\d*\.\d*/);
        const regRes = dotnetVersionPatternRegex.exec(result.stdout);
        if (result.error || result.stderr) {
            this.downloadDotNet("Please download and install .NET Core 2.0(remove any previous verison if you have)");
            return false;
        }
        else {
            if (regRes) {
                return true;
            }
            else {
                this.downloadDotNet("Please download and install .NET Core 2.0(remove any previous verison if you have)");
                return false;
            }
        }
    }
    return true;
}
exports.checkDotnetEnvironment = checkDotnetEnvironment;
function setupWorker() {
    let workerPath = path.join(__dirname, '..', '..', 'sparkdotnet', 'worker');
    if (!fs.existsSync(workerPath)) {
        fs.mkdirSync(workerPath);
    }
    let workerFiles = fs.readdirSync(workerPath);
    if (workerFiles.length > 1) {
        process.env["DotnetWorkerPath"] = workerPath;
    }
    else {
        const zipPath = path.join(__dirname, '..', '..', 'sparkdotnet', 'Microsoft.Spark.Worker.netcoreapp2.1.win-x64-0.2.0.zip');
        var myenv = Object.assign({}, process.env);
        newSettings_1.SettingsManagerNew.Instance.updatePATH("hdinsightSpark.NET", "7z", myenv);
        cp.exec(`7z x ${zipPath}`, { cwd: `${workerPath}`, env: myenv }, (error, stdout, stderr) => {
            if (error) {
                log(`Failed due to ${error}. ${stdout} ${stderr}`);
                return;
            }
            process.env["DotnetWorkerPath"] = workerPath;
        });
    }
}
exports.setupWorker = setupWorker;
function addSparkDotnetDependency(rootPath) {
    cp.exec(`dotnet add package Microsoft.Spark --version 0.2.0`, { cwd: `${rootPath}` }, (error, stdout, stderr) => {
        if (error) {
            log(`Failed due to ${error}. ${stdout} ${stderr}`);
            return;
        }
        cp.exec(`dotnet build -c Release`, { cwd: `${rootPath}` }, (error, stdout, stderr) => {
            if (error) {
                log(`Failed due to ${error}. ${stdout} ${stderr}`);
                return;
            }
        });
    });
}
exports.addSparkDotnetDependency = addSparkDotnetDependency;
function generateSparkDotnetSampleProjWithDependency(rootPath) {
    cp.exec(`dotnet new console`, { cwd: `${rootPath}` }, (error, stdout, stderr) => {
        if (error) {
            log(`Failed due to ${error}. ${stdout} ${stderr}`);
            return;
        }
        cp.exec(`dotnet add package Microsoft.Spark --version 0.2.0`, { cwd: `${rootPath}` }, (error, stdout, stderr) => {
            if (error) {
                log(`Failed due to ${error}. ${stdout} ${stderr}`);
                return;
            }
            const projectStream = fs.createWriteStream(`${rootPath}\\Program.cs`);
            projectStream.write(`
using System;
using Microsoft.Spark.Sql;

namespace SampleSparkProject
{
    class Program
    {
        static void Main(string[] args)
        {
            var spark = SparkSession.Builder().GetOrCreate();
            var df = spark.Read().Json(args[0]);
            df.Show();
        }
    }
}
                `);
            projectStream.close();
            cp.exec(`dotnet build -c Release`, { cwd: `${rootPath}` }, (error, stdout, stderr) => {
                if (error) {
                    log(`Failed due to ${error}. ${stdout} ${stderr}`);
                    return;
                }
            });
        });
    });
}
exports.generateSparkDotnetSampleProjWithDependency = generateSparkDotnetSampleProjWithDependency;
function sparkSubmitRunCmd(cwd, commandArgs) {
    if (!!process.env["DotnetWorkerPath"]) {
        var myenv = Object.assign({}, process.env);
        newSettings_1.SettingsManagerNew.Instance.appendPATH(newSettings_1.SettingsManagerNew.Instance.updateVariable("hdinsightSpark.NET", "JAVA_HOME", myenv) + path.sep + "bin", myenv);
        newSettings_1.SettingsManagerNew.Instance.appendPATH(newSettings_1.SettingsManagerNew.Instance.updateVariable("hdinsightSpark.NET", "SCALA_HOME", myenv) + path.sep + "bin", myenv);
        newSettings_1.SettingsManagerNew.Instance.appendPATH(newSettings_1.SettingsManagerNew.Instance.updateVariable("hdinsightSpark.NET", "SPARK_HOME", myenv) + path.sep + "bin", myenv);
        newSettings_1.SettingsManagerNew.Instance.appendPATH(newSettings_1.SettingsManagerNew.Instance.updateVariable("hdinsightSpark.NET", "HADOOP_HOME", myenv) + path.sep + "bin", myenv);
        let submitCmd = platform.getCurrentPlatform() == platform.Platform.Windows ? 'spark-submit2.cmd' : 'spark-submit.cmd';
        setProgressMessage('loading', true);
        //    let sparkSubmit = cp.exec(finalCmd, {cwd: `${cwd}`});
        let sparkSubmit = cp.spawn(submitCmd, commandArgs.split(' '), {
            shell: true,
            cwd: `${cwd}`,
            env: myenv
        });
        sparkSubmit.stdout.on('data', (d) => {
            stopProgressMessage();
            logWithoutPrefix(d.toString());
        });
        sparkSubmit.stderr.on('data', (d) => {
            stopProgressMessage();
            logWithoutPrefix(d.toString());
        });
        sparkSubmit.on('error', (d) => {
            stopProgressMessage();
            logWithoutPrefix(d.toString());
        });
    }
    else {
        error(`Please wait a while. Spark .NET local run is not ready.`);
    }
}
exports.sparkSubmitRunCmd = sparkSubmitRunCmd;
function uploadFileToStorage(cluster, localFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        let index = localFilePath.lastIndexOf('/') + 1;
        if (index === 0) {
            index = localFilePath.lastIndexOf('\\') + 1;
        }
        const fileName = localFilePath.substring(index);
        const releativeRemotePath = `spark_job_fromvscode/${generateUuid()}/${fileName}`;
        log(`upload local file ${localFilePath} to storage`, true);
        const fullRemotePath = yield cluster.uploadFileToStorage(localFilePath, releativeRemotePath);
        log(`upload file to ${fullRemotePath} successfully!`, true);
        return fullRemotePath;
    });
}
exports.uploadFileToStorage = uploadFileToStorage;
/**
 * generate new style credentials of '@azure/ms-rest-nodeauth' from the old one of 'ms-rest'
 * @param oldCredentials old style crendentials
 * @return new style crendentials
 */
function generateNewCredentials(oldCredentials) {
    return new ms_rest_nodeauth_1.DeviceTokenCredentials(oldCredentials['clientId'], oldCredentials['domain'], oldCredentials['username'], oldCredentials['tokenAudience'], oldCredentials['environment'], oldCredentials['tokenCache']);
}
exports.generateNewCredentials = generateNewCredentials;
function arePathSame(path1, path2) {
    path1 = path.normalize(path1);
    path2 = path.normalize(path2);
    if (process.platform === 'win32') {
        return path1.toUpperCase() === path2.toUpperCase();
    }
    else {
        return path1 === path2;
    }
}
exports.arePathSame = arePathSame;

//# sourceMappingURL=utils.js.map
