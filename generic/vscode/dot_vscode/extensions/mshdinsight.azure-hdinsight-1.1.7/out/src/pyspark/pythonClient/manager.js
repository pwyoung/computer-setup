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
const utils_1 = require("../../utils");
const kernel_manager_1 = require("../jupyter/kernel-manager");
const jupyter_client_kernel_1 = require("./jupyter_client/jupyter_client_kernel");
const errors_1 = require("./common/errors");
class Manager extends kernel_manager_1.KernelManagerImpl {
    runCodeAsObservable(code, kernel) {
        return this.jupyterClient.runCode(code);
    }
    runCode(code, kernel, messageParser) {
        return new Promise((resolve, reject) => {
            let errorMessage = 'Failed to execute kernel startup code. ';
            this.jupyterClient.runCode(code).subscribe(result => {
                if (result.stream === 'stderr' && result.type === 'text' && typeof result.data['text/plain'] === 'string') {
                    this.outputChannel.appendLine(result.data['text/plain']);
                }
                if (result.stream === 'error' && result.type === 'text' && typeof result.message === 'string') {
                    errorMessage += 'Details: ' + result.message;
                }
                if (result.stream === 'status' && result.type === 'text' && result.data === 'error') {
                    this.outputChannel.appendLine(errorMessage);
                    vscode.window.showWarningMessage(errorMessage);
                }
            }, reason => {
                if (reason instanceof errors_1.KernelRestartedError || reason instanceof errors_1.KernelShutdownError) {
                    return resolve();
                }
                // It doesn't matter if startup code execution Failed
                // Possible they have placed some stuff that is invalid or we have some missing packages (e.g. matplot lib)
                this.outputChannel.appendLine(utils_1.formatErrorForLogging(reason));
                vscode.window.showWarningMessage(errorMessage);
                resolve();
            }, () => {
                resolve();
            });
        });
        // let def = createDeferred<any>();
        // let future: Kernel.IFuture;
        // let observable = new Rx.Subject<ParsedIOMessage>();
        // try {
        //     future = kernel.requestExecute({ code: code, stop_on_error: false });
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
    constructor(outputChannel, notebookManager, jupyterClient) {
        super(outputChannel, notebookManager, jupyterClient);
    }
    startKernel(kernelSpec, language) {
        return __awaiter(this, void 0, void 0, function* () {
            this.destroyRunningKernelFor(language);
            const kernelInfo = yield this.jupyterClient.startKernel(kernelSpec);
            const kernelUUID = kernelInfo[0];
            const config = kernelInfo[1];
            const connectionFile = kernelInfo[2];
            const kernel = new jupyter_client_kernel_1.JupyterClientKernel(kernelUUID, kernelSpec, config, connectionFile, this.jupyterClient);
            this.setRunningKernelFor(language, kernel);
            yield this.executeStartupCode(kernel.kernelSpec.language, kernel);
            return kernel;
            // let nb = await this.getNotebook();
            // if (!nb || nb.baseUrl.length === 0) {
            //     return Promise.reject('Notebook not selected/started');
            // }
            // await this.destroyRunningKernelFor(language);
            // let options: Kernel.IOptions = { baseUrl: nb.baseUrl, name: kernelSpec.name };
            // if (nb.token) { options.token = nb.token };
            // let promise = Kernel.startNew(options)
            //     .then(kernel => {
            //         return this.executeStartupCode(language, kernel).then(() => {
            //             this.setRunningKernelFor(language, kernel);
            //             return kernel;
            //         });
            //     });
            // ProgressBar.Instance.setProgressMessage('Starting Kernel', promise);
            // return promise;
        });
    }
    getKernelSpecsFromJupyter() {
        return this.jupyterClient.getAllKernelSpecs();
    }
}
exports.Manager = Manager;

//# sourceMappingURL=manager.js.map
