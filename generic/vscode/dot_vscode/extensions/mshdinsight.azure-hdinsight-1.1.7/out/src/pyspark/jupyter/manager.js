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
const utils_1 = require("../../utils");
const common_1 = require("../../common");
const services_1 = require("@jupyterlab/services");
const Rx = require("rx");
const progressBar_1 = require("./display/progressBar");
const kernel_manager_1 = require("./kernel-manager");
const jupyterService_1 = require("../jupyterService");
class Manager extends kernel_manager_1.KernelManagerImpl {
    constructor(outputChannel, notebookManager) {
        super(outputChannel, notebookManager, utils_1.nullValue());
    }
    getNotebook() {
        return this.notebookManager.getNotebook();
    }
    runCode(code, kernel, messageParser) {
        let def = common_1.createDeferred();
        let future;
        let observable = new Rx.Subject();
        try {
            future = kernel.requestExecute({ code: code, stop_on_error: false });
            future.onDone = () => {
                def.resolve();
            };
            future.onIOPub = (msg) => {
                messageParser.processResponse(msg, observable);
            };
        }
        catch (_ex) {
            //
        }
        observable.subscribe(msg => {
            if (msg.type === 'text' && msg.data && msg.data['text/plain']) {
                if (msg.message) {
                    this.outputChannel.appendLine(msg.message);
                }
                this.outputChannel.appendLine(msg.data['text/plain']);
            }
        });
        return def.promise;
    }
    startKernel(kernelSpec, language) {
        return __awaiter(this, void 0, void 0, function* () {
            let nb = yield this.getNotebook();
            jupyterService_1.default.getInstance().notebook = nb;
            if (!nb || nb.baseUrl.length === 0) {
                return Promise.reject('Notebook not selected/started');
            }
            yield this.destroyRunningKernelFor(language);
            let options = { baseUrl: nb.baseUrl, name: kernelSpec.name };
            if (nb.token) {
                options.token = nb.token;
            }
            let promise = services_1.Kernel.startNew(options)
                .then(kernel => {
                jupyterService_1.default.getInstance().latestKernel = kernel['id'];
                return this.executeStartupCode(language, kernel).then(() => {
                    this.setRunningKernelFor(language, kernel);
                    return kernel;
                });
            });
            progressBar_1.ProgressBar.Instance.setProgressMessage('Starting Kernel', promise);
            return promise;
        });
    }
    getKernelSpecsFromJupyter() {
        return this.getNotebook().then(nb => {
            if (!nb || nb.baseUrl.length === 0) {
                return Promise.reject('Notebook not selected/started');
            }
            let options = { baseUrl: nb.baseUrl };
            if (nb.token) {
                options.token = nb.token;
            }
            let promise = services_1.Kernel.getSpecs(options).then(specs => {
                this._defaultKernel = specs.default;
                return specs;
            });
            progressBar_1.ProgressBar.Instance.setProgressMessage('Getting Kernel Specs', promise);
            return promise;
        });
    }
}
exports.Manager = Manager;

//# sourceMappingURL=manager.js.map
