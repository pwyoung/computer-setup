'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// This code is originally from https://github.com/Microsoft/vscode-mssql
// License: https://github.com/Microsoft/vscode-mssql/blob/master/LICENSE.txt
// we made some changes based on the source code
const vscode = require("vscode");
const utils = require("../utils");
// Status bar element for each file in the editor
class FileStatusBar {
}
exports.FileStatusBar = FileStatusBar;
class StatusView {
    constructor() {
        this._statusBars = {};
        vscode.workspace.onDidCloseTextDocument((params) => this.onDidCloseTextDocument(params));
    }
    dispose() {
        for (let bar in this._statusBars) {
            if (this._statusBars.hasOwnProperty(bar)) {
                this._statusBars[bar].statusQuery.dispose();
                clearInterval(this._statusBars[bar].progressTimerId);
                delete this._statusBars[bar];
            }
        }
    }
    // Create status bar item if needed
    createStatusBar(fileUri) {
        let bar = new FileStatusBar();
        bar.statusQuery = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        this._statusBars[fileUri] = bar;
    }
    destroyStatusBar(fileUri) {
        let bar = this._statusBars[fileUri];
        if (bar) {
            if (bar.statusQuery) {
                bar.statusQuery.dispose();
            }
            if (bar.progressTimerId) {
                clearInterval(bar.progressTimerId);
            }
            delete this._statusBars[fileUri];
        }
    }
    getStatusBar(fileUri) {
        if (!(fileUri in this._statusBars)) {
            // Create it if it does not exist
            this.createStatusBar(fileUri);
        }
        let bar = this._statusBars[fileUri];
        if (bar.progressTimerId) {
            clearInterval(bar.progressTimerId);
        }
        return bar;
    }
    show(fileUri) {
        let bar = this.getStatusBar(fileUri);
        this.showStatusBarItem(fileUri, bar.statusQuery);
    }
    notConnected(fileUri) {
        // todo: delete
    }
    connecting(fileUri, connCreds) {
        let bar = this.getStatusBar(fileUri);
    }
    executingQuery(fileUri) {
        let bar = this.getStatusBar(fileUri);
        bar.statusQuery.command = undefined;
        bar.statusQuery.tooltip = 'Executing query';
        this.showStatusBarItem(fileUri, bar.statusQuery);
        this.showProgress(fileUri, 'Executing query ', bar.statusQuery);
    }
    executedQuery(fileUri) {
        let bar = this.getStatusBar(fileUri);
        bar.statusQuery.hide();
    }
    cancelingQuery(fileUri) {
        let bar = this.getStatusBar(fileUri);
        bar.statusQuery.hide();
        bar.statusQuery.command = undefined;
        bar.statusQuery.tooltip = 'Canceling query ';
        this.showStatusBarItem(fileUri, bar.statusQuery);
        this.showProgress(fileUri, 'Canceling query ', bar.statusQuery);
    }
    canceledQuery(fileUri) {
        let bar = this.getStatusBar(fileUri);
        bar.statusQuery.hide();
    }
    updateStatusMessage(newStatus, getCurrentStatus, updateMessage) {
        switch (newStatus) {
            case 'definitionRequestedStatus':
                setTimeout(() => {
                    if (getCurrentStatus() !== 'DefinitionRequestCompleted') {
                        updateMessage('Getting definition ...');
                    }
                }, 500);
                break;
            case 'DefinitionRequestCompleted':
                updateMessage('');
                break;
            default:
                break;
        }
    }
    /**
     * Associate a new uri with an existing Uri's status bar
     *
     * @param existingUri The already existing URI's status bar you want to associated
     * @param newUri The new URI you want to associate with the existing status bar
     * @return True or False whether the association was able to be made. False indicated the exitingUri specified
     * did not exist
     */
    associateWithExisting(existingUri, newUri) {
        let bar = this.getStatusBar(existingUri);
        if (bar) {
            this._statusBars[newUri] = bar;
            return true;
        }
        else {
            return false;
        }
    }
    hideLastShownStatusBar() {
        if (typeof this._lastShownStatusBar !== 'undefined') {
            this._lastShownStatusBar.statusQuery.hide();
        }
    }
    onDidCloseTextDocument(doc) {
        // Remove the status bar associated with the document
        this.destroyStatusBar(doc.uri.toString());
    }
    showStatusBarItem(fileUri, statusBarItem) {
        let currentOpenFile = utils.getActiveTextEditorUri();
        // Only show the status bar if it matches the currently open file and is not empty
        if (fileUri === currentOpenFile && !utils.isEmpty(statusBarItem.text)) {
            statusBarItem.show();
            if (fileUri in this._statusBars) {
                this._lastShownStatusBar = this._statusBars[fileUri];
            }
        }
        else {
            statusBarItem.hide();
        }
    }
    showProgress(fileUri, statusText, statusBarItem) {
        const self = this;
        let index = 0;
        let progressTicks = ['|', '/', '-', '\\'];
        let bar = this.getStatusBar(fileUri);
        bar.progressTimerId = setInterval(() => {
            index++;
            if (index > 3) {
                index = 0;
            }
            let progressTick = progressTicks[index];
            statusBarItem.text = statusText + ' ' + progressTick;
            self.showStatusBarItem(fileUri, statusBarItem);
        }, 200);
    }
}
exports.StatusView = StatusView;

//# sourceMappingURL=statusView.js.map
