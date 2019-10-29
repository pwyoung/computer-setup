'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const asciidocProvider_1 = require("./asciidocProvider");
const path = require("path");
function activate(context) {
    const provider = new asciidocProvider_1.default();
    const previewTitle = path.basename(vscode_1.window.activeTextEditor.document.fileName);
    const previewUri = vscode_1.Uri.parse(`${asciidocProvider_1.default.scheme}://${previewTitle}`);
    vscode_1.workspace.onDidChangeTextDocument((e) => {
        if (provider.isAsciidocDocument(e.document)) {
            provider.update(previewUri);
        }
    });
    vscode_1.workspace.onDidSaveTextDocument((e) => {
        if (provider.isAsciidocDocument(e)) {
            provider.update(previewUri);
        }
    });
    const registration = vscode_1.workspace.registerTextDocumentContentProvider(asciidocProvider_1.default.scheme, provider);
    const previewToSide = vscode_1.commands.registerCommand("asciidoc.previewToSide", () => {
        let displayColumn;
        switch (vscode_1.window.activeTextEditor.viewColumn) {
            case vscode_1.ViewColumn.One:
                displayColumn = vscode_1.ViewColumn.Two;
                break;
            case vscode_1.ViewColumn.Two:
            case vscode_1.ViewColumn.Three:
                displayColumn = vscode_1.ViewColumn.Three;
                break;
        }
        return vscode_1.commands.executeCommand("vscode.previewHtml", previewUri, displayColumn, previewTitle)
            .then((success) => { }, (reason) => {
            console.warn(reason);
            vscode_1.window.showErrorMessage(reason);
        });
    });
    const preview = vscode_1.commands.registerCommand("asciidoc.preview", () => {
        return vscode_1.commands.executeCommand("vscode.previewHtml", previewUri, vscode_1.window.activeTextEditor.viewColumn, previewTitle)
            .then((success) => { }, (reason) => {
            console.warn(reason);
            vscode_1.window.showErrorMessage(reason);
        });
    });
    context.subscriptions.push(registration, previewToSide, preview);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map