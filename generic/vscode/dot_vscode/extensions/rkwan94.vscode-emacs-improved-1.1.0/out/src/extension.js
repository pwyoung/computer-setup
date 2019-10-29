"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const operation_1 = require("./operation");
function activate(context) {
    const op = new operation_1.Operation();
    const commandList = [
        "abortCommand",
        // Edit
        "kill",
        "killRegion",
        "killRingSave",
        "yank",
        "yankPop",
        "C-x_C-o",
        "undo",
        // R-Mode
        "listenForRegisterCmds",
        // S-expression movement
        "C-M-f",
        "C-M-b",
        "C-M-Space",
        // Case changes
        "uppercaseRegion",
        "lowercaseRegion",
        "uppercaseWord",
        "lowercaseWord",
        "capitaliseWord",
        "cuaCut",
        "cuaPaste",
        "cuaCopy",
        "toggleCuaMode",
        "enterMarkMode",
        "exitMarkMode",
        "enterRectangleMarkMode",
        "exitRectangleMarkMode",
    ];
    const cursorMoves = [
        "cursorUp", "cursorDown", "cursorLeft", "cursorRight",
        "cursorHome", "cursorEnd",
        "cursorWordLeft", "cursorWordRight",
        "cursorPageUp", "cursorPageDown", "cursorTop", "cursorBottom",
    ];
    commandList.forEach(commandName => {
        context.subscriptions.push(registerCommand(commandName, op));
    });
    cursorMoves.forEach(element => {
        context.subscriptions.push(vscode.commands.registerCommand("emacs." + element, () => {
            let cmd = element;
            if (op.editor.markMode()) {
                cmd += "Select";
            }
            else if (op.editor.rectangleMarkMode()) {
                if (element === "cursorUp") {
                    cmd = "editor.action.insertCursorAbove";
                }
                else if (element === "cursorDown") {
                    cmd = "editor.action.insertCursorBelow";
                }
                else {
                    cmd += "Select";
                }
            }
            vscode.commands.executeCommand(cmd);
        }));
    });
    // 'type' is not an "emacs." command and should be registered separately
    context.subscriptions.push(vscode.commands.registerCommand("type", args => {
        if (!vscode.window.activeTextEditor) {
            return;
        }
        op.onType(args.text);
    }));
}
exports.activate = activate;
// export function deactivate(): void {
// }
function registerCommand(commandName, op) {
    return vscode.commands.registerCommand("emacs." + commandName, op.getCommand(commandName));
}
//# sourceMappingURL=extension.js.map