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
const main_1 = require("./jupyter/display/main");
const kernelStatus_1 = require("./jupyter/display/kernelStatus");
const constants_1 = require("./jupyter/common/constants");
const codeLensProvider_1 = require("./jupyter/editorIntegration/codeLensProvider");
const symbolProvider_1 = require("./jupyter/editorIntegration/symbolProvider");
const utils_1 = require("../utils");
const codeHelper_1 = require("./jupyter/common/codeHelper");
const kernel_manager_1 = require("./jupyter/kernel-manager");
const resultParser_1 = require("./jupyter/jupyter_client/resultParser");
const languageProvider_1 = require("./jupyter/common/languageProvider");
const Rx = require("rx");
const manager_1 = require("./jupyter/notebook/manager");
const manager_2 = require("./jupyter/manager");
const PyManager = require("./pythonClient/manager");
const common_1 = require("../common");
const main_2 = require("./pythonClient/jupyter_client/main");
const utils = require("../utils");
const logger_1 = require("../logger");
const Constants = require("../constants/constants");
const configSettings_1 = require("./jupyter/common/configSettings");
// Todo: Refactor the error handling and displaying of messages
class Jupyter extends vscode.Disposable {
    constructor(pythonPath) {
        super(() => { });
        this.kernel = utils.nullValue();
        this.disposables = [];
        this.registerCommands();
        this.registerKernelCommands();
        this.outputChannel = logger_1.Logger.getLogger(Constants.outputChannelName).getChannel();
        this.messageParser = new resultParser_1.MessageParser(this.outputChannel);
        this.activate();
        configSettings_1.PythonSettings.getInstance().pythonPath = pythonPath;
    }
    dispose() {
        this.kernelManager.dispose();
        this.disposables.forEach(d => d.dispose());
    }
    getKernelManager() {
        return this.createKernelManager();
    }
    createKernelManager() {
        if (this.kernelCreationPromise) {
            return this.kernelCreationPromise.promise;
        }
        this.kernelCreationPromise = common_1.createDeferred();
        return kernel_manager_1.KernelManagerImpl.jupyterVersionWorksWithJSServices(this.outputChannel)
            .then(yes => {
            this.jupyterVersionWorksWithJSServices = yes;
            if (yes) {
                this.kernelManager = new manager_2.Manager(this.outputChannel, this.notebookManager);
            }
            else {
                const jupyterClient = new main_2.JupyterClientAdapter(this.outputChannel, vscode.workspace.rootPath);
                this.kernelManager = new PyManager.Manager(this.outputChannel, this.notebookManager, jupyterClient);
            }
            this.kernelCreationPromise.resolve(this.kernelManager);
            // This happend when user changes it from status bar
            this.kernelManager.on('kernelChanged', (kernel, language) => {
                this.onKernelChanged(kernel);
            });
            return Promise.resolve(this.kernelManager);
        })
            .catch(error => {
            this.kernelCreationPromise.reject(error);
            throw error;
        });
    }
    activate() {
        this.notebookManager = new manager_1.NotebookManager(this.outputChannel);
        this.disposables.push(this.notebookManager);
        this.createKernelManager();
        this.disposables.push(vscode.window.onDidChangeActiveTextEditor(this.onEditorChanged.bind(this)));
        this.codeLensProvider = new codeLensProvider_1.JupyterCodeLensProvider();
        let symbolProvider = new symbolProvider_1.JupyterSymbolProvider();
        this.status = new kernelStatus_1.KernelStatus();
        this.disposables.push(this.status);
        this.display = new main_1.JupyterDisplay(this.codeLensProvider, this.outputChannel);
        this.disposables.push(this.display);
        this.codeHelper = new codeHelper_1.CodeHelper(this.codeLensProvider);
        languageProvider_1.LanguageProviders.getInstance().on('onLanguageProviderRegistered', (language) => {
            this.disposables.push(vscode.languages.registerCodeLensProvider(language, this.codeLensProvider));
            this.disposables.push(vscode.languages.registerDocumentSymbolProvider(language, symbolProvider));
        });
        this.handleNotebookEvents();
    }
    handleNotebookEvents() {
        this.notebookManager.on('onNotebookChanged', (nb) => {
            this.display.setNotebook(nb, this.notebookManager.canShutdown(nb));
        });
        this.notebookManager.on('onShutdown', () => {
            this.getKernelManager().then(k => k.clearAllKernels());
            this.onKernelChanged(utils.nullValue());
        });
    }
    hasCodeCells(document, token) {
        return new Promise(resolve => {
            this.codeLensProvider.provideCodeLenses(document, token).then(codeLenses => {
                resolve(Array.isArray(codeLenses) && codeLenses.length > 0);
            }, reason => {
                console.error('Failed to detect code cells in document');
                console.error(reason);
                resolve(false);
            });
        });
    }
    onEditorChanged(editor) {
        if (!editor || !editor.document) {
            return;
        }
        this.getKernelManager()
            .then(kernelManager => {
            const kernel = kernelManager.getRunningKernelFor(editor.document.languageId);
            if (this.kernel !== kernel && (this.kernel && kernel && this.kernel.id !== kernel.id)) {
                return this.onKernelChanged(kernel);
            }
        });
    }
    onKernelChanged(kernel) {
        if (kernel) {
            kernel.statusChanged.connect((sender, status) => {
                // We're only interested in status of the active kernels
                if (this.kernel && (sender.id === this.kernel.id)) {
                    this.status.setKernelStatus(status);
                }
            });
        }
        this.kernel = kernel;
        this.status.setActiveKernel(this.kernel);
    }
    executeCode(code, language) {
        return this.getKernelManager()
            .then(kernelManager => {
            const kernelToUse = kernelManager.getRunningKernelFor(language);
            if (kernelToUse) {
                if (!this.kernel || kernelToUse.id !== this.kernel.id) {
                    this.onKernelChanged(kernelToUse);
                }
                return Promise.resolve(this.kernel);
            }
            else {
                return kernelManager.startKernelFor(language).then(kernel => {
                    kernelManager.setRunningKernelFor(language, kernel);
                    return kernel;
                });
            }
        })
            .then(() => {
            return this.executeAndDisplay(this.kernel, code).catch(reason => {
                const message = typeof reason === 'string' ? reason : reason.message;
                vscode.window.showErrorMessage(message);
                this.outputChannel.appendLine(utils_1.formatErrorForLogging(reason));
            });
        }).catch(reason => {
            let message = typeof reason === 'string' ? reason : reason.message;
            if (reason.xhr && reason.xhr.responseText) {
                message = reason.xhr && reason.xhr.responseText;
            }
            if (!message) {
                message = 'Unknown error';
            }
            this.outputChannel.appendLine(utils_1.formatErrorForLogging(reason));
            vscode.window.showErrorMessage(message, 'View Errors').then(item => {
                if (item === 'View Errors') {
                    this.outputChannel.show();
                }
            });
        });
    }
    executeAndDisplay(kernel, code) {
        let observable = this.executeCodeInKernel(kernel, code);
        return this.display.showResults(observable);
    }
    executeCodeInKernel(kernel, code) {
        if (this.jupyterVersionWorksWithJSServices) {
            let source = Rx.Observable.create(observer => {
                let future = kernel.requestExecute({ code: code });
                future.onDone = () => {
                    observer.onCompleted();
                };
                future.onIOPub = (msg) => {
                    this.messageParser.processResponse(msg, observer);
                };
            });
            return source;
        }
        else {
            return this.kernelManager.runCodeAsObservable(code, kernel);
        }
    }
    executeSelection() {
        return __awaiter(this, void 0, void 0, function* () {
            const activeEditor = utils.getCurrentActiveEditor();
            if (!activeEditor || !activeEditor.document) {
                return Promise.resolve();
            }
            let code = yield this.codeHelper.getSelectedCode();
            // TODO: code cell support
            // let cellRange = await this.codeHelper.getActiveCell();
            let selectedCode = yield languageProvider_1.LanguageProviders.getSelectedCode(activeEditor.document.languageId, code, undefined);
            if (!selectedCode) {
                vscode.window.showErrorMessage('No code selected!');
                return;
            }
            return this.executeCode(selectedCode, activeEditor.document.languageId);
        });
    }
    registerCommands() {
        this.disposables.push(vscode.commands.registerCommand(constants_1.Commands.Jupyter.ExecuteRangeInKernel, (document, range) => {
            if (!document || !range || range.isEmpty) {
                return Promise.resolve();
            }
            const code = document.getText(range);
            return this.executeCode(code, document.languageId);
        }));
        this.disposables.push(vscode.commands.registerCommand(constants_1.Commands.Jupyter.ExecuteSelectionOrLineInKernel, this.executeSelection.bind(this)));
        this.disposables.push(vscode.commands.registerCommand(constants_1.Commands.Jupyter.Get_All_KernelSpecs_For_Language, (language) => {
            if (this.kernelManager) {
                return this.kernelManager.getAllKernelSpecsFor(language);
            }
            return Promise.resolve();
        }));
        this.disposables.push(vscode.commands.registerCommand(constants_1.Commands.Jupyter.StartKernelForKernelSpeck, (kernelSpec, language) => {
            if (this.kernelManager) {
                return this.kernelManager.startKernel(kernelSpec, language);
            }
            return Promise.resolve();
        }));
        this.disposables.push(vscode.commands.registerCommand(constants_1.Commands.Jupyter.StartNotebook, () => {
            this.notebookManager.startNewNotebook();
        }));
        this.disposables.push(vscode.commands.registerCommand(constants_1.Commands.Jupyter.ProvideNotebookDetails, () => {
            manager_1.inputNotebookDetails()
                .then(nb => {
                if (!nb) {
                    return;
                }
                this.notebookManager.setNotebook(nb);
            });
        }));
        this.disposables.push(vscode.commands.registerCommand(constants_1.Commands.Jupyter.SelectExistingNotebook, () => {
            manager_1.selectExistingNotebook()
                .then(nb => {
                if (!nb) {
                    return;
                }
                this.notebookManager.setNotebook(nb);
            });
        }));
        this.disposables.push(vscode.commands.registerCommand(constants_1.Commands.Jupyter.Notebook.ShutDown, () => {
            this.notebookManager.shutdown();
        }));
    }
    registerKernelCommands() {
        this.disposables.push(vscode.commands.registerCommand(constants_1.Commands.Jupyter.Kernel.Interrupt, () => {
            this.kernel.interrupt();
        }));
        this.disposables.push(vscode.commands.registerCommand(constants_1.Commands.Jupyter.Kernel.Restart, () => {
            if (this.kernelManager) {
                this.kernelManager.restartKernel(this.kernel).then(kernel => {
                    kernel.getSpec().then(spec => {
                        this.kernelManager.setRunningKernelFor(spec.language, kernel);
                    });
                    this.onKernelChanged(kernel);
                });
            }
        }));
        this.disposables.push(vscode.commands.registerCommand(constants_1.Commands.Jupyter.Kernel.Shutdown, (kernel) => {
            kernel.getSpec().then(spec => {
                this.kernelManager.destroyRunningKernelFor(spec.language);
                this.onKernelChanged();
            });
        }));
    }
}
exports.Jupyter = Jupyter;

//# sourceMappingURL=main.js.map
