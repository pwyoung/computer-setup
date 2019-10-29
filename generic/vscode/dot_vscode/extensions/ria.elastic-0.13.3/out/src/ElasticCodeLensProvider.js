"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const ElasticDecoration_1 = require("./ElasticDecoration");
const ElasticMatches_1 = require("./ElasticMatches");
class ElasticCodeLensProvider {
    constructor(context) {
        this.context = context;
        this.decoration = new ElasticDecoration_1.ElasticDecoration(context);
    }
    provideCodeLenses(document, _token) {
        var esMatches = new ElasticMatches_1.ElasticMatches(vscode.window.activeTextEditor);
        var ret = [];
        esMatches.Matches.forEach(em => {
            if (em.Error.Text == null) {
                ret.push(new vscode.CodeLens(em.Method.Range, {
                    title: "▶ Run Query",
                    command: "elastic.execute",
                    arguments: [em]
                }));
                if (em.HasBody) {
                    var command = {
                        title: "⚡Auto indent",
                        command: "elastic.lint",
                        arguments: [em]
                    };
                    if (em.File && em.File.Text) {
                        command = {
                            title: "📂Open File",
                            command: "elastic.open",
                            arguments: [em]
                        };
                    }
                    ret.push(new vscode.CodeLens(em.Method.Range, command));
                }
            }
            else {
                if (em.File) {
                    command = {
                        title: "⚠️File NotExist",
                        command: "",
                        arguments: undefined
                    };
                    if (em.File.Text) {
                        command = {
                            title: "⚠️Invalid JsonFile",
                            command: "",
                            arguments: undefined
                        };
                    }
                    ret.push(new vscode.CodeLens(em.Method.Range, command));
                }
                else if (em.Error.Text != null) {
                    ret.push(new vscode.CodeLens(em.Method.Range, {
                        title: "⚠️Invalid Json",
                        command: ""
                    }));
                }
            }
        });
        return ret;
    }
}
exports.ElasticCodeLensProvider = ElasticCodeLensProvider;
//# sourceMappingURL=ElasticCodeLensProvider.js.map