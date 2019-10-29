"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const events_1 = require("events");
const utils_1 = require("../../utils");
const procUtils_1 = require("./common/procUtils");
const common_1 = require("../../common");
const languageProvider_1 = require("./common/languageProvider");
const resultParser_1 = require("./jupyter_client/resultParser");
const semver = require("semver");
const utils = require("../../utils");
const environment_1 = require("../environment");
const jupyterService_1 = require("../jupyterService");
class KernelManagerImpl extends events_1.EventEmitter {
    constructor(outputChannel, notebookManager, jupyterClient) {
        super();
        this.outputChannel = outputChannel;
        this.notebookManager = notebookManager;
        this.jupyterClient = jupyterClient;
        this.disposables = [];
        this._runningKernels = new Map();
        this._kernelSpecs = {};
    }
    dispose() {
        this.removeAllListeners();
        this._runningKernels.forEach(kernel => {
            kernel.dispose();
        });
        this._runningKernels.clear();
    }
    setRunningKernelFor(language, kernel) {
        language = language.toLowerCase();
        this._runningKernels.set(language, kernel);
        this.emit('kernelChanged', kernel, language);
        return kernel;
    }
    clearAllKernels() {
        this._runningKernels.clear();
    }
    destroyRunningKernelFor(language) {
        language = language.toLowerCase();
        if (!this._runningKernels.has(language)) {
            return Promise.resolve();
        }
        const kernel = this._runningKernels.get(language);
        this._runningKernels.delete(language);
        const def = common_1.createDeferred();
        if (kernel) {
            // ignore errors
            kernel.shutdown()
                .catch(() => { })
                .then(() => kernel.dispose())
                .catch(() => { })
                .then(() => def.resolve());
        }
        else {
            def.resolve();
        }
        return def.promise;
    }
    destroyKerne(kernel) {
        let def = common_1.createDeferred();
        let found = false;
        this._runningKernels.forEach((value, language) => {
            if (value.id === kernel.id) {
                found = true;
                this.destroyRunningKernelFor(language).then(def.resolve.bind(def));
            }
        });
        if (!found) {
            // ignore errors
            kernel.shutdown()
                .catch(() => { })
                .then(() => kernel.dispose())
                .catch(() => { })
                .then(() => def.resolve());
        }
        return def.promise;
    }
    restartKernel(kernel) {
        return kernel.restart().then(() => {
            return kernel;
        }).catch(reason => {
            let message = 'Failed to start the kernel.';
            if (reason && reason.message) {
                message = reason.message;
            }
            vscode.window.showErrorMessage(message);
            this.outputChannel.appendLine(utils_1.formatErrorForLogging(reason));
            return Promise.reject(reason);
        });
    }
    restartRunningKernelFor(language) {
        language = language.toLowerCase();
        const kernel = this._runningKernels.get(language);
        return this.restartKernel(kernel);
    }
    startKernelFor(language) {
        return this.getKernelSpecFor(language)
            .then(kernelSpec => {
            return this.startKernel(kernelSpec, language);
        });
    }
    startExistingKernel(language, connection, connectionFile) {
        throw new Error('Start Existing Kernel not implemented');
    }
    runCodeAsObservable(code, kernel) {
        return null;
    }
    executeStartupCode(language, kernel) {
        let startupCode = languageProvider_1.LanguageProviders.getStartupCode(language);
        if (typeof startupCode !== 'string' || startupCode.length === 0) {
            return Promise.resolve();
        }
        return this.runCode(startupCode, kernel, new resultParser_1.MessageParser(this.outputChannel));
        // let def = createDeferred<any>();
        // let messageParser = new MessageParser(this.outputChannel);
        // let future: Kernel.IFuture;
        // let observable = new Rx.Subject<ParsedIOMessage>();
        // try {
        //     future = kernel.requestExecute({ code: startupCode, stop_on_error: false });
        //     future.onDone = () => {
        //         def.resolve();
        //     };
        //     future.onIOPub = (msg) => {
        //         messageParser.processResponse(msg, observable);
        //     };
        // }
        // catch (_ex) {
        //     this.executeStartupCode
        // }
        // observable.subscribe(msg => {
        //     if (msg.type === 'text' && msg.data && msg.data['text/plain']) {
        //         if (msg.message) {
        //             this.outputChannel.appendLine(msg.message);
        //         }
        //         this.outputChannel.appendLine(msg.data['text/plain']);
        //     }
        // });
        // return def.promise;
    }
    getAllRunningKernels() {
        return this._runningKernels;
    }
    getRunningKernelFor(language) {
        language = language.toLowerCase();
        return this._runningKernels.has(language) ? this._runningKernels.get(language) : utils.nullValue();
    }
    getAllKernelSpecs() {
        if (Object.keys(this._kernelSpecs).length === 0) {
            return this.updateKernelSpecs().then(() => {
                return Object.keys(this._kernelSpecs).map(key => this._kernelSpecs[key]);
            });
        }
        else {
            const result = Object.keys(this._kernelSpecs).map(key => this._kernelSpecs[key]);
            return Promise.resolve(result);
        }
    }
    getAllKernelSpecsFor(language) {
        return this.getAllKernelSpecs().then(kernelSpecs => {
            return environment_1.checkPythonVersion().then(version => {
                let kernelName = '';
                switch (version) {
                    case environment_1.PythonVersion.Python2:
                        kernelName = 'pysparkkernel';
                        break;
                    case environment_1.PythonVersion.Python3:
                        kernelName = 'pyspark3kernel';
                        break;
                }
                if (jupyterService_1.default.getInstance().pyspark3kernelDisabled) {
                    kernelName = 'pysparkkernel';
                }
                return kernelSpecs.filter(spec => spec.name.toLowerCase() === kernelName);
            });
        });
    }
    getKernelSpecFor(language) {
        return this.getAllKernelSpecsFor(language).then(kernelSpecs => {
            if (kernelSpecs.length === 0) {
                throw new Error('Unable to find a kernel for ' + language);
            }
            if (kernelSpecs.length === 1) {
                return kernelSpecs[0];
            }
            let defaultKernel = languageProvider_1.LanguageProviders.getDefaultKernel(language);
            if (!defaultKernel) {
                return kernelSpecs[0];
            }
            let foundSpec = kernelSpecs.find(spec => {
                if (spec.language.toLowerCase() !== language.toLowerCase()) {
                    return false;
                }
                return (spec.display_name === defaultKernel || spec.name === defaultKernel);
            });
            return foundSpec ? foundSpec : kernelSpecs[0];
        });
    }
    updateKernelSpecs() {
        this._kernelSpecs = {};
        return this.getKernelSpecsFromJupyter().then(kernelSpecsFromJupyter => {
            this._kernelSpecs = kernelSpecsFromJupyter.kernelspecs;
            if (Object.keys(this._kernelSpecs).length === 0) {
                throw new Error('No kernel specs found, Install or update Jupyter to a later version');
            }
            return kernelSpecsFromJupyter;
        });
    }
    jupyterVersionRequiresAuthToken() {
        return procUtils_1.execPythonFileSync(jupyterService_1.default.getInstance().getJupyterPath(), ['--version'], jupyterService_1.default.getInstance().getBinDir())
            .then(version => {
            version = version.trim();
            if (semver.valid(version) !== version) {
                throw 'Unable to determine version of Jupyter';
            }
            return semver.gte(version, '4.3.0');
        });
    }
    static jupyterVersionWorksWithJSServices(outputChannel) {
        return procUtils_1.execPythonFileSync(jupyterService_1.default.getInstance().getJupyterPath(), ['notebook', '--version'], jupyterService_1.default.getInstance().getBinDir())
            .then(version => {
            version = version.trim();
            if (semver.valid(version) !== version) {
                outputChannel.appendLine('Unable to determine version of Jupyter, ' + version);
                return true;
            }
            return semver.gte(version, '4.2.0');
        })
            .catch(error => {
            outputChannel.appendLine('Unable to determine version of Jupyter, ' + error);
            console.error(error);
            return true;
        });
    }
}
exports.KernelManagerImpl = KernelManagerImpl;

//# sourceMappingURL=kernel-manager.js.map
