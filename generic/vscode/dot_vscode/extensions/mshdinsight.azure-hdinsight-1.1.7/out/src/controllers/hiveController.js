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
const fs = require("fs");
const events = require("events");
const vscode = require("vscode");
const path = require("path");
const os = require("os");
const utils = require("../utils");
const Constants = require("../constants/constants");
const hiveOutputContentProvider_1 = require("../models/hiveOutputContentProvider");
const statusView_1 = require("../views/statusView");
const vscodeWrapper_1 = require("./vscodeWrapper");
const serviceclient_1 = require("../hive/serviceclient");
const jobs_1 = require("../hive/jobs");
class HiveController {
    constructor(context, vscodeWrapper) {
        this._event = new events.EventEmitter();
        this._initialized = false;
        this._context = context;
        this._vscodeWrapper = vscodeWrapper || new vscodeWrapper_1.default();
    }
    /**
     * Helper method to setup command registrations
     */
    registerCommand(command) {
        const self = this;
        this._context.subscriptions.push(vscode.commands.registerCommand(command, () => {
            self._event.emit(command);
        }));
    }
    /**
     * Disposes the controller
     */
    dispose() {
        this.deactivate();
    }
    deactivate() {
        this._statusview.dispose();
        this.onDisconnect();
    }
    activate() {
        const self = this;
        let activationTimer = new utils.Timer();
        this._vscodeWrapper = new vscodeWrapper_1.default();
        // Add handlers for VS Code generated commands
        this._vscodeWrapper.onDidCloseTextDocument(params => this.onDidCloseTextDocument(params));
        this._vscodeWrapper.onDidOpenTextDocument(params => this.onDidOpenTextDocument(params));
        this._vscodeWrapper.onDidSaveTextDocument(params => this.onDidSaveTextDocument(params));
        this.initialize(activationTimer);
    }
    /**
     * Returns a flag indicating if the extension is initialized
     */
    isInitialized() {
        return this._initialized;
    }
    /**
     * Initializes the extension
     */
    initialize(activationTimer) {
        const self = this;
        // initialize language service client
        return new Promise((resolve, reject) => {
            // Init status bar
            self._statusview = new statusView_1.StatusView();
            // Init content provider for results pane
            self._outputContentProvider = new hiveOutputContentProvider_1.HiveOutputContentProvider(self._context, self._statusview);
            activationTimer.end();
            // Handle case where SQL file is the 1st opened document
            const activeTextEditor = this._vscodeWrapper.activeTextEditor;
            if (activeTextEditor && this._vscodeWrapper.isEditingHiveFile) {
                this.onDidOpenTextDocument(activeTextEditor.document);
            }
            self._initialized = true;
            resolve(true);
        });
    }
    getHiveOutputContentProvider() {
        return this._outputContentProvider;
    }
    /**
     * Handles the command to cancel queries
     */
    onCancelQuery() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.canRunCommand() || !this.validateTextDocumentHasFocus()) {
                return;
            }
            try {
                let uri = this._vscodeWrapper.activeTextEditorUri;
                // Telemetry.sendTelemetryEvent('CancelQuery');
                yield this._outputContentProvider.cancelQuery(uri);
            }
            catch (err) {
                // Telemetry.sendTelemetryEventForException(err, 'onCancelQuery');
            }
        });
    }
    /**
    * Close active connection, if any
    */
    onDisconnect() {
        if (this.canRunCommand() && this.validateTextDocumentHasFocus()) {
            let fileUri = this._vscodeWrapper.activeTextEditorUri;
            if (fileUri) {
                let queryRunner = this._outputContentProvider.getQueryRunner(fileUri);
                if (queryRunner && queryRunner.isExecutingQuery) {
                    this._outputContentProvider.cancelQuery(fileUri);
                }
            }
        }
        return Promise.resolve(false);
    }
    onRunQueryHiveInfo(settings, hiveData, callbackThis) {
        return __awaiter(this, void 0, void 0, function* () {
            let self = callbackThis ? callbackThis : this;
            try {
                const title = `${hiveData.cluster.getName()}-${HiveController.treeviewQueryFileSuffix}`;
                const uri = path.join(os.tmpdir(), title);
                fs.writeFileSync(uri, hiveData.query);
                // [SELF WORK, _OUTPUTCONTENTPRIVODER NOT WORK]
                yield self._outputContentProvider.hiveInfoQuery(self._statusview, settings, uri, utils.nullValue(), title, hiveData);
            }
            catch (err) {
                utils.log(utils.formatErrorForLogging(err));
                // Telemetry.sendTelemetryEventForException(err, 'onRunQuery');
            }
        });
    }
    /**
     * get the T-SQL query from the editor, run it and show output
     */
    onRunQuery(settings, callbackThis, isSelectAll = false, queryStringMaps) {
        return __awaiter(this, void 0, void 0, function* () {
            // the 'this' context is lost in retry callback, so capture it here
            let self = callbackThis ? callbackThis : this;
            try {
                if (jobs_1.isPreviewEnabled(queryStringMaps)) {
                    // Table Preivew use node.treeDataProvider.refresh to display 'Starting' which requires await function
                    // queryStringMaps will surely exist while in Preview mode
                    yield self._outputContentProvider.runPreviewQuery(settings, queryStringMaps);
                }
                else {
                    // running a query text from the current document/selection
                    if (!self.canRunCommand() || !self.validateTextDocumentHasFocus()) {
                        return;
                    }
                    let editor = self._vscodeWrapper.activeTextEditor;
                    let querySelection;
                    // Calculate the selection if we have a selection, otherwise we'll use null to indicate
                    // the entire document is the selection
                    if (!isSelectAll && !editor.selection.isEmpty) {
                        let selection = editor.selection;
                        querySelection = {
                            startLine: selection.start.line,
                            startColumn: selection.start.character,
                            endLine: selection.end.line,
                            endColumn: selection.end.character
                        };
                    }
                    else {
                        querySelection = utils.nullValue();
                    }
                    // Trim down the selection. If it is empty after selecting, then we don't execute
                    let selectionToTrim = editor.selection.isEmpty ? undefined : editor.selection;
                    if (editor.document.getText(selectionToTrim).trim().length === 0) {
                        return;
                    }
                    let title = path.basename(editor.document.fileName);
                    let uri = self._vscodeWrapper.activeTextEditorUri;
                    self._outputContentProvider.runQuery(self._statusview, settings, uri, querySelection, title);
                }
            }
            catch (err) {
                // Telemetry.sendTelemetryEventForException(err, 'onRunQuery');
            }
        });
    }
    /**
     * Verifies the extension is initilized and if not shows an error message
     */
    canRunCommand() {
        return true;
    }
    /**
     * Return whether or not some text document currently has focus, and display an error message if not
     */
    validateTextDocumentHasFocus() {
        if (this._vscodeWrapper.activeTextEditorUri === undefined) {
            utils.error('A Hive editor must have focus before executing this command');
            return false;
        }
        return true;
    }
    /**
     * Called by VS Code when a text document closes. This will dispatch calls to other
     * controllers as needed. Determines if this was a normal closed file, a untitled closed file,
     * or a renamed file
     * @param doc The document that was closed
     */
    onDidCloseTextDocument(doc) {
        let closedDocumentUri = doc.uri.toString();
        let closedDocumentUriScheme = doc.uri.scheme;
        // Stop timers if they have been started
        if (this._lastSavedTimer) {
            this._lastSavedTimer.end();
        }
        if (this._lastOpenedTimer) {
            this._lastOpenedTimer.end();
        }
        // Determine which event caused this close event
        // If there was a saveTextDoc event just before this closeTextDoc event and it
        // was untitled then we know it was an untitled save
        if (this._lastSavedUri &&
            closedDocumentUriScheme === 'untitled' &&
            this._lastSavedTimer.getDuration() < Constants.untitledSaveTimeThreshold) {
            // If there was an openTextDoc event just before this closeTextDoc event then we know it was a rename
        }
        else {
            // Pass along the close event to the other handlers for a normal closed file
            this._outputContentProvider.onDidCloseTextDocument(doc);
        }
        // Reset special case timers and events
        this._lastSavedUri = utils.nullValue();
        this._lastSavedTimer = utils.nullValue();
        this._lastOpenedTimer = utils.nullValue();
        this._lastOpenedUri = utils.nullValue();
    }
    /**
     * Called by VS Code when a text document is opened. Checks if a SQL file was opened
     * to enable features of our extension for the document.
     */
    onDidOpenTextDocument(doc) {
        // Setup properties incase of rename
        this._lastOpenedTimer = new utils.Timer();
        this._lastOpenedTimer.start();
        this._lastOpenedUri = doc.uri.toString();
    }
    /**
     * Called by VS Code when a text document is saved. Will trigger a timer to
     * help determine if the file was a file saved from an untitled file.
     * @param doc The document that was saved
     */
    onDidSaveTextDocument(doc) {
        let savedDocumentUri = doc.uri.toString();
        // Keep track of which file was last saved and when for detecting the case when we save an untitled document to disk
        this._lastSavedTimer = new utils.Timer();
        this._lastSavedTimer.start();
        this._lastSavedUri = savedDocumentUri;
    }
}
// file name format 'filename.xhql', to modify this, change the code in hive.data.dll
// https://hdinsighttooling.visualstudio.com/_git/hivewrapper?path=%2FMicrosoft.HDInsight.Hive.Data.Wrapper%2FWorkspace%2FWorkspace.cs&version=GBmaster
HiveController.treeviewQueryFileSuffix = 'getHiveInfoQueryForTreeview.xhql';
exports.HiveController = HiveController;
let hiveController;
let currContext;
function getOrCreateHiveController(context) {
    if (!currContext && context) {
        currContext = context;
    }
    if (!hiveController) {
        hiveController = new HiveController(currContext);
        currContext.subscriptions.push(hiveController);
        hiveController.activate();
        serviceclient_1.HiveToolsServiceClient.Instance.initalize(currContext);
        return hiveController;
    }
    return hiveController;
}
exports.getOrCreateHiveController = getOrCreateHiveController;

//# sourceMappingURL=hiveController.js.map
