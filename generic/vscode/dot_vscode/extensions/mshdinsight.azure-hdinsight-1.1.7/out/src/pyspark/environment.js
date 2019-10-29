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
const cp = require("child_process");
const utils = require("../utils");
const os_1 = require("os");
const path = require("path");
const vscode = require("vscode");
const opener = require("opener");
const platform_1 = require("../cross/platform");
var PythonVersion;
(function (PythonVersion) {
    PythonVersion[PythonVersion["Unkown"] = 0] = "Unkown";
    PythonVersion[PythonVersion["Python2"] = 1] = "Python2";
    PythonVersion[PythonVersion["Python3"] = 2] = "Python3";
})(PythonVersion = exports.PythonVersion || (exports.PythonVersion = {}));
const documentLink = 'https://go.microsoft.com/fwlink/?linkid=859021';
const environmentSetupDocLink = 'https://go.microsoft.com/fwlink/?linkid=861972';
const pythonExtensionId = 'ms-python.python';
let _pythonVersion;
let _isPipInstalled = false;
let _jupyterVersion;
let _sparkMagicInfo;
// call it after checkPythonVersion()
function getPythonVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        return _pythonVersion;
    });
}
exports.getPythonVersion = getPythonVersion;
function validatePysparkEnvironmentAsync() {
    return __awaiter(this, void 0, void 0, function* () {
        // try to check Python version
        try {
            yield checkPythonVersion();
        }
        catch (error) {
            let downLoadMessage = 'Download Python';
            let moreDetails = 'More Details';
            let pythonDownLoadWebSite = 'https://www.python.org/downloads/';
            let message = yield vscode.window.showErrorMessage('Please make sure Python and Pip are in the system PATH, and then restart VSCode!', downLoadMessage, moreDetails);
            if (message === downLoadMessage) {
                opener(pythonDownLoadWebSite);
            }
            else if (message === moreDetails) {
                opener(documentLink);
            }
            return false;
        }
        // try to check `pip` version
        try {
            yield checkPipVersion(_pythonVersion);
        }
        catch (ex) {
            utils.error(utils.exceptionToString(ex));
            vscode.window.showErrorMessage('Pip not found! Please make sure `pip` in the system PATH, and then restart VSCode');
            return false;
        }
        if (_pythonVersion) {
            try {
                // check or install moudle jupyter
                yield checkOrInstallJupyter(_pythonVersion);
                // check or install moudle SparkMagic
                yield checkOrInstallSparkmagic();
                yield changePandasVersion(_pythonVersion);
                // check or install Spark Kernal
                yield checkOrInstallSparkKernal();
                // check or install moudle Matplotlib
                yield checkOrInstallPlotLib();
                return true;
            }
            catch (error) {
                // Customers should follow the document guidance if we get this exception
                utils.error(`Installing PySpark releated packages error: ${utils.exceptionToString(error)}`);
                let moreDetails = 'More Details';
                let message = yield vscode.window.showErrorMessage('Installing PySpark releated packages error! Please install required packages manually and then restart VSCode!', moreDetails);
                if (message === moreDetails) {
                    opener(environmentSetupDocLink);
                }
                return false;
            }
        }
        return false;
    });
}
exports.validatePysparkEnvironmentAsync = validatePysparkEnvironmentAsync;
function checkPythonVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!_pythonVersion) {
            const childProcess = cp.spawn('python', ['--version']);
            yield runChildProcess(childProcess, false, (info) => {
                if (info.stdout) {
                    let pythonCmdOut = info.stdout.toString().toLocaleLowerCase();
                    if (pythonCmdOut.startsWith('python 2')) {
                        _pythonVersion = PythonVersion.Python2;
                    }
                    else if (pythonCmdOut.startsWith('python 3')) {
                        _pythonVersion = PythonVersion.Python3;
                    }
                    else {
                        _pythonVersion = PythonVersion.Unkown;
                    }
                }
                else if (info.stderr) {
                    let pythonCmdErr = info.stderr.toString().toLocaleLowerCase();
                    if (pythonCmdErr.startsWith('python 2')) {
                        _pythonVersion = PythonVersion.Python2;
                    }
                    else if (pythonCmdErr.startsWith('python 3')) {
                        _pythonVersion = PythonVersion.Python3;
                    }
                    else {
                        _pythonVersion = PythonVersion.Unkown;
                    }
                }
                return _pythonVersion !== null;
            });
            return _pythonVersion;
        }
        return _pythonVersion;
    });
}
exports.checkPythonVersion = checkPythonVersion;
function checkPipVersion(pythonVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        let command = '';
        if (pythonVersion === PythonVersion.Python2) {
            command = 'pip';
        }
        else if (pythonVersion === PythonVersion.Python3) {
            command = 'pip3';
        }
        const childProcess = cp.spawn(command, ['--version']);
        yield runChildProcess(childProcess, true);
        _isPipInstalled = true;
    });
}
function checkOrInstallJupyter(version) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield checkJupyterVersion();
            return _jupyterVersion;
        }
        catch (ex) {
            // try to install local jupyter
            yield installLocalJupyter(_pythonVersion);
            // try to get the jupyter version again since we already install jupyter
            yield checkJupyterVersion(false);
            if (_jupyterVersion) {
                return _jupyterVersion;
            }
            else {
                throw new Error('install jupyter failed!');
            }
        }
    });
}
function checkJupyterVersion(isFirstCheck = true) {
    return __awaiter(this, void 0, void 0, function* () {
        let childProcess = cp.spawn('jupyter', ['--version']);
        yield runChildProcess(childProcess, !isFirstCheck, (info) => {
            if (info.stdout) {
                _jupyterVersion = info.stdout;
            }
            else if (info.stderr) {
                _jupyterVersion = info.stderr;
            }
            return true;
        }, 'jupyter cannot find!');
    });
}
function installLocalJupyter(version) {
    return __awaiter(this, void 0, void 0, function* () {
        let command = '';
        if (version === PythonVersion.Python2) {
            command = 'pip';
        }
        else if (version === PythonVersion.Python3) {
            command = 'pip3';
        }
        const childProcess = cp.spawn(command, ['install', 'jupyter']);
        yield runChildProcess(childProcess, true, undefined, 'Installing Jupyter failed!');
        utils.log('Installing Jupyter successful!');
    });
}
function checkOrInstallSparkKernal() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield kernalCheck();
        }
        catch (ex) {
            yield installJupyterKernel();
            yield kernalCheck(false);
        }
    });
}
function kernalCheck(isFirstCheck = true) {
    return __awaiter(this, void 0, void 0, function* () {
        const kernalName = _pythonVersion === PythonVersion.Python2 ? 'pysparkkernel' : 'pyspark3kernel';
        let kernalList = '';
        yield runChildProcess(cp.spawn('jupyter-kernelspec', ['list']), !isFirstCheck, info => {
            if (info.stdout) {
                kernalList = info.stdout;
            }
            else if (info.stderr) {
                kernalList = info.stderr;
            }
            return true;
        });
        const selectedKernal = kernalList.split(os_1.EOL).find(elem => elem.trim().toLowerCase().startsWith(kernalName));
        if (selectedKernal) {
            return Promise.resolve();
        }
        return Promise.reject(`Spark Kernal ${kernalName} not found!`);
    });
}
function installJupyterKernel() {
    return __awaiter(this, void 0, void 0, function* () {
        yield enableNbextension();
        const command = _pythonVersion === PythonVersion.Python2 ? 'pip' : 'pip3';
        const args1 = ['show', 'sparkmagic'];
        const childProcess = cp.spawn(command, args1);
        // get kernal location information
        const location = yield new Promise((resolve, reject) => {
            runChildProcess(childProcess, true, (info) => {
                // we didn't have good way to know whether the information is in stdout or stderr
                // so we get the result by the output content
                let result = '';
                if (info.stdout && info.stdout.trim().startsWith('Name')) {
                    result = info.stdout.trim();
                }
                else if (info.stderr && info.stderr.trim().startsWith('Name')) {
                    result = info.stderr.trim();
                }
                const location = result.split(os_1.EOL).find(elem => elem.toLocaleLowerCase().startsWith('location'));
                if (location) {
                    resolve(location);
                }
                else {
                    reject('Installing Jupyter kernel failed! Cannot get the pysparkkernel location!');
                }
            });
        });
        const workPath = location.split('Location:')[1].trim();
        const commandKernelspec = 'jupyter-kernelspec';
        const sparkmagicKernelName = _pythonVersion === PythonVersion.Python2 ? 'sparkmagic/kernels/pysparkkernel' : 'sparkmagic/kernels/pyspark3kernel';
        const args2 = ['install', path.join(workPath, sparkmagicKernelName)];
        yield runChildProcess(cp.spawn(commandKernelspec, args2), true);
    });
}
function enableNbextension() {
    const command = 'jupyter';
    const args = ['nbextension', 'enable', '--py', '--sys-prefix', 'widgetsnbextension'];
    const childProcess = cp.spawn(command, args);
    const indexedInfo = 'validating: ok';
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        yield runChildProcess(childProcess, true, (info) => {
            if (info.stdout && info.stdout.toLowerCase().indexOf(indexedInfo) >= 0) {
                resolve(true);
            }
            else if (info.stderr && info.stderr.toLowerCase().indexOf(indexedInfo) >= 0) {
                resolve(true);
            }
            else {
                reject();
            }
        });
    }));
}
function checkOrInstallSparkmagic() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // check or install SparkMagic
            yield checkSparkMagic(_pythonVersion);
        }
        catch (ex) {
            // try to install SparkMagic if the SparkMagic library not exist
            yield installSparkMagic(_pythonVersion);
            // check sparkmagic again since we already installed the package
            yield checkSparkMagic(_pythonVersion, false);
        }
    });
}
function checkSparkMagic(pyVersion, isFirstCheck = true) {
    return __awaiter(this, void 0, void 0, function* () {
        let command = null;
        if (pyVersion === PythonVersion.Python2) {
            command = 'pip';
        }
        else if (pyVersion === PythonVersion.Python3) {
            command = 'pip3';
        }
        let args = ['show', 'sparkmagic'];
        let process = cp.spawn(command, args);
        yield runChildProcess(process, !isFirstCheck, (info) => {
            if (info.stderr) {
                _sparkMagicInfo = info.stderr;
            }
            else if (info.stdout) {
                _sparkMagicInfo = info.stdout;
            }
            return true;
        });
        if (_sparkMagicInfo) {
            return Promise.resolve();
        }
        else {
            return Promise.reject(`show SparkMagic error: ${_sparkMagicInfo}`);
        }
    });
}
function installSparkMagic(pyVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        let command = 'pip';
        if (pyVersion === PythonVersion.Python3) {
            command = 'pip3';
        }
        const args = ['install', 'sparkmagic'];
        const childProcess = cp.spawn(command, args);
        yield runChildProcess(childProcess, true, undefined, 'Installing Sparkmagic failed!');
        utils.log('Installing Sparkmagic successful!');
    });
}
function changePandasVersion(pyVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        let command = 'pip';
        if (pyVersion === PythonVersion.Python3) {
            command = 'pip3';
        }
        const childProcess_pandas = cp.spawn(command, ['show', 'pandas']);
        let needVersionChange = false;
        yield runChildProcess(childProcess_pandas, false, (info) => {
            if (info.stdout) {
                let pandasCmdOut = info.stdout.toString().toLocaleLowerCase();
                if (pandasCmdOut.indexOf('0.23.') >= 0) {
                    needVersionChange = true;
                }
            }
        });
        if (needVersionChange) {
            // since pandas 0.23.x doesn't work on sparkmagic
            const args = ['install', 'pandas==0.22.0'];
            const childProcess = cp.spawn(command, args);
            yield runChildProcess(childProcess, true, undefined, 'Installing Pandas failed!');
            utils.log('Changing Pandas version successful!');
        }
    });
}
function installPythonExtension() {
    return __awaiter(this, void 0, void 0, function* () {
        const argv1 = process.argv[1];
        const execargv1 = argv1.replace('bootstrap', 'cli.js');
        if (platform_1.Platform.OSX !== platform_1.getCurrentPlatform()) {
            var execPath = process.execPath;
        }
        else {
            var execPath = process.execPath.replace('/Frameworks/Code Helper.app/Contents/MacOS/Code Helper', '/MacOS/Electron');
        }
        const installChildProcess = cp.spawn(execPath, [execargv1, '--install-extension', pythonExtensionId]);
        yield new Promise((resolve, reject) => {
            runChildProcess(installChildProcess, true, (info) => {
                let message = info.stdout;
                if (message && (message.indexOf('was successfully installed!') >= 0 || message.indexOf('is already installed.') >= 0)) {
                    utils.log('ext installed successfully');
                    resolve();
                }
                else {
                    reject();
                }
            });
        });
        const reload = 'Reload';
        let result = yield vscode.window.showInformationMessage('Please reload Visual Studio Code to activate Python extension', reload);
        if (result === reload) {
            yield vscode.commands.executeCommand('workbench.action.reloadWindow');
            return true;
        }
        else {
            vscode.window.showErrorMessage('Restart VSCode is required!');
            throw new Error('Restart VSCode is required!');
        }
    });
}
function checkOrInstallPlotLib() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield checkPlotLib();
        }
        catch (ex) {
            yield installPlotLib();
            yield checkPlotLib(false);
        }
    });
}
function checkPlotLib(isFirstCheck = true) {
    return __awaiter(this, void 0, void 0, function* () {
        let command = null;
        if (_pythonVersion === PythonVersion.Python2) {
            command = 'pip';
        }
        else if (_pythonVersion === PythonVersion.Python3) {
            command = 'pip3';
        }
        let args = ['show', 'matplotlib'];
        let process = cp.spawn(command, args);
        yield runChildProcess(process, !isFirstCheck);
        return true;
    });
}
function installPlotLib() {
    return __awaiter(this, void 0, void 0, function* () {
        let command = 'pip';
        if (_pythonVersion === PythonVersion.Python3) {
            command = 'pip3';
        }
        const args = ['install', 'matplotlib'];
        const childProcess = cp.spawn(command, args);
        yield runChildProcess(childProcess, true, undefined, 'Installing matplotlib failed!');
        utils.log('Installing matplotlib successful!');
    });
}
function promoteExtInstall() {
    return __awaiter(this, void 0, void 0, function* () {
        if (vscode.extensions.getExtension(pythonExtensionId)) {
            return true;
        }
        let install = 'Install';
        let message = yield vscode.window.showInformationMessage('PySpark interactive feature requires Python extension, would you like to install it now?', install);
        if (message === install) {
            yield installPythonExtension();
            return true;
        }
        else {
            vscode.window.showErrorMessage('Python extension is required here!');
        }
        return false;
    });
}
exports.promoteExtInstall = promoteExtInstall;
function runChildProcess(childProcess, isLogged = true, func = undefined, rejectInfo) {
    const logs = {
        stdout: '',
        stderr: ''
    };
    const needPostProcessing = func ? true : false;
    // 'error' event must be listened, otherwise system exception will break all the proceess
    childProcess.on('error', (data) => {
        const info = data.toString();
        if (isLogged) {
            utils.log(info);
        }
        logs.stderr += info;
    });
    childProcess.stdout.on('data', (data) => {
        const info = data.toString();
        if (isLogged) {
            utils.log(info);
        }
        if (needPostProcessing) {
            logs.stdout += info;
        }
    });
    childProcess.stderr.on('data', (data) => {
        const info = data.toString();
        if (isLogged) {
            utils.log(data.toString());
        }
        if (needPostProcessing) {
            logs.stderr += info;
        }
    });
    return new Promise((resolve, reject) => {
        childProcess.once('close', (data) => {
            const flag = data.toString();
            if (flag === '0') {
                if (func) {
                    func(logs);
                }
                resolve();
            }
            else {
                reject(rejectInfo);
            }
        });
    });
}

//# sourceMappingURL=environment.js.map
