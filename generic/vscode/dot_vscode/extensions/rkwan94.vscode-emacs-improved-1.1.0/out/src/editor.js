"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const killring_1 = require("./killring");
const registers_1 = require("./registers");
const sexp = require("./sexp");
const statusIndicator_1 = require("./statusIndicator");
class Editor {
    constructor() {
        this.abort = () => {
            this.status.setStatusBarMessage("Quit");
            this.status.deactivateTempModes();
        };
        this.markMode = () => this.status.isModeActive(statusIndicator_1.Mode.Mark);
        this.rectangleMarkMode = () => this.status.isModeActive(statusIndicator_1.Mode.RectangleMark);
        this.toggleMarkMode = () => {
            if (this.status.isModeActive(statusIndicator_1.Mode.Mark)) {
                vscode.commands.executeCommand("cancelSelection");
                this.status.deactivate(statusIndicator_1.Mode.Mark);
            }
            else {
                const currentPosition = vscode.window.activeTextEditor.selection.active;
                vscode.window.activeTextEditor.selection = new vscode.Selection(currentPosition, currentPosition);
                this.status.activate(statusIndicator_1.Mode.Mark);
            }
        };
        this.toggleRectangleMarkMode = () => {
            if (this.status.isModeActive(statusIndicator_1.Mode.RectangleMark)) {
                vscode.commands.executeCommand("cancelSelection");
                this.status.deactivate(statusIndicator_1.Mode.RectangleMark);
            }
            else {
                const currentPosition = vscode.window.activeTextEditor.selection.active;
                vscode.window.activeTextEditor.selection = new vscode.Selection(currentPosition, currentPosition);
                this.status.activate(statusIndicator_1.Mode.RectangleMark);
            }
        };
        this.toggleCuaMode = () => {
            this.status.toggleMode(statusIndicator_1.Mode.Cua);
        };
        this.validateCuaCommand = () => {
            if (this.status.isModeActive(statusIndicator_1.Mode.Cua)) {
                if (this.isRegion()) {
                    return true;
                }
                else {
                    this.status.setStatusBarMessage("Not in region", 2000);
                    return false;
                }
            }
            return true;
        };
        this.changeCase = (casing, type) => {
            const region = vscode.window.activeTextEditor.selection;
            let currentSelection;
            if (type === "position" && region.start.character === region.end.character) {
                const document = vscode.window.activeTextEditor.document;
                const range = document.getWordRangeAtPosition(region.start);
                currentSelection = {
                    text: document.getText(range),
                    range,
                };
            }
            else if (type === "region" && region.start.character !== region.end.character) {
                currentSelection = this.getSelectedText(region, vscode.window.activeTextEditor.document);
            }
            else {
                this.status.setStatusBarMessage("No region selected. Command aborted.");
                return;
            }
            const newText = casing === "upper" ? currentSelection.text.toUpperCase() :
                casing === "lower" ? currentSelection.text.toLowerCase() :
                    currentSelection.text.charAt(0).toUpperCase() + currentSelection.text.slice(1);
            vscode.window.activeTextEditor.edit(builder => {
                builder.replace(currentSelection.range, newText);
            });
        };
        this.isRegion = () => {
            const currRegion = vscode.window.activeTextEditor.selection;
            return !currRegion.start.isEqual(currRegion.end);
        };
        this.status = new statusIndicator_1.default();
        this.killRing = new killring_1.default();
        this.register = new registers_1.default();
        this.lastRectangularKill = null;
        this.lastKill = null;
        vscode.window.onDidChangeTextEditorSelection((event) => {
            if (this.lastKill) {
                const position = event.selections[0].isReversed ? event.selections[0].active : event.selections[0].anchor;
                if (!position.isEqual(this.lastKill)) {
                    this.lastKill = null;
                }
            }
        });
        vscode.window.onDidChangeActiveTextEditor(() => {
            this.lastKill = null;
        });
    }
    getSelectedText(selection, document) {
        let range;
        if (selection.start.line === selection.end.line && selection.start.character === selection.end.character) {
            return undefined;
        }
        else {
            range = new vscode.Range(selection.start, selection.end);
        }
        return {
            range,
            text: document.getText(range),
        };
    }
    getSelectionRange() {
        const selection = vscode.window.activeTextEditor.selection;
        const start = selection.start;
        const end = selection.end;
        return (start.character !== end.character || start.line !== end.line) ? new vscode.Range(start, end) : null;
    }
    getSelection() {
        const ed = vscode.window.activeTextEditor;
        let selection = null;
        // check if there is no selection
        if (ed.selection.isEmpty) {
            selection = ed.selection;
        }
        else {
            selection = ed.selections[0];
        }
        return selection;
    }
    setSelection(start, end) {
        const editor = vscode.window.activeTextEditor;
        editor.selection = new vscode.Selection(start, end);
    }
    goToNextSexp(activateMarkMode) {
        const ed = vscode.window.activeTextEditor;
        const startPos = this.getSelection();
        const nextPos = new vscode.Position(startPos.active.line, startPos.active.character + 1);
        const range = new vscode.Range(startPos.end, nextPos);
        const afterCursor = ed.document.getText(range);
        const whatAmI = sexp.sExpressionOrAtom(afterCursor);
        if (whatAmI === sexp.Expression.Atom) {
            vscode.commands.executeCommand("cursorWordRight").then(() => {
                if (activateMarkMode) {
                    const editor = vscode.window.activeTextEditor;
                    const pos = this.getSelection();
                    this.setSelection(startPos.start, pos.end);
                }
            });
        }
        else {
            vscode.commands.executeCommand("editor.action.jumpToBracket").then(() => {
                vscode.commands.executeCommand("cursorWordRight").then(() => {
                    if (activateMarkMode) {
                        const editor = vscode.window.activeTextEditor;
                        const pos = this.getSelection();
                        this.setSelection(startPos.start, pos.end);
                    }
                });
            });
        }
        // const newCursorPos = this.getSelection();
        // if (activateMarkMode) {
        //     this.setSelection(startPos.active, newCursorPos.active);
        // }
    }
    goToPrevSexp() {
        const ed = vscode.window.activeTextEditor;
        const line = ed.document.getText();
        const cursorPos = ed.selection.active.character;
        const afterCursor = line.substr(cursorPos);
        const whatAmI = sexp.sExpressionOrAtom(afterCursor);
        const placeholder = sexp.turnToSexp(line);
        if (whatAmI === sexp.Expression.Atom) {
            vscode.commands.executeCommand("cursorWordLeft");
        }
        else {
            vscode.commands.executeCommand("cursorWordLeft");
        }
    }
    /*
      * Behave like Emacs kill command
      */
    kill() {
        if (!this.validateCuaCommand()) {
            return;
        }
        const promises = [
            vscode.commands.executeCommand("emacs.exitMarkMode"),
            vscode.commands.executeCommand("cursorEndSelect"),
        ];
        Promise.all(promises).then(() => {
            const selection = this.getSelection();
            const range = new vscode.Range(selection.start, selection.end);
            const isKillRepeated = this.lastKill && range.start.isEqual(this.lastKill);
            this.setSelection(range.start, range.start);
            if (range.isEmpty) {
                this.killEndOfLine(isKillRepeated);
            }
            else {
                this.killText(range, isKillRepeated);
            }
            this.lastKill = range.start;
        });
    }
    killRegion() {
        const selection = this.getSelection();
        const range = new vscode.Range(selection.start, selection.end);
        if (!range.isEmpty) {
            this.killText(range, false);
        }
        this.lastKill = range.start;
    }
    copy() {
        if (!this.validateCuaCommand()) {
            return;
        }
        const range = vscode.window.activeTextEditor.selection;
        this.killRing.save(vscode.window.activeTextEditor.document.getText(range));
        vscode.commands.executeCommand("emacs.exitMarkMode");
    }
    yank() {
        if (!this.validateCuaCommand() || this.killRing.isEmpty()) {
            return;
        }
        vscode.window.activeTextEditor.edit((editBuilder) => {
            const topText = this.killRing.top();
            const currPos = vscode.window.activeTextEditor.selection.start;
            const textRange = new vscode.Range(currPos, currPos.translate({ characterDelta: topText.length }));
            editBuilder.insert(this.getSelection().active, topText);
            this.killRing.setLastInsertedRange(textRange);
        });
        this.lastKill = null;
    }
    yankPop() {
        if (this.killRing.isEmpty()) {
            return false;
        }
        const currentPosition = vscode.window.activeTextEditor.selection.active;
        const lastInsertionRange = this.killRing.getLastRange();
        if (!lastInsertionRange.end.isEqual(currentPosition)) {
            this.status.setStatusBarMessage("Previous command was not a yank.", 3000);
            return false;
        }
        vscode.window.activeTextEditor.edit((editBuilder) => {
            this.killRing.backward();
            const prevText = this.killRing.top();
            const oldInsertionPoint = this.killRing.getLastInsertionPoint();
            const newRange = new vscode.Range(oldInsertionPoint, oldInsertionPoint.translate({ characterDelta: prevText.length }));
            editBuilder.replace(this.killRing.getLastRange(), prevText);
            this.killRing.setLastInsertedRange(newRange);
        });
        return true;
    }
    undo() {
        vscode.commands.executeCommand("undo");
    }
    deleteBlankLines() {
        const doc = vscode.window.activeTextEditor.document;
        const promises = [];
        let selection = this.getSelection();
        let anchor = selection.anchor;
        let range = doc.lineAt(selection.start.line).range;
        let nextLine;
        if (range.isEmpty) {
            range = this.getFirstBlankLine(range);
            anchor = range.start;
            nextLine = range.start;
        }
        else {
            nextLine = range.start.translate(1, 0);
        }
        selection = new vscode.Selection(nextLine, nextLine);
        vscode.window.activeTextEditor.selection = selection;
        for (let line = selection.start.line; line < doc.lineCount - 1 && doc.lineAt(line).range.isEmpty; ++line) {
            promises.push(vscode.commands.executeCommand("deleteRight"));
        }
        Promise.all(promises).then(() => {
            vscode.window.activeTextEditor.selection = new vscode.Selection(anchor, anchor);
        });
    }
    setRMode() {
        this.status.deactivate(statusIndicator_1.Mode.RectangleMark);
        this.status.activate(statusIndicator_1.Mode.Register);
    }
    copyRectangle() {
        const selections = vscode.window.activeTextEditor.selections;
        let str = "";
        for (const s of selections) {
            const lineText = vscode.window.activeTextEditor.document.getText(s);
            str += `${lineText}\n`;
        }
        this.lastRectangularKill = str;
    }
    killRectangle() {
        const selections = vscode.window.activeTextEditor.selections;
        let str = "";
        const deletes = [];
        for (const s of selections) {
            const lineText = vscode.window.activeTextEditor.document.getText(s);
            str += `${lineText}\n`;
            const asRange = new vscode.Range(s.start, s.end);
            deletes.push(this.delete(asRange));
        }
        this.lastRectangularKill = str;
        Promise.all(deletes).then((value) => {
            const allTrue = value.reduce((prev, curr) => prev && curr);
            if (allTrue) {
                this.status.setStatusBarMessage("Rectangle Saved!", 5000);
            }
            else {
                this.status.setStatusBarMessage("Error saving rectangle", 5000);
            }
        });
    }
    yankRectangle() {
        if (!this.lastRectangularKill) {
            this.status.setStatusBarMessage("No rectangle has been saved", 4000);
            return;
        }
        vscode.window.activeTextEditor.edit((editBuilder) => {
            const currEditor = vscode.window.activeTextEditor;
            // more than one selection
            if (currEditor.selections.length > 1) {
                const rectKillAsLines = this.lastRectangularKill.split("\n");
                for (let i = 0; i < currEditor.selections.length; i++) {
                    editBuilder.replace(currEditor.selections[i], rectKillAsLines[i]);
                }
            }
            else {
                editBuilder.replace(currEditor.selection, this.lastRectangularKill);
            }
        });
    }
    onType(text) {
        let fHandled = false;
        switch (this.status.keybindingProgressMode()) {
            case statusIndicator_1.Mode.Register:
                switch (text) {
                    // Rectangles
                    case "r":
                        this.copyRectangle();
                        this.status.deactivate(statusIndicator_1.Mode.RectangleMark);
                        this.status.deactivate(statusIndicator_1.Mode.Register);
                        fHandled = true;
                        break;
                    case "k":
                        this.killRectangle();
                        this.status.deactivate(statusIndicator_1.Mode.RectangleMark);
                        this.status.deactivate(statusIndicator_1.Mode.Register);
                        fHandled = true;
                        break;
                    case "y":
                        this.yankRectangle();
                        this.status.deactivate(statusIndicator_1.Mode.RectangleMark);
                        this.status.deactivate(statusIndicator_1.Mode.Register);
                        fHandled = true;
                        break;
                    case "o":
                        this.status.setStatusBarMessage("'C-x r o' (Open rectangle) is not supported.");
                        this.status.deactivate(statusIndicator_1.Mode.Register);
                        fHandled = true;
                        break;
                    case "c":
                        this.status.setStatusBarMessage("'C-x r c' (Blank out rectangle) is not supported.");
                        this.status.deactivate(statusIndicator_1.Mode.Register);
                        fHandled = true;
                        break;
                    case "t":
                        this.status.setStatusBarMessage("'C-x r t' (prefix each line with a string) is not supported.");
                        this.status.toggleMode(statusIndicator_1.Mode.Register);
                        fHandled = true;
                        break;
                    // Registers
                    case "s":
                        this.status.setStatusBarPermanentMessage("Copy to register:");
                        this.status.setKeybindingProgress(statusIndicator_1.Mode.RegisterSave);
                        fHandled = true;
                        break;
                    case "i":
                        this.status.setStatusBarPermanentMessage("Insert register:");
                        this.status.setKeybindingProgress(statusIndicator_1.Mode.RegisterInsert);
                        fHandled = true;
                        break;
                    default:
                        break;
                }
                break;
            case statusIndicator_1.Mode.RegisterSave:
                this.status.setStatusBarPermanentMessage("");
                this.SaveTextToRegister(text);
                this.status.deactivateTempModes();
                fHandled = true;
                break;
            case statusIndicator_1.Mode.RegisterInsert:
                this.status.setStatusBarPermanentMessage("");
                this.RestoreTextFromRegister(text);
                this.status.deactivateTempModes();
                fHandled = true;
                break;
            case statusIndicator_1.Mode.NoKeyBinding:
            default:
                this.status.deactivateTempModes();
                this.status.setStatusBarPermanentMessage("");
                break;
        }
        if (!fHandled) {
            // default input handling: pass control to VSCode
            vscode.commands.executeCommand("default:type", {
                text,
            });
        }
    }
    SaveTextToRegister(registerName) {
        if (null === registerName) {
            return;
        }
        const range = this.getSelectionRange();
        if (range !== null) {
            const selectedText = vscode.window.activeTextEditor.document.getText(range);
            if (null !== selectedText) {
                this.register.saveTextToRegister(registerName, selectedText);
            }
        }
    }
    RestoreTextFromRegister(registerName) {
        this.status.deactivate(statusIndicator_1.Mode.Mark);
        const fromRegister = this.register.getTextFromRegister(registerName);
        if (fromRegister !== null) {
            vscode.window.activeTextEditor.edit((editBuilder) => {
                editBuilder.insert(this.getSelection().active, fromRegister);
            });
        }
        else {
            this.status.setStatusBarMessage("Register does not contain text.");
        }
    }
    killEndOfLine(killRepeated) {
        const currentCursorPosition = vscode.window.activeTextEditor.selection.active;
        vscode.commands.executeCommand("emacs.cursorEnd")
            .then(() => {
            const newCursorPos = vscode.window.activeTextEditor.selection.active;
            const rangeTillEnd = new vscode.Range(currentCursorPosition, newCursorPos);
            if (rangeTillEnd.isEmpty) {
                vscode.commands.executeCommand("editor.action.deleteLines").then(() => {
                    this.killRing.append("\n");
                });
            }
            return vscode.window.activeTextEditor.document.getText(rangeTillEnd);
        }).then((text) => {
            vscode.window.activeTextEditor.selection.active = currentCursorPosition;
            vscode.commands.executeCommand("deleteRight").then(() => {
                killRepeated ? this.killRing.append(text) : this.killRing.save(text);
            });
        });
        this.toggleMarkMode();
    }
    killText(range, killRepeated) {
        const text = vscode.window.activeTextEditor.document.getText(range);
        const promises = [
            this.delete(range),
        ];
        Promise.all(promises).then(() => {
            this.status.deactivate(statusIndicator_1.Mode.Mark);
            killRepeated ? this.killRing.append(text) : this.killRing.save(text);
        });
    }
    delete(range = null) {
        if (range === null) {
            const start = new vscode.Position(0, 0);
            const doc = vscode.window.activeTextEditor.document;
            const end = doc.lineAt(doc.lineCount - 1).range.end;
            range = new vscode.Range(start, end);
        }
        return vscode.window.activeTextEditor.edit((editBuilder) => {
            editBuilder.delete(range);
        });
    }
    getFirstBlankLine(range) {
        const doc = vscode.window.activeTextEditor.document;
        if (range.start.line === 0) {
            return range;
        }
        range = doc.lineAt(range.start.line - 1).range;
        while (range.start.line > 0 && range.isEmpty) {
            range = doc.lineAt(range.start.line - 1).range;
        }
        if (range.isEmpty) {
            return range;
        }
        else {
            return doc.lineAt(range.start.line + 1).range;
        }
    }
}
exports.Editor = Editor;
//# sourceMappingURL=editor.js.map