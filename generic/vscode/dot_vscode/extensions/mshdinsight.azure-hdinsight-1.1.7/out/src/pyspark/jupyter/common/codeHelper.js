"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cellHelper_1 = require("./cellHelper");
const utils_1 = require("../../../utils");
class CodeHelper {
    constructor(cellCodeLenses) {
        this.cellCodeLenses = cellCodeLenses;
        this.cellHelper = new cellHelper_1.CellHelper(cellCodeLenses);
    }
    getActiveCell() {
        return new Promise((resolve, reject) => {
            this.cellHelper.getActiveCell().then(info => {
                if (info && info.cell) {
                    resolve(info.cell);
                }
                else {
                    resolve(utils_1.nullValue());
                }
            }, reason => reject(reason));
        });
    }
    getSelectedCode() {
        const activeEditor = utils_1.getCurrentActiveEditor();
        if (!activeEditor || !activeEditor.document) {
            return Promise.resolve('');
        }
        if (activeEditor.selection.isEmpty) {
            return Promise.resolve(activeEditor.document.lineAt(activeEditor.selection.start.line).text);
        }
        else {
            return Promise.resolve(activeEditor.document.getText(activeEditor.selection));
        }
    }
}
exports.CodeHelper = CodeHelper;

//# sourceMappingURL=codeHelper.js.map
