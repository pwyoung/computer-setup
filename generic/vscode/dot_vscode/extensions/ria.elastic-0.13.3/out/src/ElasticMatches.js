"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ElasticMatch_1 = require("./ElasticMatch");
class ElasticMatches {
    constructor(editor) {
        if (!editor) {
            console.error("updateDecorations(): no active text editor.");
            this.Matches = [];
            return;
        }
        this.Editor = editor;
        this.Matches = [];
        var matched = false;
        for (var i = 0; i < editor.document.lineCount; i++) {
            var line = editor.document.lineAt(i);
            var trimedLine = line.text.trim();
            if (trimedLine.length == 0)
                continue;
            if (matched && trimedLine.startsWith('{'))
                this.Matches[this.Matches.length - 1].HasBody = true;
            matched = false;
            var match = ElasticMatch_1.ElasticMatch.RegexMatch.exec(line.text);
            if (match != null) {
                matched = true;
                let em = new ElasticMatch_1.ElasticMatch(line, match);
                this.Matches.push(em);
            }
        }
        this.UpdateSelection(editor);
    }
    UpdateSelection(editor) {
        this.Editor = editor;
        this.Matches.forEach(element => {
            element.Selected = element.Range.contains(editor.selection);
            if (element.Selected)
                this.Selection = element;
        });
    }
}
exports.ElasticMatches = ElasticMatches;
//# sourceMappingURL=ElasticMatches.js.map