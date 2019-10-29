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
const kernelPicker_1 = require("./kernelPicker");
const constants_1 = require("../common/constants");
const resultView_1 = require("./resultView");
const cellOptions_1 = require("./cellOptions");
const server_1 = require("./server");
const utils = require("../../../utils");
const common_1 = require("../../../common");
class JupyterDisplay extends vscode.Disposable {
    constructor(cellCodeLenses, outputChannel) {
        super(() => { });
        this.outputChannel = outputChannel;
        this.disposables = [];
        this.server = new server_1.Server();
        this.disposables.push(this.server);
        this.disposables.push(new kernelPicker_1.KernelPicker());
        this.disposables.push(vscode.commands.registerCommand(constants_1.Commands.Jupyter.Kernel_Options, this.showKernelOptions.bind(this)));
        this.cellOptions = new cellOptions_1.CellOptions(cellCodeLenses);
        this.disposables.push(this.cellOptions);
        this.server.on('settings.appendResults', append => {
            vscode.workspace.getConfiguration('hdinsightJupyter').update('appendResults', append, true)
                .then(() => {
                this.server.sendSetting('settings.appendResults', append);
            }, reason => {
                this.outputChannel.appendLine(utils.formatErrorForLogging(reason));
                vscode.window.showErrorMessage('Failed to update the setting', 'View Errors')
                    .then(item => {
                    if (item === 'View Errors') {
                        this.outputChannel.show();
                    }
                });
            });
        });
        this.server.on('connected', () => {
            this.clientConnected = true;
            this.server.sendSetting('settings.appendResults', this.appendResults);
        });
    }
    get appendResults() {
        return vscode.workspace.getConfiguration('hdinsightJupyter').get('appendResults', true);
    }
    setNotebook(nb, canShutdown) {
        this.notebookUrl = (nb && nb.baseUrl) || '';
        this.canShutdown = canShutdown;
    }
    showResults(results) {
        return this.server.start().then(port => {
            // If we need to append the results, then do so if we have any result windows open
            let sendDataToResultView = this.server.clientsConnected(2000);
            return sendDataToResultView.then(clientConnected => {
                // If connected to result view, then send results over sockets as they arrive
                if (clientConnected) {
                    this.server.clearBuffer();
                    results.subscribe(result => {
                        this.server.sendResults([result.data]);
                    });
                    return Promise.resolve();
                }
                // Wait till we have at least one item to be displayed before opening the results view
                const def = common_1.createDeferred();
                this.clientConnected = false;
                results.subscribe(result => {
                    this.server.sendResults([result.data]);
                    if (this.clientConnected) {
                        this.server.clearBuffer();
                        return;
                    }
                    this.launchResultViewAndDisplayResults(port).
                        then(def.resolve.bind(def)).catch(def.reject.bind(def));
                });
                results.subscribeOnCompleted(() => {
                    if (!def.completed) {
                        def.resolve();
                    }
                });
                return def.promise;
            });
        });
    }
    launchResultViewAndDisplayResults(serverPort) {
        const panel = vscode.window.createWebviewPanel('JupyterResultView', 'Results', vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        panel.webview.html = resultView_1.getWebviewContent(serverPort);
        return Promise.resolve();
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
    showKernelOptions(selectedKernel) {
        return __awaiter(this, void 0, void 0, function* () {
            let description = '';
            let spec = yield selectedKernel.getSpec();
            if (spec.display_name.toLowerCase().indexOf(spec.language.toLowerCase()) === -1) {
                description = `${spec.name} for ${spec.language}`;
            }
            const options = [
                {
                    label: `Interrupt ${spec.display_name} Kernel`,
                    description: description,
                    command: constants_1.Commands.Jupyter.Kernel.Interrupt,
                    args: [selectedKernel]
                },
                {
                    label: `Restart ${spec.display_name} Kernel`,
                    description: description,
                    command: constants_1.Commands.Jupyter.Kernel.Restart,
                    args: [selectedKernel]
                },
                {
                    label: `Shut Down ${spec.display_name} Kernel`,
                    description: description,
                    command: constants_1.Commands.Jupyter.Kernel.Shutdown,
                    args: [selectedKernel]
                },
                {
                    label: ` `,
                    description: ' ',
                    command: '',
                    args: []
                },
                {
                    label: `Select another ${spec.language} Kernel`,
                    description: ` `,
                    command: constants_1.Commands.Jupyter.Kernel.Select,
                    args: [spec.language]
                }
            ];
            if (this.canShutdown) {
                options.push({
                    label: `Shut Down Notebook`,
                    description: `Notebook running on ${this.notebookUrl}`,
                    command: constants_1.Commands.Jupyter.Notebook.ShutDown,
                    args: []
                });
            }
            return vscode.window.showQuickPick(options).then(option => {
                if (!option || !option.command || option.command.length === 0) {
                    return;
                }
                return vscode.commands.executeCommand(option.command, ...option.args);
            });
        });
    }
}
exports.JupyterDisplay = JupyterDisplay;

//# sourceMappingURL=main.js.map
