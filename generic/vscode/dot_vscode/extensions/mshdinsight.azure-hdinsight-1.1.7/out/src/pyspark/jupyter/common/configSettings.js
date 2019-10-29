'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const systemVariables_1 = require("./systemVariables");
const events_1 = require("events");
const path = require("path");
const child_process = require("child_process");
exports.IS_WINDOWS = /^win/.test(process.platform);
const IS_TEST_EXECUTION = process.env['PYTHON_DONJAYAMANNE_TEST'] === '1';
class PythonSettings extends events_1.EventEmitter {
    constructor() {
        super();
        this.disposables = [];
        if (PythonSettings.pythonSettings) {
            throw new Error('Singleton class, Use getInstance method');
        }
        this.disposables.push(vscode.workspace.onDidChangeConfiguration(() => {
            this.initializeSettings();
        }));
        this.initializeSettings();
    }
    static getInstance() {
        return PythonSettings.pythonSettings;
    }
    initializeSettings() {
        const systemVariables = new systemVariables_1.SystemVariables();
        const workspaceRoot = (IS_TEST_EXECUTION || typeof vscode.workspace.rootPath !== 'string') ? __dirname : vscode.workspace.rootPath;
        let pythonSettings = vscode.workspace.getConfiguration('python');
        this.pythonPath = systemVariables.resolveAny(pythonSettings.get('pythonPath'));
        if (this.pythonPath) {
            this.pythonPath = getAbsolutePath(this.pythonPath, IS_TEST_EXECUTION ? __dirname : workspaceRoot);
            this.envFile = systemVariables.resolveAny(pythonSettings.get('envFile'));
            this.emit('change');
        }
    }
    get pythonPath() {
        return this._pythonPath;
    }
    set pythonPath(value) {
        if (this._pythonPath === value) {
            return;
        }
        // Add support for specifying just the directory where the python executable will be located
        // E.g. virtual directory name
        try {
            this._pythonPath = getPythonExecutable(value);
        }
        catch (ex) {
            this._pythonPath = value;
        }
    }
}
PythonSettings.pythonSettings = new PythonSettings();
exports.PythonSettings = PythonSettings;
function getAbsolutePath(pathToCheck, rootDir) {
    if (IS_TEST_EXECUTION && !pathToCheck) {
        return rootDir;
    }
    if (pathToCheck.indexOf(path.sep) === -1) {
        return pathToCheck;
    }
    return path.isAbsolute(pathToCheck) ? pathToCheck : path.resolve(rootDir, pathToCheck);
}
function getPythonExecutable(pythonPath) {
    // If only 'python'
    if (pythonPath === 'python' ||
        pythonPath.indexOf(path.sep) === -1 ||
        path.basename(pythonPath) === path.dirname(pythonPath)) {
        return pythonPath;
    }
    if (isValidPythonPath(pythonPath)) {
        return pythonPath;
    }
    // Keep python right on top, for backwards compatibility
    const KnownPythonExecutables = ['python', 'python4', 'python3.6', 'python3.5', 'python3', 'python2.7', 'python2'];
    for (let executableName of KnownPythonExecutables) {
        // Suffix with 'python' for linux and 'osx', and 'python.exe' for 'windows'
        if (exports.IS_WINDOWS) {
            executableName = executableName + '.exe';
            if (isValidPythonPath(path.join(pythonPath, executableName))) {
                return path.join(pythonPath, executableName);
            }
            if (isValidPythonPath(path.join(pythonPath, 'scripts', executableName))) {
                return path.join(pythonPath, 'scripts', executableName);
            }
        }
        else {
            if (isValidPythonPath(path.join(pythonPath, executableName))) {
                return path.join(pythonPath, executableName);
            }
            if (isValidPythonPath(path.join(pythonPath, 'bin', executableName))) {
                return path.join(pythonPath, 'bin', executableName);
            }
        }
    }
    return pythonPath;
}
function isValidPythonPath(pythonPath) {
    try {
        let output = child_process.execFileSync(pythonPath, ['-c', 'print(1234)'], { encoding: 'utf8' });
        return output.startsWith('1234');
    }
    catch (ex) {
        return false;
    }
}

//# sourceMappingURL=configSettings.js.map
