"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const vscode = require("vscode");
class QuickPickItemWrapper {
}
exports.QuickPickItemWrapper = QuickPickItemWrapper;
class PickUpManager {
    pickUpPreparedItems(prepared, placeHolder, previous = []) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = {
                placeHolder: placeHolder,
                matchOnDescription: true,
                matchOnDetail: true,
                onDidSelectItem: (item) => {
                    // too long to show in quickPickUp
                    if (typeof item == "string" && item.length > 100) {
                        vscode.window.showInformationMessage(item);
                    }
                },
            };
            previous = previous.concat(prepared);
            const q = previous.map((d) => d.quickPickItem);
            if (q.length == 1) {
                return { picked: q[0], collection: previous };
            }
            let pickedItem = yield vscode.window.showQuickPick(Promise.resolve(q), options);
            return { picked: pickedItem, collection: previous };
        });
    }
}
exports.PickUpManager = PickUpManager;
class WorkspaceFolderSelector extends PickUpManager {
    pick(placeHolder) {
        return __awaiter(this, void 0, void 0, function* () {
            let workingFolders = vscode.workspace.workspaceFolders;
            if (workingFolders) {
                let toBeselect = workingFolders.map((f) => {
                    return { quickPickItem: { label: f.name, description: f.uri.toString() }, obj: f };
                });
                return this.pickUpPreparedItems(toBeselect, placeHolder, []);
            }
            return this.pickUpPreparedItems([], "Your workspace folder list is empty", []);
        });
    }
}
exports.WorkspaceFolderSelector = WorkspaceFolderSelector;
class FileSelector extends PickUpManager {
    pick(dirPath, placeHolder, postfix) {
        return __awaiter(this, void 0, void 0, function* () {
            let projectFiles = fs.readdirSync(dirPath);
            if (projectFiles) {
                let toBeselect = projectFiles.map((f) => {
                    return { quickPickItem: { label: f, description: f }, obj: f };
                }).filter(f => f.obj.toLowerCase().endsWith(postfix.toLowerCase()));
                return this.pickUpPreparedItems(toBeselect, placeHolder, []);
            }
            return this.pickUpPreparedItems([], "Your folder is empty", []);
        });
    }
}
exports.FileSelector = FileSelector;
function selectWorkspaceFolder(placeHolder) {
    return __awaiter(this, void 0, void 0, function* () {
        let workspaceFolderSelector = new WorkspaceFolderSelector();
        let result = yield workspaceFolderSelector.pick(placeHolder);
        if (result) {
            let selectedItem = result.collection.find((i) => i.quickPickItem === result.picked);
            if (selectedItem) {
                return vscode.workspace.getWorkspaceFolder(selectedItem.obj.uri);
            }
        }
        return undefined;
    });
}
exports.selectWorkspaceFolder = selectWorkspaceFolder;
function selectSpecifiedFiles(dirPath, placeHolder, postfix) {
    return __awaiter(this, void 0, void 0, function* () {
        let fileSelector = new FileSelector();
        let result = yield fileSelector.pick(dirPath, placeHolder, postfix);
        if (result) {
            let selectedItem = result.collection.find((i) => i.quickPickItem === result.picked);
            if (selectedItem) {
                return selectedItem.obj;
            }
        }
        return undefined;
    });
}
exports.selectSpecifiedFiles = selectSpecifiedFiles;

//# sourceMappingURL=pickUpManager.js.map
