'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const Asciidoctor = require("asciidoctor.js");
class AsciidocProvider {
    constructor() {
        this._onDidChange = new vscode_1.EventEmitter();
        this.asciidoctor = Asciidoctor();
    }
    isAsciidocEditor(editor) {
        return editor && this.isAsciidocDocument(editor.document);
    }
    isAsciidocDocument(document) {
        return document && document.languageId === "asciidoc";
    }
    provideTextDocumentContent(uri) {
        let editor = vscode_1.window.activeTextEditor;
        if (!this.isAsciidocEditor(editor)) {
            if (this.lastPreviewHTML) {
                return this.lastPreviewHTML;
            }
            return this.errorSnippet("Active editor doesn't show an AsciiDoc document - no properties to preview.");
        }
        return new Promise((resolve, reject) => {
            this.lastPreviewHTML = this.asciidoctor.convert(editor.document.getText());
            resolve(this.lastPreviewHTML);
            console.log(this.lastPreviewHTML);
        });
    }
    update(uri) {
        this._onDidChange.fire(uri);
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    errorSnippet(error) {
        return `
                <body>
                    <h1>
                    ${error}
                    </h1>
                </body>`;
    }
}
AsciidocProvider.scheme = 'asciidoc-preview';
exports.default = AsciidocProvider;
//# sourceMappingURL=asciidocProvider.js.map