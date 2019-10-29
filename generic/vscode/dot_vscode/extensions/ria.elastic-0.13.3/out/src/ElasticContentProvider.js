"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const Mustache = require("mustache");
const fs = require("fs");
class ElasticContentProvider {
    constructor() {
        this.contentUri = vscode.Uri.parse("elastic://results");
        this.changeEvent = new vscode.EventEmitter();
    }
    provideTextDocumentContent(uri, token) {
        let json = '';
        let plain = '';
        const config = vscode.workspace.getConfiguration();
        if (typeof this.results === "string" && this.results.startsWith('{')) {
            json = this.results;
        }
        else if (typeof this.results === "string" && this.results.indexOf('\n')) {
            plain = this.results.replace(/\n/g, "<br/>").replace(/\r/g, "<br/>");
        }
        else if (typeof this.results === "object") {
            json = JSON.stringify(this.results);
        }
        else {
            plain = this.results;
        }
        let mediaPath = this.getPath('media');
        let header = `<script src="${mediaPath}/json-formatter.js"></script>
                  <script src="${mediaPath}/jquery.min.js"></script>
                  <script src="${mediaPath}/jquery.contextMenu.js"></script>
                  <link rel="stylesheet" type="text/css" href="${mediaPath}/results.css">
                  <link rel="stylesheet" type="text/css" href="${mediaPath}/jquery.contextMenu.css">`;
        let err = '';
        if (this.statusCode != 200) {
            err = 'err';
        }
        if (this.statusCode == 0) {
            err = 'wait';
        }
        var data = fs.readFileSync(this.getPath('media/result.tmpl'), 'utf-8');
        var result = Mustache.render(data, {
            fontSize: config.get("editor.fontSize"),
            fontFamily: config.get("editor.fontFamily"),
            header: header,
            err: err,
            statusCode: this.statusCode,
            statusText: this.statusText,
            plain: plain,
            json: json,
            host: this.host,
            time: this.time
        });
        return result;
    }
    update(context, host, results, time_el, statusCode, statusText) {
        this.results = results;
        this.host = host;
        this.time = time_el;
        this.context = context;
        this.statusCode = statusCode;
        this.statusText = statusText;
        this.changeEvent.fire(this.contentUri);
    }
    getPath(p) {
        return path.join(this.context.extensionPath, p);
    }
    get onDidChange() {
        return this.changeEvent.event;
    }
}
exports.ElasticContentProvider = ElasticContentProvider;
//# sourceMappingURL=ElasticContentProvider.js.map