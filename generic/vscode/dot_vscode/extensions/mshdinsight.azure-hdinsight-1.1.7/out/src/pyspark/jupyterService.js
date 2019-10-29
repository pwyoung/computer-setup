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
const child_process = require("child_process");
const path = require("path");
const fs = require("fs");
const os_1 = require("os");
const Constants = require("../constants/constants");
const opener = require("opener");
const utils = require("../utils");
class JupyterService {
    constructor(basePath) {
        this._kernelFiles = [];
        this._pyspark3kernelDisabled = false;
        this._basePath = basePath;
        this._dataDir = path.join(basePath, 'jupyter_paths', 'data');
        this._configDir = path.join(basePath, 'jupyter_paths', 'config');
        this._runtimeDir = path.join(basePath, 'jupyter_paths', 'runtime');
    }
    static getInstance(basePath) {
        if (!JupyterService._instance) {
            if (!basePath) {
                throw new Error('need specify the base path!');
            }
            JupyterService._instance = new JupyterService(basePath);
        }
        return JupyterService._instance;
    }
    preCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            let isValid = yield this._checkCommand('python');
            if (!isValid) {
                const errMsg = 'Python is not installed. To use Pyspark Interactive command, please install Python, add it to your system PATH, and restart the VSCode.';
                let download = 'Download';
                let message = yield vscode.window.showErrorMessage(errMsg, download);
                if (message === download) {
                    opener(Constants.pythonOfficialWebsite);
                }
                return false;
            }
            isValid = yield this._checkCommand('pip');
            if (!isValid) {
                // double-check the python package in case of not-configured environment variable
                isValid = yield this._checkPythonPackage('pip');
            }
            if (!isValid) {
                const errMsg = 'PIP is not installed. To use Pyspark Interactive command, please install PIP, add it to your system PATH, and restart the VSCode.';
                let download = 'Download';
                let message = yield vscode.window.showErrorMessage(errMsg, download);
                if (message === download) {
                    opener(Constants.pipOfficialWebsite);
                }
                return false;
            }
            isValid = yield this._checkCommand('virtualenv');
            if (!isValid) {
                isValid = yield this._checkPythonPackage('virtualenv');
            }
            if (!isValid) {
                const errMsg = 'To use Pyspark Interactive command, please install virtualenv using command: pip install virtualenv';
                yield vscode.window.showErrorMessage(errMsg);
                return false;
            }
            return true;
        });
    }
    _checkCommand(cmd) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._exec(cmd, ['--version']);
                return true;
            }
            catch (ex) {
                utils.error(ex);
                return false;
            }
        });
    }
    _checkPythonPackage(packgaeName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._exec('python', ['-m', packgaeName, '--version']);
                return true;
            }
            catch (ex) {
                utils.error(ex);
                return false;
            }
        });
    }
    validate() {
        return __awaiter(this, void 0, void 0, function* () {
            utils.log('Check Jupyter installation:');
            try {
                utils.setProgressMessage('validating', true);
                // check jupyter
                yield this._exec(this.getJupyterPath(), ['--version']);
                utils.log('Jupyter already installed');
                // check sparkmagic
                yield this._exec(this._getPipPath(), ['show', 'sparkmagic'], this.getBinDir());
                utils.log('Sparkmagic already installed');
                // check kernel
                yield this._kernelCheck();
                utils.log('Sparkkernel already installed');
                // check matplotlib
                yield this._exec(this._getPipPath(), ['show', 'matplotlib'], this.getBinDir());
                utils.log('matplotlib already installed');
                utils.stopProgressMessage();
                return true;
            }
            catch (ex) {
                utils.log('Jupyter not installed');
                return false;
            }
        });
    }
    install() {
        return __awaiter(this, void 0, void 0, function* () {
            utils.log('Installing PySpark interactive virtual environment ...');
            try {
                utils.setProgressMessage('installing dependencies', true);
                yield this._generateVirtualEnv();
                this._checkOrCreateDirSync(path.join(this._basePath, 'jupyter_paths'));
                this._checkOrCreateDirSync(this._dataDir);
                this._checkOrCreateDirSync(this._configDir);
                this._checkOrCreateDirSync(this._runtimeDir);
                yield this._exec(this._getPipPath(), [
                    'install',
                    'jupyter'
                ]);
                // From sparkmagic 0.12.9, it has been divided to sparkmagic with pysparkkernel for python2 
                // and sparkmagic3 with pysparkkernel3 for python3. We need to use both of pyspark and pyspark3 
                // kernel in order to be compatible with different versions of hdinsight cluster.
                yield this._exec(this._getPipPath(), [
                    'install',
                    'sparkmagic==0.12.8'
                ]);
                const libDir = yield this._getLibDir();
                const pykernelsDir = path.join(libDir, 'sparkmagic', 'kernels', 'pysparkkernel');
                const py3kernelsDir = path.join(libDir, 'sparkmagic', 'kernels', 'pyspark3kernel');
                const jupyterPath = this.getJupyterPath();
                yield this._exec(jupyterPath, ['nbextension', 'enable', '--py', '--sys-prefix', 'widgetsnbextension'], this.getBinDir());
                yield this._exec(jupyterPath, ['kernelspec', 'install', `--prefix=${this._basePath}`, pykernelsDir], this.getBinDir());
                yield this._exec(jupyterPath, ['kernelspec', 'install', `--prefix=${this._basePath}`, py3kernelsDir], this.getBinDir());
                yield this._exec(this._getPipPath(), [
                    'install',
                    'matplotlib'
                ]);
                utils.stopProgressMessage();
                return true;
            }
            catch (ex) {
                utils.log('Install Jupyter error:');
                utils.error(ex);
                let moreDetails = 'More Details';
                const errMsg = process.platform === 'linux' ?
                    'PySpark installation error. Please install required packages using command: sudo apt-get install libkrb5-dev' :
                    'PySpark installation error. Please see moreDetails';
                let message = yield vscode.window.showErrorMessage(errMsg, moreDetails);
                if (message === moreDetails) {
                    opener(Constants.jupyterEnvironmentSetupDocLink);
                }
                return false;
            }
        });
    }
    _generateVirtualEnv() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._exec('python', ['-m', 'virtualenv', this._basePath]);
            }
            catch (err) {
                utils.error(err);
                // For some linux users, we cannot call virtualenv by 'python -m virtualenv', try call 'virtualenv' directly
                yield this._exec('virtualenv', [this._basePath]);
            }
        });
    }
    _kernelCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this._exec(this.getJupyterPath(), ['kernelspec', 'list', '--json'], this.getBinDir());
            const kernalList = result.stdout.trim() + os_1.EOL + result.stderr.trim();
            const kernelspecs = JSON.parse(kernalList)['kernelspecs'];
            const pysparkkernel = kernelspecs['pysparkkernel'];
            const pyspark3kernel = kernelspecs['pyspark3kernel'];
            // make sure the sparkkernel has been installed in right position
            if (pysparkkernel && pyspark3kernel) {
                if (!utils.arePathSame(pysparkkernel['resource_dir'], path.join(this._getJupyterKernelDir(), 'pysparkkernel'))) {
                    throw new Error('pysparkkernel resource dir wrong');
                }
                if (!utils.arePathSame(pyspark3kernel['resource_dir'], path.join(this._getJupyterKernelDir(), 'pyspark3kernel'))) {
                    throw new Error('pyspark3kernel resource dir wrong');
                }
                return;
            }
            else {
                throw new Error('cannot found spark kernel');
            }
        });
    }
    get pyspark3kernelDisabled() {
        return this._pyspark3kernelDisabled;
    }
    set pyspark3kernelDisabled(isDisable) {
        this._pyspark3kernelDisabled = isDisable;
    }
    /**
     * It's a hack way to change the priority of the cooresponding kernel to Python Extension by modifying the kernel.json
     * More information in function 'JupyterExecutionBase.findSpecMatch()' in 'vscode-python\src\client\datascience\jupyter\jupyterExecution.ts'
     */
    increasePriorityOfPysparkkernel() {
        const pysparkkernelPath = this._getJupyterkernelPath('pysparkkernel');
        const pyspark3kernelPath = this._getJupyterkernelPath('pyspark3kernel');
        this._regenerateKernelConfig(pysparkkernelPath, true);
        this._regenerateKernelConfig(pyspark3kernelPath, false);
        // TODO: python kernel path differs between python and python3, need decrease python kernel later
    }
    increasePriorityOfPyspark3kernel() {
        if (this.pyspark3kernelDisabled) {
            throw new Error('pyspark3kernel has been diabled, cannot change the priority!');
        }
        const pysparkkernelPath = this._getJupyterkernelPath('pysparkkernel');
        const pyspark3kernelPath = this._getJupyterkernelPath('pyspark3kernel');
        this._regenerateKernelConfig(pysparkkernelPath, false);
        this._regenerateKernelConfig(pyspark3kernelPath, true);
        // TODO: python kernel path differs between python and python3, need decrease python kernel later
    }
    _regenerateKernelConfig(configPath, isPriority) {
        if (fs.existsSync(configPath)) {
            const config = fs.readFileSync(configPath).toString();
            try {
                let configObj = JSON.parse(config);
                if (configObj && configObj['argv']) {
                    configObj['argv'][0] = this.getPythonPath();
                    if (isPriority) {
                        configObj['language'] = 'python';
                    }
                    else {
                        delete configObj['language'];
                    }
                    fs.writeFileSync(configPath, JSON.stringify(configObj));
                }
                else {
                    throw new Error(`Initialize jupyter kernel file ${configPath} failed!`);
                }
            }
            catch (err) {
                utils.error(err);
                throw new Error(`Initialize jupyter kernel file ${configPath} failed!`);
            }
        }
        else {
            throw new Error(`Jupyter kernel file ${configPath} not found!`);
        }
    }
    get pythonExtensionEnable() {
        const jupyterConfig = vscode.workspace.getConfiguration('hdinsightJupyter');
        const pythonExtensionEnable = jupyterConfig.get('pythonExtensionEnabled', true);
        return pythonExtensionEnable;
    }
    getPythonPath() {
        return path.join(this.getBinDir(), process.platform === 'win32' ? 'python.exe' : 'python');
    }
    getJupyterEnv() {
        return {
            'JUPYTER_CONFIG_DIR': this._configDir,
            'JUPYTER_RUNTIME_DIR': this._runtimeDir,
            'JUPYTER_DATA_DIR': this._dataDir
        };
    }
    _checkOrCreateDirSync(dirPath) {
        try {
            fs.mkdirSync(dirPath);
        }
        catch (ex) {
            if (ex.code !== 'EEXIST') {
                utils.error('Create dir error:');
                utils.error(ex);
                throw ex;
            }
        }
    }
    _setJupyterPaths(env) {
        if (!!this._configDir && !!this._runtimeDir && !!this._dataDir) {
            env.JUPYTER_CONFIG_DIR = this._configDir;
            env.JUPYTER_RUNTIME_DIR = this._runtimeDir;
            env.JUPYTER_DATA_DIR = this._dataDir;
        }
    }
    _getLibDir() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this._exec(this._getPipPath(), ['show', 'sparkmagic'], this.getBinDir());
            // the stdout/stderr may mixed on different Python version or OS
            let mixedResult = result.stdout.trim() + os_1.EOL + result.stderr.trim();
            const location = mixedResult.split(os_1.EOL).find(elem => elem.toLocaleLowerCase().startsWith('location'));
            if (location) {
                return location.split('Location:')[1].trim();
            }
            else {
                throw new Error('Cannot not found site-packages!');
            }
        });
    }
    getBinDir() {
        return path.join(this._basePath, process.platform === 'win32' ? 'Scripts' : 'bin');
    }
    _getPipPath() {
        return path.join(this.getBinDir(), process.platform === 'win32' ? 'pip.exe' : 'pip');
    }
    getJupyterPath() {
        return path.join(this.getBinDir(), process.platform === 'win32' ? 'jupyter.exe' : 'jupyter');
    }
    getJupterNotebookExcutablePath() {
        return path.join(this.getBinDir(), process.platform === 'win32' ? 'jupyter-notebook.exe' : 'jupyter-notebook');
    }
    _getJupyterKernelDir() {
        return path.join(this._basePath, 'share', 'jupyter', 'kernels');
    }
    _getJupyterkernelPath(kernelName) {
        return path.join(this._getJupyterKernelDir(), kernelName, 'kernel.json');
    }
    _exec(path, args, cwd = '') {
        utils.log(`Exec ${path}, with args: ${args}`);
        return new Promise((resolve, reject) => {
            let env = Object.assign({}, process.env);
            delete env.PYTHONHOME;
            this._setJupyterPaths(env);
            const proc = child_process.spawn(path, args, {
                cwd: cwd,
                env: env
            });
            let stdout = '';
            let stderr = '';
            proc.on('error', err => {
                reject(err);
            });
            proc.stdout.setEncoding('utf8');
            proc.stderr.setEncoding('utf8');
            proc.stdout.on('data', (data) => {
                utils.log(data);
                stdout += data;
            });
            proc.stderr.on('data', (data) => {
                utils.log(data);
                stderr += data;
            });
            proc.on('exit', (code) => {
                if (code !== 0) {
                    reject(`Exit with non zero ${code}`);
                }
                else {
                    resolve({ stdout: stdout, stderr: stderr });
                }
            });
        });
    }
    set notebook(notebook) {
        this._notebook = Object.assign({}, notebook);
        this._nbserverJsonFile = path.join(this.getJupyterEnv().JUPYTER_RUNTIME_DIR, 'nbserver-' + notebook.pid + '.json');
        this._nbserverHtmlFile = path.join(this.getJupyterEnv().JUPYTER_RUNTIME_DIR, 'nbserver-' + notebook.pid + '-open.html');
    }
    set latestKernel(kernelId) {
        const kernelFile = path.join(this.getJupyterEnv().JUPYTER_RUNTIME_DIR, 'kernel-' + kernelId + '.json');
        this._kernelFiles.push(kernelFile);
    }
    shutdown() {
        this._cleanProcessFiles();
        this._killJupyterService().then();
    }
    _cleanProcessFiles() {
        this._deleteExistentFile(this._nbserverJsonFile);
        this._deleteExistentFile(this._nbserverHtmlFile);
        this._deleteExistentFiles(this._kernelFiles);
    }
    _deleteExistentFiles(files) {
        for (const file of files) {
            this._deleteExistentFile(file);
        }
    }
    _deleteExistentFile(file) {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    }
    _killJupyterService() {
        return new Promise((resolve, reject) => {
            let command = '';
            switch (process.platform) {
                case 'win32':
                    command = 'taskkill /F /pid ' + this._notebook.pid;
                    break;
                case 'linux':
                case 'darwin':
                    command = 'kill -9 ' + this._notebook.pid;
                    break;
            }
            child_process.exec(command, (err, stdout, stderr) => {
                return resolve();
            });
        });
    }
}
exports.default = JupyterService;

//# sourceMappingURL=jupyterService.js.map
