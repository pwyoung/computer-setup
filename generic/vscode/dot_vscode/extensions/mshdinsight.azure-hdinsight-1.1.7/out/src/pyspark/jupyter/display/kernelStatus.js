"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const constants_1 = require("../common/constants");
const utils_1 = require("../../../utils");
class KernelStatus extends vscode.Disposable {
    constructor() {
        super(() => { });
        this.disposables = [];
        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.statusBar.command = 'hdinsight.jupyter.proxyKernelOptionsCmd';
        this.disposables.push(this.statusBar);
        this.disposables.push(vscode.commands.registerCommand('hdinsight.jupyter.proxyKernelOptionsCmd', () => {
            vscode.commands.executeCommand(constants_1.Commands.Jupyter.Kernel_Options, this.activeKernal);
        }));
        this.disposables.push(vscode.window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor.bind(this)));
    }
    onDidChangeActiveTextEditor(editor) {
        const editorsOpened = vscode.workspace.textDocuments.length > 0;
        if ((!editor && editorsOpened) || (editor && editor.document.languageId === constants_1.PythonLanguage.language)) {
            if (this.activeKernal) {
                this.statusBar.show();
            }
        }
        else {
            this.statusBar.hide();
        }
    }
    setActiveKernel(kernel) {
        if (!kernel) {
            this.activeKernal = utils_1.nullValue();
            return this.statusBar.hide();
        }
        this.activeKernal = kernel;
        this.displayName = kernel.name;
        this.statusBar.tooltip = `Running on ${kernel.baseUrl}`;
        kernel.getSpec().then(spec => {
            this.statusBar.tooltip = `${spec.display_name}(${spec.name}) Kernel for ${spec.language}` +
                `\nRunning on ${kernel.baseUrl}\nClick for options`;
            this.displayName = spec.display_name;
            this.statusBar.text = `$(flame)${this.displayName} Kernel`;
        });
        this.statusBar.text = `$(flame)${this.displayName} Kernel`;
        this.statusBar.show();
    }
    setKernelStatus(status) {
        this.statusBar.text = `$(flame)${this.displayName} Kernel (${status})`;
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
exports.KernelStatus = KernelStatus;

//# sourceMappingURL=kernelStatus.js.map
