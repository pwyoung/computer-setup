'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// This code is originally from https://github.com/Microsoft/vscode-mssql
// License: https://github.com/Microsoft/vscode-mssql/blob/master/LICENSE.txt
// we made some changes based on the source code
const vscode = require("vscode");
const Constants = require("./../constants/constants");
const utils = require("../utils");
const logger_1 = require("../logger");
class VscodeWrapper {
    /**
     * Default constructor.
     */
    constructor() {
        if (typeof VscodeWrapper._outputChannel === 'undefined') {
            VscodeWrapper._outputChannel = logger_1.Logger.getLogger(Constants.outputChannelName).getChannel();
        }
    }
    /**
     * Get the current active text editor
     */
    // TODO: should unitize the return type of CurrentActiveEditor()
    get activeTextEditor() {
        const currentActiveEditor = utils.getCurrentActiveEditor();
        if (currentActiveEditor === null) {
            return undefined;
        }
        else {
            return currentActiveEditor;
        }
    }
    /**
     * get the current textDocument; any that are open?
     */
    get textDocuments() {
        return vscode.workspace.textDocuments;
    }
    /**
     * Parse uri
     */
    parseUri(uri) {
        return vscode.Uri.parse(uri);
    }
    /**
     * Get the URI string for the current active text editor
     */
    // TODO: should unitize the return type
    get activeTextEditorUri() {
        const currentActiveDoc = utils.getCurrentActiveDocument();
        if (currentActiveDoc === null) {
            return undefined;
        }
        else {
            return currentActiveDoc.uri.toString();
        }
    }
    /**
     * Create an output channel in vscode.
     */
    createOutputChannel(channelName) {
        return vscode.window.createOutputChannel(channelName);
    }
    /**
     * Get the configuration for a extensionName
     * @param extensionName The string name of the extension to get the configuration for
     * @param resource The optional URI, as a URI object or a string, to use to get resource-scoped configurations
     */
    getConfiguration(extensionName, resource) {
        if (typeof resource === 'string') {
            try {
                resource = this.parseUri(resource);
            }
            catch (e) {
                resource = undefined;
            }
        }
        return vscode.workspace.getConfiguration(extensionName, resource);
    }
    /**
     * @return 'true' if the active editor window has a .sql file, false otherwise
     */
    get isEditingHiveFile() {
        let sqlFile = false;
        let editor = this.activeTextEditor;
        if (editor) {
            if (editor.document.languageId === Constants.languageId) {
                sqlFile = true;
            }
        }
        return sqlFile;
    }
    /**
     * An event that is emitted when a [text document](#TextDocument) is disposed.
     */
    get onDidCloseTextDocument() {
        return vscode.workspace.onDidCloseTextDocument;
    }
    /**
     * An event that is emitted when a [text document](#TextDocument) is opened.
     */
    get onDidOpenTextDocument() {
        return vscode.workspace.onDidOpenTextDocument;
    }
    /**
     * An event that is emitted when a [text document](#TextDocument) is saved to disk.
     */
    get onDidSaveTextDocument() {
        return vscode.workspace.onDidSaveTextDocument;
    }
    /**
     * Opens the denoted document from disk. Will return early if the
     * document is already open, otherwise the document is loaded and the
     * [open document](#workspace.onDidOpenTextDocument)-event fires.
     * The document to open is denoted by the [uri](#Uri). Two schemes are supported:
     *
     * file: A file on disk, will be rejected if the file does not exist or cannot be loaded, e.g. `file:///Users/frodo/r.ini`.
     * untitled: A new file that should be saved on disk, e.g. `untitled:c:\frodo\new.js`. The language will be derived from the file name.
     *
     * Uris with other schemes will make this method return a rejected promise.
     *
     * @param uri Identifies the resource to open.
     * @return A promise that resolves to a [document](#TextDocument).
     * @see vscode.workspace.openTextDocument
     */
    openTextDocument(uri) {
        return vscode.workspace.openTextDocument(uri);
    }
    /**
     * Opens an untitled SQL document.
     * [open document](#workspace.onDidOpenTextDocument)-event fires.
     * The document to open is denoted by the [uri](#Uri). Two schemes are supported:
     *
     * Uris with other schemes will make this method return a rejected promise.
     *
     * @param uri Identifies the resource to open.
     * @return A promise that resolves to a [document](#TextDocument).
     * @see vscode.workspace.openTextDocument
     */
    openMsSqlTextDocument() {
        return vscode.workspace.openTextDocument({ language: 'sql' });
    }
    /**
     * Helper to log messages to "MSSQL" output channel.
     */
    logToOutputChannel(msg) {
        let date = new Date();
        if (msg instanceof Array) {
            msg.forEach(element => {
                VscodeWrapper._outputChannel.appendLine('[' + date.toLocaleTimeString() + '] ' + element.toString());
            });
        }
        else {
            VscodeWrapper._outputChannel.appendLine('[' + date.toLocaleTimeString() + '] ' + msg.toString());
        }
    }
    /**
     * Create a vscode.Range object
     * @param start The start position for the range
     * @param end The end position for the range
     */
    range(start, end) {
        return new vscode.Range(start, end);
    }
    /**
     * Create a vscode.Position object
     * @param line The line for the position
     * @param column The column for the position
     */
    position(line, column) {
        return new vscode.Position(line, column);
    }
    /**
     * Create a vscode.Selection object
     * @param start The start postion of the selection
     * @param end The end position of the selection
     */
    selection(start, end) {
        return new vscode.Selection(start, end);
    }
    /**
     * Formats and shows a vscode error message
     */
    showErrorMessage(msg, ...items) {
        return vscode.window.showErrorMessage(Constants.extensionName + ': ' + msg, ...items);
    }
    /**
     * Formats and shows a vscode information message
     */
    showInformationMessage(msg, ...items) {
        return vscode.window.showInformationMessage(Constants.extensionName + ': ' + msg, ...items);
    }
    /**
     * Show the given document in a text editor. A [column](#ViewColumn) can be provided
     * to control where the editor is being shown. Might change the [active editor](#window.activeTextEditor).
     *
     * @param document A text document to be shown.
     * @param column A view column in which the editor should be shown. The default is the [one](#ViewColumn.One), other values
     * are adjusted to be __Min(column, columnCount + 1)__.
     * @param preserveFocus When `true` the editor will not take focus.
     * @return A promise that resolves to an [editor](#TextEditor).
     */
    showTextDocument(document, column, preserveFocus) {
        return vscode.window.showTextDocument(document, column, preserveFocus);
    }
    /**
     * Formats and shows a vscode warning message
     */
    showWarningMessage(msg) {
        return vscode.window.showWarningMessage(Constants.extensionName + ': ' + msg);
    }
    /**
     * Returns a array of the text editors currently visible in the window
     */
    get visibleEditors() {
        return vscode.window.visibleTextEditors;
    }
    /**
     * Create an URI from a file system path. The [scheme](#Uri.scheme)
     * will be `file`.
     *
     * @param path A file system or UNC path.
     * @return A new Uri instance.
     * @see vscode.Uri.file
     */
    uriFile(path) {
        return vscode.Uri.file(path);
    }
    /**
     * Create an URI from a string. Will throw if the given value is not
     * valid.
     *
     * @param value The string value of an Uri.
     * @return A new Uri instance.
     * @see vscode.Uri.parse
     */
    uriParse(value) {
        return vscode.Uri.parse(value);
    }
    /**
     * The folder that is open in VS Code. `undefined` when no folder
     * has been opened.
     *
     * @readonly
     * @see vscode.workspace.rootPath
     */
    get workspaceRootPath() {
        return vscode.workspace.rootPath;
    }
}
exports.default = VscodeWrapper;

//# sourceMappingURL=vscodeWrapper.js.map
