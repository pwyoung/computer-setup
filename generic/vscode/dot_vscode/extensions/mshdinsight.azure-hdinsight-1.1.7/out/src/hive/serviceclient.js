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
const vscode_languageclient_1 = require("vscode-languageclient");
const vscodeWrapper_1 = require("../controllers/vscodeWrapper");
const statusView_1 = require("../views/statusView");
const utils = require("../utils");
const interactiveService_1 = require("../hive/interactiveService");
const platform_1 = require("../cross/platform");
class LanguageClientErrorHandler {
    /**
     * Creates an instance of LanguageClientErrorHandler.
     * @memberOf LanguageClientErrorHandler
     */
    constructor() {
        if (!this.vscodeWrapper) {
            this.vscodeWrapper = new vscodeWrapper_1.default();
        }
    }
    /**
     * Show an error message prompt with a link to known issues wiki page
     * @memberOf LanguageClientErrorHandler
     */
    showOnErrorPrompt() {
        this.vscodeWrapper.showErrorMessage('Hive Tools Service component could not start.');
        if (platform_1.Platform.Windows !== utils.getPlatform()) {
            const getDotnetMessage = 'Get Mono';
            this.vscodeWrapper.showInformationMessage('Please make sure you have the latest Mono, and then restart VSCode', getDotnetMessage).then((result) => {
                if (result === getDotnetMessage) {
                    utils.openInBrowser('https://www.mono-project.com/');
                }
                return false;
            });
        }
    }
    /**
     * Callback for language service client error
     *
     * @param {Error} error
     * @param {Message} message
     * @param {number} count
     * @returns {ErrorAction}
     *
     * @memberOf LanguageClientErrorHandler
     */
    error(error, message, count) {
        this.showOnErrorPrompt();
        // we don't retry running the service since crashes leave the extension
        // in a bad, unrecovered state
        return vscode_languageclient_1.ErrorAction.Shutdown;
    }
    /**
     * Callback for language service client closed
     *
     * @returns {CloseAction}
     *
     * @memberOf LanguageClientErrorHandler
     */
    closed() {
        this.showOnErrorPrompt();
        // we don't retry running the service since crashes leave the extension
        // in a bad, unrecovered state
        return vscode_languageclient_1.CloseAction.DoNotRestart;
    }
}
class HiveToolsServiceClient {
    get languageClient() {
        return this._client;
    }
    sendRequest(type, queryDetails) {
        return new Promise((resolve, reject) => {
            this._client.sendRequest(type, queryDetails).then(() => {
                resolve();
            }, (err) => {
                reject(err);
            });
        });
    }
    sendCancelRequest(type, queryCancelDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield this._client.sendRequest(type, queryCancelDetails).then(() => {
                    resolve();
                }, (err) => {
                    reject(err);
                });
            }));
        });
    }
    initalize(context) {
        return __awaiter(this, void 0, void 0, function* () {
            this._client = yield this.createLanguageClient(context);
            if (context) {
                let disposable = this._client.start();
                context.subscriptions.push(disposable);
            }
        });
    }
    // gets or creates the singleton SQL Tools service client instance
    static get Instance() {
        if (this._instance === undefined) {
            let statusView = new statusView_1.StatusView();
            this._instance = new HiveToolsServiceClient();
        }
        return this._instance;
    }
    createLanguageClient(context) {
        return __awaiter(this, void 0, void 0, function* () {
            // Options to control the language client
            let clientOptions = {
                documentSelector: ['hql'],
                synchronize: {
                    configurationSection: 'hdinsightHive'
                },
                errorHandler: new LanguageClientErrorHandler()
            };
            let serverOptions = yield interactiveService_1.createServiceOptions();
            let client = new vscode_languageclient_1.LanguageClient('HiveToolService', serverOptions, clientOptions);
            return client;
        });
    }
    onNotification(type, handler) {
        if (this._client !== undefined) {
            return this._client.onNotification(type, handler);
        }
    }
}
exports.HiveToolsServiceClient = HiveToolsServiceClient;

//# sourceMappingURL=serviceclient.js.map
