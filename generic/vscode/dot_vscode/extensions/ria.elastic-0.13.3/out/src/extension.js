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
const vscode = require("vscode");
const request = require("request");
const url = require("url");
const path = require("path");
const fs = require("fs");
const os = require("os");
const ElasticCompletionItemProvider_1 = require("./ElasticCompletionItemProvider");
const ElasticCodeLensProvider_1 = require("./ElasticCodeLensProvider");
const ElasticContentProvider_1 = require("./ElasticContentProvider");
const ElasticDecoration_1 = require("./ElasticDecoration");
const ElasticMatches_1 = require("./ElasticMatches");
const stripJsonComments = require("strip-json-comments");
// import { JSONCompletionItemProvider } from "./JSONCompletionItemProvider";
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        context.workspaceState.get("elastic.host", null) || (yield setHost(context));
        const languages = ['es'];
        context.subscriptions.push(vscode.languages.registerCodeLensProvider(languages, new ElasticCodeLensProvider_1.ElasticCodeLensProvider(context)));
        // let provider = new JSONCompletionItemProvider();
        // provider.init().then((result) => {
        //     if (!result.success) {
        //         console.log(`CompletionItemProvider init failed: ${(result.error.message)}`);
        //         vscode.window.showErrorMessage('Something went wrong. Please see the console!');
        //     }
        //     else {
        //         console.log(`CompletionItemProvider successfully loaded ${provider.count} items from '${provider.filepath}'.`);
        //         vscode.window.showInformationMessage('Ready!');
        //         context.subscriptions.push(vscode.languages.registerCompletionItemProvider(languages, provider));
        //     }
        // });
        let resultsProvider = new ElasticContentProvider_1.ElasticContentProvider();
        const registration = vscode.workspace.registerTextDocumentContentProvider("elastic", resultsProvider);
        const previewUri = "elastic://results";
        // vscode.languages.registerCompletionItemProvider('es', {
        //     provideCompletionItems(document, position, token) {
        //         // return [new vscode.CompletionItem('Hello World')];
        //         var g = document.lineAt(position.line).text[position.character - 1];
        //         return null;
        //     }
        // });
        let esMatches;
        let decoration;
        function checkEditor(document) {
            if (document === vscode.window.activeTextEditor.document && document.languageId == 'es') {
                if (esMatches == null || decoration == null) {
                    esMatches = new ElasticMatches_1.ElasticMatches(vscode.window.activeTextEditor);
                    decoration = new ElasticDecoration_1.ElasticDecoration(context);
                }
                return true;
            }
            return false;
        }
        if (checkEditor(vscode.window.activeTextEditor.document)) {
            esMatches = new ElasticMatches_1.ElasticMatches(vscode.window.activeTextEditor);
            decoration.UpdateDecoration(esMatches);
        }
        vscode.workspace.onDidChangeTextDocument((e) => {
            if (checkEditor(e.document)) {
                esMatches = new ElasticMatches_1.ElasticMatches(vscode.window.activeTextEditor);
                decoration.UpdateDecoration(esMatches);
            }
        });
        vscode.workspace.onDidChangeConfiguration((e) => {
            //vscode.window.showInformationMessage('Ready!');
        });
        vscode.window.onDidChangeTextEditorSelection((e) => {
            if (checkEditor(e.textEditor.document)) {
                esMatches.UpdateSelection(e.textEditor);
                decoration.UpdateDecoration(esMatches);
            }
        });
        let esCompletionHover = new ElasticCompletionItemProvider_1.ElasticCompletionItemProvider(context);
        context.subscriptions.push(vscode.languages.registerCompletionItemProvider(languages, esCompletionHover, '/', '?', '&', '"'));
        context.subscriptions.push(vscode.languages.registerHoverProvider(languages, esCompletionHover));
        context.subscriptions.push(vscode.commands.registerCommand('elastic.execute', (em) => {
            if (!em) {
                em = esMatches.Selection;
            }
            executeQuery(context, resultsProvider, em);
        }));
        context.subscriptions.push(vscode.commands.registerCommand('elastic.setHost', () => {
            setHost(context);
        }));
        vscode.commands.registerCommand('extension.setClip', (uri, query) => {
            var ncp = require("copy-paste");
            ncp.copy(query, function () {
                vscode.window.showInformationMessage("Copied to clipboard");
            });
        });
        context.subscriptions.push(vscode.commands.registerCommand('elastic.open', (em) => {
            var column = 0;
            let uri = vscode.Uri.file(em.File.Text);
            return vscode.workspace.openTextDocument(uri)
                .then(textDocument => vscode.window.showTextDocument(textDocument, column ? column > vscode.ViewColumn.Three ? vscode.ViewColumn.One : column : undefined, true));
        }));
        context.subscriptions.push(vscode.commands.registerCommand('elastic.lint', (em) => {
            try {
                let l = em.Method.Range.start.line + 1;
                const editor = vscode.window.activeTextEditor;
                const config = vscode.workspace.getConfiguration('editor');
                const tabSize = +config.get('tabSize');
                editor.edit(editBuilder => {
                    if (em.HasBody) {
                        let txt = editor.document.getText(em.Body.Range);
                        editBuilder.replace(em.Body.Range, JSON.stringify(JSON.parse(em.Body.Text), null, tabSize));
                    }
                });
            }
            catch (error) {
                console.log(error.message);
            }
        }));
    });
}
exports.activate = activate;
function setHost(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let options;
        const host = yield vscode.window.showInputBox({
            prompt: "Please enter the elastic host",
            ignoreFocusOut: true,
            value: context.workspaceState.get("elastic.host", "localhost:9200")
        });
        context.workspaceState.update("elastic.host", host);
        return new Promise((resolve) => resolve(host));
    });
}
function executeQuery(context, resultsProvider, em) {
    return __awaiter(this, void 0, void 0, function* () {
        var host = context.workspaceState.get("elastic.host", null) || (yield setHost(context));
        const parsedPath = em.Path.Text.split('?');
        const urlParams = parsedPath[1] ? '?' + parsedPath[1] : '';
        var protocol = 'http';
        var regex = RegExp(/^(https?):\/\/(.+)*$/gim);
        var match = regex.exec(host);
        if (match != null) {
            protocol = match[1];
            host = match[2];
        }
        const requestUrl = url.format({
            host,
            pathname: parsedPath[0],
            protocol: protocol
        }) + urlParams;
        const startTime = new Date().getTime();
        const config = vscode.workspace.getConfiguration();
        var asDocument = config.get("elastic.showResultAsDocument");
        if (!asDocument) {
            vscode.commands.executeCommand("vscode.previewHtml", resultsProvider.contentUri, vscode.ViewColumn.Two, 'ElasticSearch Query');
            resultsProvider.update(context, host, '', startTime, 0, 'Executing query ...');
        }
        const sbi = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        sbi.text = "$(search) Executing query ...";
        sbi.show();
        request({
            url: requestUrl,
            method: em.Method.Text,
            body: stripJsonComments(em.Body.Text),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }, (error, response, body) => {
            sbi.dispose();
            const endTime = new Date().getTime();
            if (error) {
                if (asDocument) {
                    vscode.window.showErrorMessage(error.message);
                }
                else {
                    resultsProvider.update(context, host, null, endTime - startTime, -1, error.message);
                    vscode.commands.executeCommand("vscode.previewHtml", resultsProvider.contentUri, vscode.ViewColumn.Two, 'ElasticSearch Results');
                }
            }
            else {
                let results = body;
                if (asDocument) {
                    try {
                        const config = vscode.workspace.getConfiguration('editor');
                        const tabSize = +config.get('tabSize');
                        results = JSON.stringify(JSON.parse(results), null, tabSize);
                    }
                    catch (error) {
                        results = body;
                    }
                    showResult(results, vscode.window.activeTextEditor.viewColumn + 1);
                }
                else {
                    resultsProvider.update(context, host, results, endTime - startTime, response.statusCode, response.statusMessage);
                    vscode.commands.executeCommand("vscode.previewHtml", resultsProvider.contentUri, vscode.ViewColumn.Two, 'ElasticSearch Results');
                }
            }
        });
    });
}
exports.executeQuery = executeQuery;
function showResult(result, column) {
    const tempResultFilePath = path.join(os.homedir(), '.vscode-elastic');
    const resultFilePath = vscode.workspace.rootPath || tempResultFilePath;
    let uri = vscode.Uri.file(path.join(resultFilePath, 'result.json'));
    if (!fs.existsSync(uri.fsPath)) {
        uri = uri.with({ scheme: 'untitled' });
    }
    return vscode.workspace.openTextDocument(uri)
        .then(textDocument => vscode.window.showTextDocument(textDocument, column ? column > vscode.ViewColumn.Three ? vscode.ViewColumn.One : column : undefined, true))
        .then(editor => {
        editor.edit(editorBuilder => {
            if (editor.document.lineCount > 0) {
                const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
                editorBuilder.delete(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(lastLine.range.start.line, lastLine.range.end.character)));
            }
            editorBuilder.insert(new vscode.Position(0, 0), result);
        });
    });
}
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map