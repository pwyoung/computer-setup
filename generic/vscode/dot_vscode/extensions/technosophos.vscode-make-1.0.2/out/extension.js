'use strict';
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
const child_process_1 = require("child_process");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    const subscriptions = [
        vscode.commands.registerCommand('extension.runMake', runMake),
        vscode.commands.registerCommand('extension.runMakeByTarget', runMakeByTarget)
    ];
    subscriptions.forEach((sub) => { context.subscriptions.push(sub); });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
// Prompt user to enter a target, then run that target.
function runMake() {
    return __awaiter(this, void 0, void 0, function* () {
        const target = yield vscode.window.showInputBox({
            prompt: "target"
        });
        if (target === undefined) {
            return;
        }
        // If there are not targets, we want targets to be empty, not an array with an empty string.
        let targets = [];
        target.split(" ").forEach((t) => { targets.push(t); });
        make(targets);
    });
}
// Call make with a list of targets. An empty list runs the default.
function make(targets) {
    let make = child_process_1.spawn('make', targets, {
        cwd: vscode.workspace.rootPath
    });
    make.on("close", (code) => {
        if (code > 0) {
            vscode.window.showErrorMessage("make failed");
            return;
        }
        vscode.window.showInformationMessage("make is done");
    });
    make.stdout.on("data", (data) => {
        console.log(data.toString());
    });
    make.stderr.on("data", (data) => {
        console.error(data.toString());
    });
}
// List the targets, and run the selected target
function runMakeByTarget() {
    return __awaiter(this, void 0, void 0, function* () {
        let targets = findMakeTargets();
        const target = yield vscode.window.showQuickPick(targets);
        if (target !== undefined) {
            make([target]);
        }
    });
}
// Get a list of targets
function findMakeTargets() {
    // This is approximately the Bash completion sequence run to get make targets.
    const bashCompletion = `make -pRrq : 2>/dev/null | awk -v RS= -F: '/^# File/,/^# Finished Make data base/ {if ($1 !~ "^[#.]") {print $1}}' | egrep -v '^[^[:alnum:]]' | sort | xargs`;
    let res = child_process_1.execSync(bashCompletion, { cwd: vscode.workspace.rootPath });
    return res.toString().split(" ");
}
//# sourceMappingURL=extension.js.map