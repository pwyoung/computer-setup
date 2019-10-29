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
// This code is originally from https://github.com/Microsoft/vscode-mssql
// License: https://github.com/Microsoft/vscode-mssql/blob/master/LICENSE.txt
// we made some changes based on the source code
const events_1 = require("events");
const queryNotificationHandler_1 = require("./queryNotificationHandler");
const vscodeWrapper_1 = require("./vscodeWrapper");
const serviceclient_1 = require("../hive/serviceclient");
const queryExecute_1 = require("../models/contracts/queryExecute");
const queryDispose_1 = require("../models/contracts/queryDispose");
const Constants = require("../constants/constants");
const os = require("os");
const utils = require("../utils");
const hiveController_1 = require("./hiveController");
const platform_1 = require("../cross/platform");
const platform_2 = require("../cross/platform");
const vscode = require("vscode");
const authorization_1 = require("../azure/authorization");
const queryCancel_1 = require("../models/contracts/queryCancel");
const ncp = require("copy-paste");
/*
* Query Runner class which handles running a query, reports the results to the content manager,
* and handles getting more rows from the service layer and disposing when the content is closed.
*/
class QueryRunner {
    // CONSTRUCTOR /////////////////////////////////////////////////////////
    constructor(_ownerUri, _editorTitle, _statusView, _notificationHandler, _vscodeWrapper) {
        this._ownerUri = _ownerUri;
        this._editorTitle = _editorTitle;
        this._statusView = _statusView;
        // MEMBER VARIABLES ////////////////////////////////////////////////////
        this._batchSets = [];
        this.eventEmitter = new events_1.EventEmitter();
        this._firstRun = true;
        this._isPreview = false;
        this._client = serviceclient_1.HiveToolsServiceClient.Instance;
        if (!_notificationHandler) {
            this._notificationHandler = queryNotificationHandler_1.QueryNotificationHandler.instance;
        }
        else {
            this._notificationHandler = _notificationHandler;
        }
        if (!_vscodeWrapper) {
            this._vscodeWrapper = new vscodeWrapper_1.default();
        }
        else {
            this._vscodeWrapper = _vscodeWrapper;
        }
        // Store the state
        this._uri = _ownerUri;
        this._title = _editorTitle;
        this._isExecuting = false;
        this._totalElapsedMilliseconds = 0;
        this._hasCompleted = false;
    }
    // PROPERTIES //////////////////////////////////////////////////////////
    get uri() {
        return this._uri;
    }
    set uri(uri) {
        this._uri = uri;
    }
    get title() {
        return this._title;
    }
    set title(title) {
        this._title = title;
    }
    get batchSets() {
        return this._batchSets;
    }
    set batchSets(batchSets) {
        this._batchSets = batchSets;
    }
    get isExecutingQuery() {
        return this._isExecuting;
    }
    get hasCompleted() {
        return this._hasCompleted;
    }
    set isPreview(isPreview) {
        this._isPreview = isPreview;
    }
    get isPreview() {
        return this._isPreview;
    }
    // PUBLIC METHODS ======================================================
    cancel() {
        return __awaiter(this, void 0, void 0, function* () {
            // Make the request to cancel the query
            let cancelParams = { ownerUri: this._uri };
            return yield this._client.sendCancelRequest(queryCancel_1.QueryCancelRequest.type, cancelParams);
        });
    }
    // Pulls the query text from the current document/selection and initiates the query
    runStatement(line, column) {
        return this.doRunQuery({ startLine: line, startColumn: column, endLine: 0, endColumn: 0 }, (onSuccess, onError) => {
            // Put together the request
            let queryDetails = {
                ownerUri: this._uri,
                line: line,
                column: column
            };
            // Send the request to execute the query
            return this._client.languageClient.sendRequest(queryExecute_1.QueryExecuteStatementRequest.type, queryDetails).then(onSuccess, onError);
        }, true);
    }
    // Pulls the query text from the current document/selection and initiates the query
    runQuery(settings, selection, queryWithTime) {
        return this.doRunQuery(selection, (onSuccess, onError) => {
            // Put together the request
            let queryDetails = {
                ownerUri: this._uri,
                querySelection: selection,
                connectString: settings.connectString,
                userName: settings.userName,
                password: settings.password,
                isAuthorized: settings.isAuthorized,
                // if runQuery is not for tree view then send a empty string
                queryWithTime: (queryWithTime ? queryWithTime : '')
            };
            // Send the request to execute the query
            return this._client.languageClient.sendRequest(queryExecute_1.QueryExecuteRequest.type, queryDetails).then(onSuccess, onError);
        }, 
        // if queryWithTime exists, it means the query is from treeview
        queryWithTime ? false : true);
    }
    // Run the preview query from the current cluster and initiates it
    runPreviewQuery(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let previewQueryRequest = (previewQueryHandler) => __awaiter(this, void 0, void 0, function* () {
                    // Put together the preview request
                    let queryDetails = {
                        ownerUri: this._uri,
                        querySelection: utils.nullValue(),
                        connectString: settings.connectString,
                        userName: settings.userName,
                        password: settings.password,
                        isAuthorized: true,
                        // Send empty value while in preview mode
                        queryWithTime: ''
                    };
                    // Send the request to execute the preview query
                    try {
                        yield this._client.sendRequest(queryExecute_1.QueryExecuteRequest.type, queryDetails);
                        previewQueryHandler.onSuccess('result');
                        resolve();
                    }
                    catch (ex) {
                        previewQueryHandler.onError(ex);
                        reject();
                    }
                });
                let previewQueryAction = new PreviewQueryAction(previewQueryRequest);
                this.doRunPreviewQuery(previewQueryAction);
            });
        });
    }
    // Run the preview query from the current cluster and initiates the query
    doRunPreviewQuery(previewQueryAction) {
        const self = this;
        this._vscodeWrapper.logToOutputChannel(utils.formatString('Started preview query execution for the "{0}"', this._title));
        // Update internal state to show that we're executing the query
        this._isExecuting = true;
        let onSuccess = (result) => {
            // The preivew query has started, so lets fire up the result pane
            self.eventEmitter.emit('start');
            self._notificationHandler.registerRunner(self, self._uri);
        };
        let onError = (error) => {
            self._isExecuting = false;
            self._vscodeWrapper.showErrorMessage('Preview Query run failed: ' + error.message);
        };
        let previewQueryHandler = new PreviewQueryHandler(onSuccess, onError);
        return previewQueryAction.sendRequest(previewQueryHandler);
    }
    // Pulls the query text from the current document/selection and initiates the query
    doRunQuery(selection, queryCallback, enableLog) {
        const self = this;
        if (enableLog) {
            this._vscodeWrapper.logToOutputChannel(utils.formatString('Started query execution for document "{0}"', this._uri));
        }
        // Update internal state to show that we're executing the query
        this._resultLineOffset = selection ? selection.startLine : 0;
        this._isExecuting = true;
        this._totalElapsedMilliseconds = 0;
        this._statusView.executingQuery(this.uri);
        let onSuccess = (result) => {
            // The query has started, so lets fire up the result pane
            self.eventEmitter.emit('start');
            self._notificationHandler.registerRunner(self, self._uri);
        };
        let onError = (error) => {
            self._statusView.executedQuery(self.uri);
            self._isExecuting = false;
            self._vscodeWrapper.showErrorMessage('Execution failed: ' + error.message);
        };
        return queryCallback(onSuccess, onError);
    }
    handleHiveYarnLog(result) {
        let yarnLog = result.logEntry;
        // disable yarn log when running query for treeview
        if (!result.ownerUri.endsWith(`${hiveController_1.HiveController.treeviewQueryFileSuffix}`)) {
            utils.logHiveServerLogs(yarnLog);
        }
    }
    // TODO: handle yarn app id found event
    handleHiveYarnAppIdFound(result) {
        let appid = result.yarnId;
        this._vscodeWrapper.logToOutputChannel('yarn appid:' + appid);
    }
    isFirstRun() {
        return this._firstRun;
    }
    setFirstRun(flag) {
        this._firstRun = flag ? true : false;
    }
    // handle the result of the notification
    handleQueryComplete(result, isPreview) {
        if (result.queryWithTime === '' && !result.isCancelSuccessful) {
            this._vscodeWrapper.logToOutputChannel(utils.formatString('Finished query execution for document "{0}"', this._uri));
        }
        // Store the batch sets we got back as a source of "truth"
        this._isExecuting = false;
        this._hasCompleted = true;
        // Ack cancel response from hivewrapper
        if (result.isCancelSuccessful) {
            this._vscodeWrapper.logToOutputChannel(utils.formatString('Canceled query execution for the uri "{0}"', this._uri));
            this.eventEmitter.emit('queryCancelComplete');
            this._statusView.canceledQuery(this.uri);
            return;
        }
        // Store the batch sets we got back as a source of "truth"
        this._batchSets = result.batchSummaries;
        this._batchSets.map((batch) => {
            if (batch.selection) {
                batch.selection.startLine = batch.selection.startLine + this._resultLineOffset;
                batch.selection.endLine = batch.selection.endLine + this._resultLineOffset;
            }
        });
        // We're done with this query so shut down any waiting mechanisms
        this._statusView.executedQuery(this.uri);
        isPreview ?
            this.eventEmitter.emit('previewComplete')
            : this.eventEmitter.emit('complete', new QueryCompleteInfo(utils.parseNumAsTimeString(this._totalElapsedMilliseconds), result.queryWithTime));
    }
    handleBatchStart(result) {
        let batch = result.batchSummary;
        // Recalculate the start and end lines, relative to the result line offset
        if (batch.selection) {
            batch.selection.startLine += this._resultLineOffset;
            batch.selection.endLine += this._resultLineOffset;
        }
        // Set the result sets as an empty array so that as result sets complete we can add to the list
        batch.resultSetSummaries = [];
        // Store the batch
        this._batchSets[batch.id] = batch;
        this.eventEmitter.emit('batchStart', batch);
    }
    handleBatchComplete(result) {
        if (result.isCancelSuccessful) {
            return;
        }
        let batch = result.batchSummary;
        // Store the batch again to get the rest of the data
        this._batchSets[batch.id] = batch;
        let executionTime = (utils.parseTimeString(batch.executionElapsed) || 0);
        this._totalElapsedMilliseconds += executionTime;
        if (executionTime > 0) {
            // send a time message in the format used for query complete
            this.sendBatchTimeMessage(batch.id, utils.parseNumAsTimeString(executionTime));
        }
        this.eventEmitter.emit('batchComplete', batch);
    }
    handleResultSetComplete(result) {
        if (result.isCancelSuccessful) {
            return;
        }
        let resultSet = result.resultSetSummary;
        let batchSet = this._batchSets[resultSet.batchId];
        // Store the result set in the batch and emit that a result set has completed
        batchSet.resultSetSummaries[resultSet.id] = resultSet;
        this.eventEmitter.emit('resultSet', result);
    }
    handleMessage(obj) {
        let message = obj.message;
        if (message.time) {
            message.time = new Date(message.time).toLocaleTimeString();
        }
        else {
            message.time = new Date().toLocaleTimeString();
        }
        // Send the message to the results pane
        this.eventEmitter.emit('message', message);
    }
    // get more data rows from the current resultSets from the service layer
    getRows(rowStart, numberOfRows, batchIndex, resultSetIndex) {
        const self = this;
        let queryDetails = new queryExecute_1.QueryExecuteSubsetParams();
        queryDetails.ownerUri = this.uri;
        queryDetails.resultSetIndex = resultSetIndex;
        queryDetails.rowsCount = numberOfRows;
        queryDetails.rowsStartIndex = rowStart;
        queryDetails.batchIndex = batchIndex;
        return new Promise((resolve, reject) => {
            self._client.languageClient.sendRequest(queryExecute_1.QueryExecuteSubsetRequest.type, queryDetails).then(result => {
                resolve(result);
            }, error => {
                // TODO: Localize
                self._vscodeWrapper.showErrorMessage('Something went wrong getting more rows: ' + error.message);
                reject();
            });
        });
    }
    /**
     * Disposes the Query from the service client
     * @returns A promise that will be rejected if a problem occured
     */
    dispose() {
        const self = this;
        return new Promise((resolve, reject) => {
            let disposeDetails = new queryDispose_1.QueryDisposeParams();
            disposeDetails.ownerUri = self.uri;
            self._client.languageClient.sendRequest(queryDispose_1.QueryDisposeRequest.type, disposeDetails).then(result => {
                resolve();
            }, error => {
                self._vscodeWrapper.showErrorMessage('Failed disposing query: ' + error.message);
                reject();
            });
        });
    }
    getColumnHeaders(batchId, resultId, range) {
        let headers = [];
        let batchSummary = this.batchSets[batchId];
        if (batchSummary !== undefined) {
            let resultSetSummary = batchSummary.resultSetSummaries[resultId];
            headers = resultSetSummary.columnInfo.slice(range.fromCell, range.toCell + 1).map((info, i) => {
                return info.columnName;
            });
        }
        return headers;
    }
    /**
     * Copy the result range to the system clip-board
     * @param selection The selection range array to copy
     * @param batchId The id of the batch to copy from
     * @param resultId The id of the result to copy from
     * @param includeHeaders [Optional]: Should column headers be included in the copy selection
     */
    copyResults(selection, batchId, resultId, includeHeaders) {
        const self = this;
        return new Promise((resolve, reject) => {
            let copyString = '';
            // create a mapping of the ranges to get promises
            let tasks = selection.map((range, i) => {
                return () => {
                    return self.getRows(range.fromRow, range.toRow - range.fromRow + 1, batchId, resultId).then((result) => {
                        if (self.shouldIncludeHeaders(includeHeaders)) {
                            let columnHeaders = self.getColumnHeaders(batchId, resultId, range);
                            if (columnHeaders !== undefined) {
                                copyString += columnHeaders.join('\t') + os.EOL;
                            }
                        }
                        // Iterate over the rows to paste into the copy string
                        for (let rowIndex = 0; rowIndex < result.resultSubset.rows.length; rowIndex++) {
                            let row = result.resultSubset.rows[rowIndex];
                            let cellObjects = row.slice(range.fromCell, (range.toCell + 1));
                            // Remove newlines if requested
                            let cells = self.shouldRemoveNewLines()
                                ? cellObjects.map(x => self.removeNewLines(x.displayValue))
                                : cellObjects.map(x => x.displayValue);
                            copyString += cells.join('\t');
                            if (rowIndex < result.resultSubset.rows.length - 1) {
                                copyString += os.EOL;
                            }
                        }
                    });
                };
            });
            let p = tasks[0]();
            for (let i = 1; i < tasks.length; i++) {
                p = p.then(tasks[i]);
            }
            p.then(() => __awaiter(this, void 0, void 0, function* () {
                let linuxCanCopy = ((yield authorization_1.exitCode('xclip', '-version')) === 0);
                if (!linuxCanCopy && platform_1.getCurrentPlatform() !== platform_2.Platform.Windows && platform_1.getCurrentPlatform() !== platform_2.Platform.CentOS && platform_1.getCurrentPlatform() !== platform_2.Platform.OSX && platform_1.getCurrentPlatform() !== platform_2.Platform.macOS) {
                    vscode.window.showWarningMessage('Please execute "apt-get install xclip" to enable copy paste table data in Linux');
                }
                else {
                    ncp.copy(copyString, () => {
                        resolve();
                    });
                }
            }));
        });
    }
    shouldIncludeHeaders(includeHeaders) {
        if (includeHeaders !== undefined) {
            // Respect the value explicity passed into the method
            return includeHeaders;
        }
        // else get config option from vscode config
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName);
        includeHeaders = config[Constants.copyIncludeHeaders];
        return !!includeHeaders;
    }
    shouldRemoveNewLines() {
        // get config copyRemoveNewLine option from vscode config
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName);
        let removeNewLines = config[Constants.configCopyRemoveNewLine];
        return removeNewLines;
    }
    removeNewLines(inputString) {
        // This regex removes all newlines in all OS types
        // Windows(CRLF): \r\n
        // Linux(LF)/Modern MacOS: \n
        // Old MacOs: \r
        let outputString = inputString.replace(/(\r\n|\n|\r)/gm, '');
        return outputString;
    }
    sendBatchTimeMessage(batchId, executionTime) {
        // get config copyRemoveNewLine option from vscode config
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName);
        let showBatchTime = config[Constants.configShowBatchTime];
        if (showBatchTime) {
            let message = {
                batchId: batchId,
                message: utils.formatString('Batch execution time: {0}', executionTime),
                time: undefined,
                isError: false
            };
            // Send the message to the results pane
            this.eventEmitter.emit('message', message);
        }
    }
    /**
     * Sets a selection range in the editor for this query
     * @param selection The selection range to select
     */
    setEditorSelection(selection) {
        const self = this;
        return new Promise((resolve, reject) => {
            self._vscodeWrapper.openTextDocument(self._vscodeWrapper.parseUri(self.uri)).then((doc) => {
                self._vscodeWrapper.showTextDocument(doc).then((editor) => {
                    editor.selection = self._vscodeWrapper.selection(self._vscodeWrapper.position(selection.startLine, selection.startColumn), self._vscodeWrapper.position(selection.endLine, selection.endColumn));
                    resolve();
                });
            });
        });
    }
    resetHasCompleted() {
        this._hasCompleted = false;
    }
    // public for testing only - used to mock handleQueryComplete
    _setHasCompleted() {
        this._hasCompleted = true;
    }
    get totalElapsedMilliseconds() {
        return this._totalElapsedMilliseconds;
    }
}
exports.default = QueryRunner;
class QueryCompleteInfo {
    constructor(totalMilliseconds, queryWithTime) {
        this.totalMilliseconds = totalMilliseconds;
        this.queryWithTime = queryWithTime;
    }
}
exports.QueryCompleteInfo = QueryCompleteInfo;
// process the preview request result
class PreviewQueryAction {
    constructor(previewQueryRequest) {
        this._previewQueryRequest = previewQueryRequest;
    }
    sendRequest(previewQueryHandler) {
        return new Promise((resolve, reject) => {
            let requestFunction = (previewQueryHandler) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this._previewQueryRequest(previewQueryHandler);
                    resolve();
                }
                catch (err) {
                    utils.error(`Preview Query request sent failed ${err}`);
                    reject();
                }
            });
            requestFunction(previewQueryHandler);
        });
    }
}
// Handle the result after sending the request to execute the preview query
class PreviewQueryHandler {
    constructor(onSuccess, onError) {
        this.onSuccess = onSuccess;
        this.onError = onError;
    }
}

//# sourceMappingURL=queryRunner.js.map
