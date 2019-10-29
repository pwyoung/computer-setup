"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: Cleanup this place
// Add options for execPythonFile
const path = require("path");
const fs = require("fs");
const child_process = require("child_process");
const settings = require("./configSettings");
const vscode_1 = require("vscode");
const helpers_1 = require("./helpers");
const envFileParser_1 = require("./envFileParser");
const jupyterService_1 = require("../../jupyterService");
const utils = require("../../../utils");
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
let pythonInterpretterDirectory;
let previouslyIdentifiedPythonPath;
let customEnvVariables = null;
// If config settings change then clear env variables that we have cached
// Remember, the path to the python interpreter can change, hence we need to re-set the paths
settings.PythonSettings.getInstance().on('change', function () {
    customEnvVariables = null;
});
function getPythonInterpreterDirectory() {
    // If we already have it and the python path hasn't changed, yay
    if (pythonInterpretterDirectory && previouslyIdentifiedPythonPath === settings.PythonSettings.getInstance().pythonPath) {
        return Promise.resolve(pythonInterpretterDirectory);
    }
    return new Promise(resolve => {
        let pythonFileName = settings.PythonSettings.getInstance().pythonPath;
        // Check if we have the path
        if (path.basename(pythonFileName) === pythonFileName) {
            // No path provided
            return resolve('');
        }
        // If we can execute the python, then get the path from the fully qualified name
        child_process.execFile(pythonFileName, ['-c', 'print(1234)'], {}, (error, stdout, stderr) => {
            // Yes this is a valid python path
            if (stdout.startsWith('1234')) {
                return resolve(path.dirname(pythonFileName));
            }
            // No idea, didn't work, hence don't reject, but return empty path
            resolve('');
        });
    }).then(value => {
        // Cache and return
        previouslyIdentifiedPythonPath = settings.PythonSettings.getInstance().pythonPath;
        return pythonInterpretterDirectory = value;
    }).catch(() => {
        // Don't care what the error is, all we know is that this doesn't work
        return pythonInterpretterDirectory = '';
    });
}
exports.getPythonInterpreterDirectory = getPythonInterpreterDirectory;
function setEnvironmentVariables(pyPath) {
    if (customEnvVariables === null) {
        customEnvVariables = getCustomEnvVars();
        customEnvVariables = customEnvVariables ? customEnvVariables : {};
        customEnvVariables = envFileParser_1.mergeEnvVariables(customEnvVariables, process.env);
        customEnvVariables[exports.PATH_VARIABLE_NAME] = pyPath;
    }
}
function execPythonFileSync(file, args, cwd) {
    return getPythonInterpreterDirectory().then(pyPath => {
        // We don't have a path
        if (pyPath.length === 0) {
            return spawnFileInternal(file, args, { cwd }, false, () => { });
        }
        setEnvironmentVariables(pyPath);
        return spawnFileInternal(file, args, { cwd, env: customEnvVariables }, false, () => { });
    }).catch(err => {
        throw err;
    });
}
exports.execPythonFileSync = execPythonFileSync;
function spanwPythonFile(file, args, cwd) {
    return getPythonInterpreterDirectory().then(pyPath => {
        // We don't have a path
        if (pyPath.length === 0) {
            return child_process.spawn(file, args, { cwd });
        }
        setEnvironmentVariables(pyPath);
        return child_process.spawn(file, args, { cwd, env: customEnvVariables });
    });
}
exports.spanwPythonFile = spanwPythonFile;
function execPythonFile(file, args, cwd, includeErrorAsResponse = false, stdOut = utils.nullValue(), token) {
    // If running the python file, then always revert to execFileInternal
    // Cuz python interpreter is always a file and we can and will always run it using child_process.execFile()
    if (file === settings.PythonSettings.getInstance().pythonPath) {
        if (stdOut) {
            return spawnFileInternal(file, args, { cwd }, includeErrorAsResponse, stdOut, token);
        }
        return execFileInternal(file, args, { cwd: cwd }, includeErrorAsResponse, token);
    }
    return getPythonInterpreterDirectory().then(pyPath => {
        // We don't have a path
        if (pyPath.length === 0) {
            if (stdOut) {
                return spawnFileInternal(file, args, { cwd }, includeErrorAsResponse, stdOut, token);
            }
            return execFileInternal(file, args, { cwd: cwd }, includeErrorAsResponse, token);
        }
        if (customEnvVariables === null) {
            customEnvVariables = getCustomEnvVars();
            customEnvVariables = customEnvVariables ? customEnvVariables : {};
            customEnvVariables = envFileParser_1.mergeEnvVariables(customEnvVariables, process.env);
            customEnvVariables[exports.PATH_VARIABLE_NAME] = pyPath;
        }
        if (stdOut) {
            return spawnFileInternal(file, args, { cwd, env: customEnvVariables }, includeErrorAsResponse, stdOut, token);
        }
        return execFileInternal(file, args, { cwd, env: customEnvVariables }, includeErrorAsResponse, token);
    });
}
exports.execPythonFile = execPythonFile;
function handleResponse(file, includeErrorAsResponse, error, stdout, stderr, token) {
    return new Promise((resolve, reject) => {
        if (token && token.isCancellationRequested) {
            return;
        }
        if (helpers_1.isNotInstalledError(error)) {
            return reject(error);
        }
        // pylint:
        //      In the case of pylint we have some messages (such as config file not found and using default etc...) being returned in stderr
        //      These error messages are useless when using pylint   
        if (includeErrorAsResponse && (stdout.length > 0 || stderr.length > 0)) {
            return resolve(stdout + '\n' + stderr);
        }
        let hasErrors = (error && error.message.length > 0) || (stderr && stderr.length > 0);
        if (hasErrors && (typeof stdout !== 'string' || stdout.length === 0)) {
            let errorMsg = (error && error.message) ? error.message : (stderr && stderr.length > 0 ? stderr + '' : '');
            console.error('stdout');
            console.error(stdout);
            console.error('stderr');
            console.error(stderr);
            console.error('error');
            console.error(error);
            console.error('Over');
            return reject(errorMsg);
        }
        resolve(stdout + '');
    });
}
function execFileInternal(file, args, options, includeErrorAsResponse, token) {
    return new Promise((resolve, reject) => {
        let proc = child_process.execFile(file, args, options, (error, stdout, stderr) => {
            handleResponse(file, includeErrorAsResponse, error, stdout, stderr, token).then(resolve, reject);
        });
        if (token && token.onCancellationRequested) {
            token.onCancellationRequested(() => {
                if (proc) {
                    proc.kill();
                    proc = utils.nullValue();
                }
            });
        }
    });
}
function spawnFileInternal(file, args, options, includeErrorAsResponse, stdOut, token) {
    return new Promise((resolve, reject) => {
        let proc = child_process.spawn(file, args, options);
        let error = '';
        let exited = false;
        let stdOutData = '';
        if (token && token.onCancellationRequested) {
            token.onCancellationRequested(() => {
                if (!exited && proc) {
                    proc.kill();
                    proc = utils.nullValue();
                }
            });
        }
        proc.on('error', error => {
            return reject(error);
        });
        proc.stdout.setEncoding('utf8');
        proc.stderr.setEncoding('utf8');
        proc.stdout.on('data', function (data) {
            if (token && token.isCancellationRequested) {
                return;
            }
            if (stdOut) {
                stdOut(data);
            }
            stdOutData += data;
        });
        proc.stderr.on('data', function (data) {
            if (token && token.isCancellationRequested) {
                return;
            }
            if (includeErrorAsResponse) {
                if (stdOut) {
                    stdOut(data);
                }
                stdOutData += data;
            }
            else {
                error += data;
            }
        });
        proc.on('exit', function (code) {
            exited = true;
            if (token && token.isCancellationRequested) {
                return reject();
            }
            if (error.length > 0) {
                return reject(error);
            }
            resolve(stdOutData);
        });
    });
}
function execInternal(command, args, options, includeErrorAsResponse) {
    return new Promise((resolve, reject) => {
        child_process.exec([command].concat(args).join(' '), options, (error, stdout, stderr) => {
            handleResponse(command, includeErrorAsResponse, error, stdout, stderr).then(resolve, reject);
        });
    });
}
function getCustomEnvVars() {
    return jupyterService_1.default.getInstance().getJupyterEnv();
}
exports.getCustomEnvVars = getCustomEnvVars;
function getWindowsLineEndingCount(document, offset) {
    const eolPattern = new RegExp('\r\n', 'g');
    const readBlock = 1024;
    let count = 0;
    let offsetDiff = offset.valueOf();
    // In order to prevent the one-time loading of large files from taking up too much memory
    for (let pos = 0; pos < offset; pos += readBlock) {
        let startAt = document.positionAt(pos);
        let endAt;
        if (offsetDiff >= readBlock) {
            endAt = document.positionAt(pos + readBlock);
            offsetDiff = offsetDiff - readBlock;
        }
        else {
            endAt = document.positionAt(pos + offsetDiff);
        }
        let text = document.getText(new vscode_1.Range(startAt, endAt));
        let cr = text.match(eolPattern);
        count += cr ? cr.length : 0;
    }
    return count;
}
exports.getWindowsLineEndingCount = getWindowsLineEndingCount;

//# sourceMappingURL=procUtils.js.map
