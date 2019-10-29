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
const vscode = require("vscode");
exports.ensureTerminalExists = () => {
    if (vscode.window.terminals.length === 0) {
        vscode.window.showErrorMessage("No active terminals");
        return false;
    }
    return true;
};
exports.selectTerminal = () => __awaiter(this, void 0, void 0, function* () {
    const terminals = vscode.window.terminals;
    if (terminals.length === 1) {
        return terminals[0];
    }
    const items = vscode.window.terminals.map((terminal, index) => ({
        label: `${index + 1}: ${terminal.name}`,
        terminal: terminal
    }));
    const item = yield vscode.window.showQuickPick(items);
    return item ? item.terminal : undefined;
});
//# sourceMappingURL=terminal.js.map