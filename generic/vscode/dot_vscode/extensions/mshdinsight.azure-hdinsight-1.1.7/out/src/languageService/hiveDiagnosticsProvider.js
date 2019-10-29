'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const hiveServer_1 = require("./hiveServer");
class HiveDiagnosticsProvider {
    constructor(server, action) {
        this._diagnostics = vscode_1.languages.createDiagnosticCollection('hql');
        this._server = server;
        this._action = action;
        vscode_1.workspace.onDidChangeTextDocument(event => this._onDocumentChange(event), this);
    }
    dispose() {
        // empty  
    }
    _onDocumentChange(event) {
        console.log(`diagnostics:${event.document.fileName}`);
        if (event.document.languageId === 'hql' && event.document.uri.scheme === 'file') {
            setTimeout(() => this.validateTextDocument(event), 3000);
        }
    }
    validateTextDocument(event) {
        let diagnostics = [];
        let errorRequest = this.constructRequest(event);
        this._server.makeRequest(errorRequest, this._action).then(response => {
            if (response !== null) {
                response.forEach(e => {
                    let errorRange = new vscode_1.Range(new vscode_1.Position(e.Location.StartLine - 1, e.Location.StartColumn), new vscode_1.Position(e.Location.EndLine - 1, e.Location.EndColumn));
                    diagnostics.push({
                        severity: vscode_1.DiagnosticSeverity.Error,
                        range: errorRange,
                        message: e.Message,
                        source: 'hiveServer',
                        code: 0
                    });
                });
            }
            else {
                // clear the diagnostics
            }
            this._diagnostics.set(event.document.uri, diagnostics);
        });
    }
    constructRequest(event) {
        let textContent = event.document.getText();
        let scriptPath = event.document.uri.fsPath;
        let errorRequest = {
            Path: scriptPath,
            Source: textContent
        };
        return errorRequest;
    }
}
exports.HiveDiagnosticsProvider = HiveDiagnosticsProvider;
function reportDiagnostics() {
    return new HiveDiagnosticsProvider(new hiveServer_1.HiveServer(), '/GetErrorList');
}
exports.reportDiagnostics = reportDiagnostics;

//# sourceMappingURL=hiveDiagnosticsProvider.js.map
