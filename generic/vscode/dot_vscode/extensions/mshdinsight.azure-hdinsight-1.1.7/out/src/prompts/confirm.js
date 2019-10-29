'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// This code is originally from https://github.com/DonJayamanne/bowerVSCode
// License: https://github.com/DonJayamanne/bowerVSCode/blob/master/LICENSE
const vscode_1 = require("vscode");
const prompt_1 = require("./prompt");
const EscapeException_1 = require("../utils/EscapeException");
class ConfirmPrompt extends prompt_1.default {
    constructor(question) {
        super(question);
    }
    render() {
        let choices = {};
        choices['Yes'] = true;
        choices['No'] = false;
        const options = {
            placeHolder: this._question.message
        };
        return vscode_1.window.showQuickPick(Object.keys(choices), options)
            .then(result => {
            if (result === undefined) {
                throw new EscapeException_1.EscapeException();
            }
            return choices[result] || false;
        });
    }
}
exports.default = ConfirmPrompt;

//# sourceMappingURL=confirm.js.map
