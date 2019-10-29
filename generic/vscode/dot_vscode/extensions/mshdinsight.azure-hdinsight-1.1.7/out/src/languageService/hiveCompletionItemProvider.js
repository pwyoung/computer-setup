'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
class HiveCompletionItemProvider {
    constructor(server, action) {
        this.symbolTypeDic = {
            'TypeCode2': vscode_1.CompletionItemKind.Keyword,
            'TypeCode3': vscode_1.CompletionItemKind.Reference,
            'TypeCode11': vscode_1.CompletionItemKind.Function,
            'TypeCode12': vscode_1.CompletionItemKind.Reference
        };
        this.symbolTypeDescriptionDic = {
            'TypeCode2': 'Keyword',
            'TypeCode3': 'ColumnName',
            'TypeCode11': 'Function',
            'TypeCode12': 'TableName'
        };
        this._server = server;
        this._action = action;
    }
    provideCompletionItems(document, position, token) {
        let completionRequest = this.constructRequest(document, position);
        console.log(completionRequest);
        return new Promise((resolve, reject) => {
            this._server.makeRequest(completionRequest, this._action).then((response) => {
                let result = this.processResponse(response);
                return resolve(result);
            });
        });
    }
    constructRequest(document, position) {
        let hqlScriptPath = document.uri.fsPath;
        let hqlTextContent = document.getText();
        let hqlOffsetPosition = document.offsetAt(position);
        let completionRequest = {
            Path: hqlScriptPath,
            Source: hqlTextContent,
            Pos: (hqlOffsetPosition + 1).toString(),
            Token: hqlTextContent.substring(hqlOffsetPosition - 1, hqlOffsetPosition)
        };
        return completionRequest;
    }
    processResponse(response) {
        var completionList = [];
        if (response !== null) {
            response.forEach(element => {
                var typeCode = 'TypeCode' + element.Type.toString();
                if (this.symbolTypeDic[typeCode] !== null) {
                    let item = new vscode_1.CompletionItem(element.Text);
                    item.kind = this.symbolTypeDic[typeCode];
                    item.detail = this.symbolTypeDescriptionDic[typeCode];
                    item.insertText = element.Text;
                    completionList.push(item);
                }
            });
        }
        return completionList;
    }
}
exports.HiveCompletionItemProvider = HiveCompletionItemProvider;

//# sourceMappingURL=hiveCompletionItemProvider.js.map
