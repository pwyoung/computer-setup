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
const events_1 = require("events");
const vscode = require("vscode");
const path = require("path");
const Constants = require("../constants/constants");
const localWebService_1 = require("../controllers/localWebService");
const Interfaces = require("./interfaces");
const queryRunner_1 = require("../controllers/queryRunner");
const vscodeWrapper_1 = require("../controllers/vscodeWrapper");
const pretty_data_1 = require("pretty-data");
const fs = require("fs");
const constants = require("constants");
const dummyStatusView_1 = require("../views/dummyStatusView");
const resultsSerializer_1 = require("../models/resultsSerializer");
const utils = require("../utils");
const hiveController_1 = require("../controllers/hiveController");
const HiveInfo_1 = require("../treeView/HiveInfo");
const jobs_1 = require("../hive/jobs");
const deletionTimeoutTime = 1.8e6; // in ms, currently 30 minutes
// holds information about the state of a query runner
class QueryRunnerState {
    constructor(queryRunner) {
        this.queryRunner = queryRunner;
        this.flaggedForDeletion = false;
    }
}
class ResultsConfig {
}
class HiveOutputContentProvider {
    // CONSTRUCTOR /////////////////////////////////////////////////////////
    constructor(context, statusView) {
        this.eventEmitter = new events_1.EventEmitter();
        // MEMBER VARIABLES ////////////////////////////////////////////////////
        this._queryResultsMap = new Map();
        this._onDidChange = new vscode.EventEmitter();
        this._resultsPanes = new Map();
        /* to cache the submitted cluster of the last running query
            key: result URI
            value: connectstring of submitted cluster
        */
        this.ownerUrlToCluster = new Map();
        this.hiveDataMaps = new Map();
        this.resultsetMaps = new Map();
        this._vscodeWrapper = new vscodeWrapper_1.default();
        this._statusView = statusView;
        // create local express server
        this._service = new localWebService_1.default(context.extensionPath);
        // add http handler for '/root'
        this._service.addHandler(Interfaces.ContentType.Root, (req, res) => this.rootRequestHandler(req, res));
        // add http handler for '/rows' - return rows end-point for a specific resultset
        this._service.addHandler(Interfaces.ContentType.Rows, (req, res) => this.rowRequestHandler(req, res));
        // add http handler for '/config'
        this._service.addHandler(Interfaces.ContentType.Config, (req, res) => this.configRequestHandler(req, res));
        // add http handler for '/saveResults' - return success message as JSON
        this._service.addPostHandler(Interfaces.ContentType.SaveResults, (req, res) => this.saveResultsRequestHandler(req, res));
        // add http handler for '/openLink' - open content in a new vscode editor pane
        this._service.addPostHandler(Interfaces.ContentType.OpenLink, (req, res) => this.openLinkRequestHandler(req, res));
        // add http post handler for copying results
        this._service.addPostHandler(Interfaces.ContentType.Copy, (req, res) => this.copyRequestHandler(req, res));
        // add http get handler for setting the selection in the editor
        this._service.addHandler(Interfaces.ContentType.EditorSelection, (req, res) => this.editorSelectionRequestHandler(req, res));
        // add http post handler for showing errors to user
        this._service.addPostHandler(Interfaces.ContentType.ShowError, (req, res) => this.showErrorRequestHandler(req, res));
        // add http post handler for showing warning to user
        this._service.addPostHandler(Interfaces.ContentType.ShowWarning, (req, res) => this.showWarningRequestHandler(req, res));
        // start express server on localhost and listen on a random port
        try {
            this._service.start();
        }
        catch (error) {
            utils.error(error);
            throw (error);
        }
    }
    getLocalWebService() {
        return this._service;
    }
    rootRequestHandler(req, res) {
        let uri = req.query.uri;
        if (this._queryResultsMap.has(uri)) {
            let queryStatus = this._queryResultsMap.get(uri);
            clearTimeout(queryStatus.timeout);
        }
        let theme = req.query.theme;
        let backgroundcolor = req.query.backgroundcolor;
        let color = req.query.color;
        let prod;
        try {
            let filepath = path.join(localWebService_1.default.staticContentPath, Constants.contentProviderMinFile);
            fs.accessSync(filepath, constants.F_OK);
            prod = true;
        }
        catch (e) {
            prod = false;
        }
        let queryUri = '';
        if (this._queryResultsMap.has(uri)) {
            queryUri = this._queryResultsMap.get(uri).queryRunner.uri;
        }
        let hdiConfig = this._vscodeWrapper.getConfiguration(Constants.extensionName, queryUri);
        let editorConfig = this._vscodeWrapper.getConfiguration('editor', queryUri);
        let extensionFontFamily = hdiConfig.get('resultsFontFamily').split('\'').join('').split('"').join('');
        let extensionFontSize = hdiConfig.get(Constants.extConfigResultFontSize);
        let fontfamily = extensionFontFamily ?
            extensionFontFamily :
            editorConfig.get('fontFamily').split('\'').join('').split('"').join('');
        let fontsize = extensionFontSize ? extensionFontSize + 'px' : editorConfig.get('fontSize') + 'px';
        let fontweight = editorConfig.get('fontWeight');
        res.render(path.join(localWebService_1.default.staticContentPath, Constants.msgContentProviderSqlOutputHtml), {
            uri: uri,
            theme: theme,
            backgroundcolor: backgroundcolor,
            color: color,
            fontfamily: fontfamily,
            fontsize: fontsize,
            fontweight: fontweight,
            prod: prod
        });
    }
    rowRequestHandler(req, res) {
        let resultId = req.query.resultId;
        let batchId = req.query.batchId;
        let rowStart = req.query.rowStart;
        let numberOfRows = req.query.numberOfRows;
        let uri = req.query.uri;
        this._queryResultsMap.get(uri).queryRunner.getRows(rowStart, numberOfRows, batchId, resultId).then(results => {
            let json = JSON.stringify(results.resultSubset);
            res.send(json);
        });
    }
    configRequestHandler(req, res) {
        let queryUri = this._queryResultsMap.get(req.query.uri).queryRunner.uri;
        let extConfig = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName, queryUri);
        let config = new ResultsConfig();
        for (let key of Constants.extConfigResultKeys) {
            config[key] = extConfig[key];
        }
        let json = JSON.stringify(config);
        res.send(json);
    }
    saveResultsRequestHandler(req, res) {
        let uri = req.query.uri;
        let queryUri = this._queryResultsMap.get(uri).queryRunner.uri;
        let selectedResultSetNo = Number(req.query.resultSetNo);
        let batchIndex = Number(req.query.batchIndex);
        let format = req.query.format;
        let selection = req.body;
        // TODO: on saveResults
        let saveResults = new resultsSerializer_1.default();
        saveResults.onSaveResults(queryUri, batchIndex, selectedResultSetNo, format, selection);
        res.status = 200;
        res.send();
    }
    openLinkRequestHandler(req, res) {
        let content = req.body.content;
        let columnName = req.body.columnName;
        let linkType = req.body.type;
        this.openLink(content, columnName, linkType);
        res.status = 200;
        res.send();
    }
    copyRequestHandler(req, res) {
        let uri = req.query.uri;
        let resultId = req.query.resultId;
        let batchId = req.query.batchId;
        let includeHeaders = req.query.includeHeaders;
        let selection = req.body;
        this._queryResultsMap.get(uri).queryRunner.copyResults(selection, batchId, resultId, includeHeaders).then(() => {
            res.status = 200;
            res.send();
        });
    }
    editorSelectionRequestHandler(req, res) {
        let uri = req.query.uri;
        let selection = {
            startLine: parseInt(req.query.startLine, 10),
            startColumn: parseInt(req.query.startColumn, 10),
            endLine: parseInt(req.query.endLine, 10),
            endColumn: parseInt(req.query.endColumn, 10)
        };
        this._queryResultsMap.get(uri).queryRunner.setEditorSelection(selection).then(() => {
            res.status = 200;
            res.send();
        });
    }
    showErrorRequestHandler(req, res) {
        let message = req.body.message;
        this._vscodeWrapper.showErrorMessage(message);
        // not attached to show function callback, since callback returns only after user closes message
        res.status = 200;
        res.send();
    }
    showWarningRequestHandler(req, res) {
        let message = req.body.message;
        this._vscodeWrapper.showWarningMessage(message);
        // not attached to show function callback, since callback returns only after user closes message
        res.status = 200;
        res.send();
    }
    // PROPERTIES //////////////////////////////////////////////////////////
    get onDidChange() {
        return this._onDidChange.event;
    }
    update(uri) {
        this._onDidChange.fire(uri);
    }
    // PUBLIC METHODS //////////////////////////////////////////////////////
    isRunningQuery(uri) {
        return !this._queryResultsMap.has(uri)
            ? false
            : this._queryResultsMap.get(uri).queryRunner.isExecutingQuery;
    }
    hiveInfoQuery(statusView, connectionSettings, uri, selection, title, hiveData) {
        // execute the query with a query runner
        this.hiveInfoCallBack(statusView, connectionSettings, uri, selection, title, hiveData, (queryRunner) => {
            if (queryRunner) {
                queryRunner.runQuery(connectionSettings, selection, `time:${hiveData.querySendTime}-query:${hiveData.query}`);
            }
        });
    }
    hiveInfoCallBack(statusView, connectionSettings, uri, selection, title, hiveData, queryCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            let resultsUri = this.getResultsUri(uri);
            let queryRunner = yield this.createQueryRunner(statusView, connectionSettings, uri, resultsUri, selection, title, hiveData);
            if (queryRunner) {
                yield queryCallback(queryRunner);
            }
        });
    }
    runQuery(statusView, connectionSettings, uri, selection, title) {
        // execute the query with a query runner
        this.runQueryCallback(statusView, connectionSettings, uri, selection, title, (queryRunner) => {
            if (queryRunner) {
                queryRunner.runQuery(connectionSettings, selection);
            }
        });
    }
    runPreviewQuery(connectionSettings, queryStringMaps) {
        return __awaiter(this, void 0, void 0, function* () {
            // execute the preview query with a query runner, uri will surely exist while in preview mode
            let uri = queryStringMaps.get('uri');
            let resultsUri = this.getResultsUri(uri);
            let queryRunner = yield this.createPreviewQueryRunner(new dummyStatusView_1.DummyStatusView(), connectionSettings, uri, resultsUri, queryStringMaps.get('title'), queryStringMaps);
            if (queryRunner) {
                yield queryRunner.runPreviewQuery(connectionSettings);
                let paneTitle = `Preview Results: [${queryStringMaps.get('clusterName')}].[${queryStringMaps.get('title')}]`;
                this.displayResultPane(resultsUri, paneTitle, uri, queryStringMaps);
            }
        });
    }
    runQueryCallback(statusView, connectionSettings, uri, selection, title, queryCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            let resultsUri = this.getResultsUri(uri);
            let queryRunner = yield this.createQueryRunner(statusView, connectionSettings, uri, resultsUri, selection, title);
            if (queryRunner) {
                queryCallback(queryRunner);
                let paneTitle = 'Results: ' + queryRunner.title;
                this.displayResultPane(resultsUri, paneTitle, uri);
            }
        });
    }
    createQueryRunner(statusView, connectionSettings, uri, resultsUri, selection, title, hiveData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Reuse existing query runner if it exists
            let queryRunner;
            if (hiveData) {
                const hiveMapKey = `time:${hiveData.querySendTime}-query:${hiveData.query}`;
                if (!this.hiveDataMaps.has(hiveMapKey)) {
                    this.hiveDataMaps.set(hiveMapKey, hiveData);
                }
            }
            if (this._queryResultsMap.has(resultsUri)) {
                let existingRunner = this._queryResultsMap.get(resultsUri).queryRunner;
                // If the query is already in progress, don't attempt to send it
                if (existingRunner.isExecutingQuery || !existingRunner.hasCompleted) {
                    if (hiveData) {
                        hiveData.eventEmitter.emit('conflict');
                    }
                    else {
                        this._vscodeWrapper.showInformationMessage('A query is already running for this editor session. Please cancel this query or wait for its completion.');
                    }
                    return;
                }
                // If the query is not in progress, we can reuse the query runner
                queryRunner = existingRunner;
                if (this.ownerUrlToCluster.has(resultsUri)) {
                    let preSelectedClusterConnectString = this.ownerUrlToCluster.get(resultsUri);
                    // the messgage should be clear if the connectstring changed
                    if (preSelectedClusterConnectString !== connectionSettings.connectionKey()) {
                        hiveController_1.getOrCreateHiveController().getHiveOutputContentProvider().getLocalWebService().getWsMap().delete(resultsUri);
                        // regard it as first run since the connectstring changed
                        if (!hiveData) {
                            queryRunner.setFirstRun(true);
                        }
                        this.ownerUrlToCluster.set(resultsUri, connectionSettings.connectionKey());
                    }
                }
                queryRunner.resetHasCompleted();
                // update the open pane assuming its open (if its not its a bug covered by the previewhtml command later)
                this.update(vscode.Uri.parse(resultsUri));
            }
            else {
                this.ownerUrlToCluster.set(resultsUri, connectionSettings.connectionKey());
                // We do not have a query runner for this editor, so create a new one
                // and map it to the results uri
                queryRunner = new queryRunner_1.default(uri, title, statusView);
                queryRunner.eventEmitter.on('resultSet', (result) => __awaiter(this, void 0, void 0, function* () {
                    const selectedHiveData = this.hiveDataMaps.get(result.queryWithTime);
                    if (selectedHiveData) {
                        const resultSet = result.resultSetSummary;
                        this.resultsetMaps.set(result.queryWithTime, resultSet);
                    }
                    this._service.broadcast(resultsUri, 'resultSet', result.resultSetSummary);
                }));
                queryRunner.eventEmitter.on('batchStart', (batch) => {
                    // Build a link for the selection and send it in a message
                    let encodedUri = encodeURIComponent(resultsUri);
                    let link = localWebService_1.default.getEndpointUri(Interfaces.ContentType.EditorSelection) + `?uri=${encodedUri}`;
                    if (batch.selection) {
                        link += `&startLine=${batch.selection.startLine}` +
                            `&startColumn=${batch.selection.startColumn}` +
                            `&endLine=${batch.selection.endLine}` +
                            `&endColumn=${batch.selection.endColumn}`;
                    }
                    let message = {
                        message: 'Started executing query at ',
                        batchId: undefined,
                        isError: false,
                        time: new Date().toLocaleTimeString(),
                        link: {
                            text: utils.formatString('Line {0}', batch.selection.startLine + 1),
                            uri: link
                        }
                    };
                    this._service.broadcast(resultsUri, 'message', message);
                });
                queryRunner.eventEmitter.on('message', (message) => {
                    // Print error message(such as "QueryServiceCompletedSuccessfully", "QueryServiceAffectedRows:123") 
                    // as "Query Service Completed Successfully", "Query Service Affected Rows: 123"
                    try {
                        let msg = message.message;
                        msg = msg.match(/[A-Z]+[a-z:]+|[a-z]+|[0-9]+|/g).join(' ').toLowerCase().replace(/ /g, ' ');
                        message.message = msg.charAt(0).toUpperCase() + msg.slice(1);
                    }
                    catch (ex) {
                        utils.error(`running message format failed: ${ex}`);
                    }
                    finally {
                        this._service.broadcast(resultsUri, 'message', message);
                    }
                });
                // Print cancel complete message
                queryRunner.eventEmitter.on('queryCancelComplete', () => {
                    try {
                        this._service.broadcast(resultsUri, 'queryCancelComplete');
                    }
                    catch (ex) {
                        utils.error(`running cancel complete message failed: ${ex}`);
                    }
                });
                queryRunner.eventEmitter.on('complete', (queryCompleteInfo) => __awaiter(this, void 0, void 0, function* () {
                    const selfService = this._service;
                    const selectedHiveData = this.hiveDataMaps.get(queryCompleteInfo.queryWithTime);
                    if (selectedHiveData) {
                        const selectedResultset = this.resultsetMaps.get(queryCompleteInfo.queryWithTime);
                        if (selectedResultset) {
                            const getRowsResults = yield queryRunner.getRows(0, selectedResultset.rowCount, selectedResultset.batchId, selectedResultset.id);
                            let rowList = [];
                            if (selectedHiveData.query_type === HiveInfo_1.QueryType.query_schema) {
                                for (let i = 0; i < selectedResultset.rowCount; i++) {
                                    const col_name = getRowsResults.resultSubset.rows[i][0].displayValue;
                                    const data_type = getRowsResults.resultSubset.rows[i][1].displayValue;
                                    const RowItem = `${col_name} : ${data_type}`;
                                    rowList.push(RowItem);
                                }
                                selectedHiveData.eventEmitter.emit('schema', rowList);
                            }
                            else {
                                for (let i = 0; i < selectedResultset.rowCount; i++) {
                                    const RowItem = getRowsResults.resultSubset.rows[i][0].displayValue;
                                    rowList.push(RowItem);
                                }
                                if (selectedHiveData.query_type === HiveInfo_1.QueryType.query_table) {
                                    selectedHiveData.eventEmitter.emit('table', rowList);
                                }
                                else {
                                    selectedHiveData.eventEmitter.emit('database', rowList);
                                }
                            }
                        }
                        // when hive job complete, check hive job queue first
                        if (selectedHiveData.funcList) {
                            yield selectedHiveData.funcList.runHiveJob();
                        }
                    }
                    selfService.broadcast(resultsUri, 'complete', queryCompleteInfo.totalMilliseconds);
                    // This is just a walking around to fix the result panel hung issue for the first execution query.
                    // TODO: we need a better way to handle this issue
                    if (queryRunner.isFirstRun()) {
                        this.update(vscode.Uri.parse(resultsUri));
                        queryRunner.setFirstRun(false);
                    }
                }));
                queryRunner.eventEmitter.on('start', () => {
                    this._service.resetSocket(resultsUri);
                });
                this._queryResultsMap.set(resultsUri, new QueryRunnerState(queryRunner));
            }
            return queryRunner;
        });
    }
    // Create preview query runner while in preview mode
    createPreviewQueryRunner(statusView, connectionSettings, uri, resultsUri, title, queryStringMaps) {
        return __awaiter(this, void 0, void 0, function* () {
            // Reuse existing query runner if it exists
            let previewQueryRunner;
            if (this._queryResultsMap.has(resultsUri)) {
                let existingRunner = this._queryResultsMap.get(resultsUri).queryRunner;
                // If the query is already in progress, don't attempt to send it
                if (existingRunner.isExecutingQuery || !existingRunner.hasCompleted) {
                    this._vscodeWrapper.showInformationMessage('A preview query is already running for this editor session. Please cancel this query or wait for its completion.');
                    return;
                }
                // If the query is not in progress, we can reuse the preview query runner
                previewQueryRunner = existingRunner;
                if (this.ownerUrlToCluster.has(resultsUri)) {
                    let preSelectedClusterConnectString = this.ownerUrlToCluster.get(resultsUri);
                    // the messgage should be clear if the connectstring changed
                    if (preSelectedClusterConnectString !== connectionSettings.connectionKey()) {
                        hiveController_1.getOrCreateHiveController().getHiveOutputContentProvider().getLocalWebService().getWsMap().delete(resultsUri);
                        // regard it as first run since the connectstring changed
                        previewQueryRunner.setFirstRun(true);
                        this.ownerUrlToCluster.set(resultsUri, connectionSettings.connectionKey());
                    }
                }
                previewQueryRunner.resetHasCompleted();
                // update the open pane assuming its open (if its not its a bug covered by the previewhtml command later)
                this.update(vscode.Uri.parse(resultsUri));
            }
            else {
                this.ownerUrlToCluster.set(resultsUri, connectionSettings.connectionKey());
                // We do not have a preview query runner for it, so create a new one
                // and map it to the results uri
                previewQueryRunner = new queryRunner_1.default(uri, title, statusView);
                let rows = 0;
                previewQueryRunner.eventEmitter.on('resultSet', (result) => __awaiter(this, void 0, void 0, function* () {
                    this._service.broadcast(resultsUri, 'resultSet', result.resultSetSummary);
                    rows = result.resultSetSummary.rowCount || 0;
                }));
                if (jobs_1.isPreviewEnabled(queryStringMaps)) {
                    // set it to be used for handleQueryCompleteNotification
                    previewQueryRunner.isPreview = true;
                    previewQueryRunner.eventEmitter.on('previewComplete', () => __awaiter(this, void 0, void 0, function* () {
                        const selfService = this._service;
                        selfService.broadcast(resultsUri, 'previewComplete', rows);
                        // This is just a walking around to fix the result panel hung issue for the first execution query.
                        // TODO: we need a better way to handle this issue
                        if (previewQueryRunner.isFirstRun()) {
                            this.update(vscode.Uri.parse(resultsUri));
                            previewQueryRunner.setFirstRun(false);
                        }
                    }));
                    previewQueryRunner.eventEmitter.on('start', () => {
                        this._service.resetSocket(resultsUri);
                    });
                    this._queryResultsMap.set(resultsUri, new QueryRunnerState(previewQueryRunner));
                }
                else {
                    utils.error('Failed to run Preview when preview enabled');
                }
            }
            return previewQueryRunner;
        });
    }
    // Function to render resultspane content
    displayResultPane(resultsUri, paneTitle, queryUri, queryStringMaps) {
        // Get the active text editor
        let activeTextEditor = this._vscodeWrapper.activeTextEditor;
        // Get the resultUri from active text editor if it's not in preview mode
        if (!jobs_1.isPreviewEnabled(queryStringMaps)) {
            resultsUri = this.getResultsUri(this._vscodeWrapper.activeTextEditorUri);
        }
        // Wrapper tells us where the new results pane should be placed
        let resultPaneColumn = this.newResultPaneViewColumn(queryUri, jobs_1.isPreviewEnabled(queryStringMaps));
        // Check if the results window already exists
        let panel = this._resultsPanes.get(resultsUri);
        if (!panel) {
            panel = vscode.window.createWebviewPanel(resultsUri, paneTitle, resultPaneColumn, {
                retainContextWhenHidden: true,
                enableScripts: true
            });
            this._resultsPanes.set(resultsUri, panel);
            panel.onDidDispose(() => this._resultsPanes.delete(resultsUri));
        }
        // Update the results panel's content
        panel.webview.html = this.provideTextDocumentContent(resultsUri);
        panel.reveal(resultPaneColumn);
        // update webview to hold the lifecycle of the panel
        const updateWebview = (webviewPanel) => {
            webviewPanel.webview.postMessage({ result: 'waiting' });
        };
        const interval = setInterval(() => {
            updateWebview(panel);
        }, 50);
        // Reset focus to the text editor if it's in a different column than the results window
        // Delay it a little bit to give the webview time to open. Unfortunately VS Code doesn't
        // give us a callback when the webview opens.
        // skip the below function while in preview mode
        const timeout = setTimeout(() => {
            if (resultPaneColumn !== activeTextEditor.viewColumn && !jobs_1.isPreviewEnabled(queryStringMaps)) {
                this._vscodeWrapper.showTextDocument(activeTextEditor.document, activeTextEditor.viewColumn);
            }
        }, 500);
        // when the panel is closed, cancel interval and timeout job
        panel.onDidDispose(() => {
            clearInterval(interval);
            clearTimeout(timeout);
        });
    }
    cancelQuery(input) {
        let self = this;
        let queryRunner;
        if (typeof input === 'string') {
            if (this.isResultsUri(input) && this._queryResultsMap.has(input)) {
                // Option 1: The string is a results URI (the results tab has focus)
                queryRunner = this._queryResultsMap.get(input).queryRunner;
            }
            else {
                // Option 2: The string is a file URI (the SQL file tab has focus)
                let resultsUri = this.getResultsUri(input).toString();
                if (this._queryResultsMap.has(resultsUri)) {
                    queryRunner = this._queryResultsMap.get(resultsUri).queryRunner;
                }
            }
        }
        else {
            queryRunner = input;
        }
        if (!queryRunner || !queryRunner.isExecutingQuery) {
            self._vscodeWrapper.showInformationMessage('Cannot cancel query as no query is running.');
            return;
        }
        // Switch the spinner to canceling, which will be reset when the query execute sends back its completed event
        this._statusView.cancelingQuery(queryRunner.uri);
        // Cancel the query
        queryRunner.cancel().then(success => undefined, error => {
            // On error, show error message
            self._vscodeWrapper.showErrorMessage(utils.formatString('Canceling the query failed: {0}', error.message));
        });
    }
    /**
     * Executed from the MainController when an untitled text document was saved to the disk. If
     * any queries were executed from the untitled document, the queryrunner will be remapped to
     * a new resuls uri based on the uri of the newly saved file.
     * @param untitledUri   The URI of the untitled file
     * @param savedUri  The URI of the file after it was saved
     */
    onUntitledFileSaved(untitledUri, savedUri) {
        // If we don't have any query runners mapped to this uri, don't do anything
        let untitledResultsUri = decodeURIComponent(this.getResultsUri(untitledUri));
        if (!this._queryResultsMap.has(untitledResultsUri)) {
            return;
        }
        // NOTE: We don't need to remap the query in the service because the queryrunner still has
        // the old uri. As long as we make requests to the service against that uri, we'll be good.
        // Remap the query runner in the map
        let savedResultUri = decodeURIComponent(this.getResultsUri(savedUri));
        this._queryResultsMap.set(savedResultUri, this._queryResultsMap.get(untitledResultsUri));
        this._queryResultsMap.delete(untitledResultsUri);
    }
    /**
     * Executed from the MainController when a text document (that already exists on disk) was
     * closed. If the query is in progress, it will be canceled. If there is a query at all,
     * the query will be disposed.
     * @param doc   The document that was closed
     */
    onDidCloseTextDocument(doc) {
        for (let [key, value] of this._queryResultsMap.entries()) {
            // closed text document related to a results window we are holding
            if (doc.uri.toString() === value.queryRunner.uri) {
                value.flaggedForDeletion = true;
            }
            // "closed" a results window we are holding
            if (doc.uri.toString() === key) {
                value.timeout = this.setRunnerDeletionTimeout(key);
            }
        }
    }
    setRunnerDeletionTimeout(uri) {
        const self = this;
        return setTimeout(() => {
            let queryRunnerState = self._queryResultsMap.get(uri);
            if (queryRunnerState.flaggedForDeletion) {
                self._queryResultsMap.delete(uri);
                if (queryRunnerState.queryRunner.isExecutingQuery) {
                    // We need to cancel it, which will dispose it
                    this.cancelQuery(queryRunnerState.queryRunner);
                }
                else {
                    // We need to explicitly dispose the query
                    queryRunnerState.queryRunner.dispose();
                }
            }
            else {
                queryRunnerState.timeout = this.setRunnerDeletionTimeout(uri);
            }
        }, deletionTimeoutTime);
    }
    // Called exactly once to load html content in the webview
    provideTextDocumentContent(uri) {
        // URI needs to be encoded as a component for proper inclusion in a url
        let encodedUri = encodeURIComponent(uri);
        console.log(`${localWebService_1.default.getEndpointUri(Interfaces.ContentType.Root)}?uri=${encodedUri}`);
        // Fix for issue #669 "Results Panel not Refreshing Automatically" - always include a unique time
        // so that the content returned is different. Otherwise VSCode will not refresh the document since it
        // thinks that there is nothing to be updated.
        let timeNow = new Date().getTime();
        return `
        <html>
        <head>
            <script type="text/javascript">
                window.onload = function(event) {
                    console.log('reloaded results window at time ${timeNow}ms');
                    var doc = document.documentElement;
                    var styles = window.getComputedStyle(doc);
                    var backgroundcolor = styles.getPropertyValue('--background-color');
                    var color = styles.getPropertyValue('--color');
                    var theme = document.body.className;
                    var url = "${localWebService_1.default.getEndpointUri(Interfaces.ContentType.Root)}?" +
                            "uri=${encodedUri}" +
                            "&theme=" + theme +
                            "&backgroundcolor=" + backgroundcolor +
                            "&color=" + color;
                    document.getElementById('frame').src = url;
                };

                // Dont't remove it! Receive message from extension continually to hold the webview lifecycle.
                window.addEventListener('message', event => {
                    console.log(event.data.result);
                });
            </script>
        </head>
        <body style="margin: 0; padding: 0; height: 100%; overflow: hidden;">
            <iframe id="frame" width="100%" height="100%" frameborder="0" style="position:absolute; left: 0; right: 0; bottom: 0; top: 0px;"/>
        </body>
        </html>`;
    }
    /**
     * Open a xml/json link - Opens the content in a new editor pane
     */
    openLink(content, columnName, linkType) {
        const self = this;
        if (linkType === 'xml') {
            try {
                content = pretty_data_1.pd.xml(content);
            }
            catch (e) {
                // If Xml fails to parse, fall back on original Xml content
            }
        }
        else if (linkType === 'json') {
            let jsonContent;
            try {
                jsonContent = JSON.parse(content);
            }
            catch (e) {
                // If Json fails to parse, fall back on original Json content
            }
            if (jsonContent) {
                // If Json content was valid and parsed, pretty print content to a string
                content = JSON.stringify(jsonContent, undefined, 4);
            }
        }
        vscode.workspace.openTextDocument({ language: linkType }).then((doc) => {
            vscode.window.showTextDocument(doc, 1, false).then(editor => {
                editor.edit(edit => {
                    edit.insert(new vscode.Position(0, 0), content);
                }).then(result => {
                    if (!result) {
                        self._vscodeWrapper.showErrorMessage('Error occurred opening content in editor.');
                    }
                });
            }, (error) => {
                self._vscodeWrapper.showErrorMessage(error);
            });
        }, (error) => {
            self._vscodeWrapper.showErrorMessage(error);
        });
    }
    /**
     * Return the query for a file uri
     */
    getQueryRunner(uri) {
        let resultsUri = this.getResultsUri(uri).toString();
        if (this._queryResultsMap.has(resultsUri)) {
            return this._queryResultsMap.get(resultsUri).queryRunner;
        }
        else {
            return undefined;
        }
    }
    // PRIVATE HELPERS /////////////////////////////////////////////////////
    /**
     * Generates a URI for the results pane. NOTE: this MUST be encoded using encodeURIComponent()
     * before outputting as part of a URI (ie, as a query param in an href)
     * @param srcUri    The URI for the source file where the SQL was executed from
     * @returns The URI for the results pane
     */
    getResultsUri(srcUri) {
        // NOTE: The results uri will be encoded when we parse it to a uri
        return vscode.Uri.parse(HiveOutputContentProvider.providerUri + srcUri).toString();
    }
    /**
     * Determines if the provided string is a results pane URI. This is done by checking the schema
     * at the front of the string against the provider uri
     */
    isResultsUri(srcUri) {
        return srcUri.startsWith(HiveOutputContentProvider.providerUri.toString());
    }
    /**
     * Returns which column should be used for a new result pane
     * @param isPreview  The boolean value of whether it is in preview mode.
     * @return ViewColumn to be used
     * public for testing purposes
     */
    newResultPaneViewColumn(queryUri, isPreview) {
        // Find configuration options
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName, queryUri);
        let splitPaneSelection = config[Constants.configSplitPaneSelection];
        let viewColumn;
        if (isPreview) {
            viewColumn = vscode.ViewColumn.Active;
        }
        else {
            switch (splitPaneSelection) {
                case 'current':
                    viewColumn = this._vscodeWrapper.activeTextEditor.viewColumn || vscode.ViewColumn.One;
                    break;
                case 'end':
                    viewColumn = vscode.ViewColumn.Three;
                    break;
                // default case where splitPaneSelection is next or anything else
                default:
                    if (this._vscodeWrapper.activeTextEditor.viewColumn === vscode.ViewColumn.One) {
                        viewColumn = vscode.ViewColumn.Two;
                    }
                    else {
                        viewColumn = vscode.ViewColumn.Three;
                    }
            }
        }
        return viewColumn;
    }
    // Exposing some variables for testing purposes only
    set setDisplayResultPane(implementation) {
        this.displayResultPane = implementation;
    }
    set setVscodeWrapper(wrapper) {
        this._vscodeWrapper = wrapper;
    }
    get getResultsMap() {
        return this._queryResultsMap;
    }
    set setResultsMap(setMap) {
        this._queryResultsMap = setMap;
    }
}
// CONSTANTS ///////////////////////////////////////////////////////////
HiveOutputContentProvider.providerName = 'hiveoutput';
HiveOutputContentProvider.providerUri = vscode.Uri.parse('hiveoutput://');
HiveOutputContentProvider.providerPreviewName = 'previewoutput';
exports.HiveOutputContentProvider = HiveOutputContentProvider;

//# sourceMappingURL=hiveOutputContentProvider.js.map
