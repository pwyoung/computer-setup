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
const constants_1 = require("../common/constants");
class KernelPicker extends vscode.Disposable {
    constructor() {
        super(() => { });
        this.disposables = [];
        this.registerCommands();
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
    registerCommands() {
        this.disposables.push(vscode.commands.registerCommand(constants_1.Commands.Jupyter.Kernel.Select, this.selectkernel.bind(this)));
    }
    selectkernel(language = constants_1.PythonLanguage.language) {
        return new Promise(resolve => {
            const command = language ? constants_1.Commands.Jupyter.Get_All_KernelSpecs_For_Language : constants_1.Commands.Jupyter.Get_All_KernelSpecs;
            vscode.commands.executeCommand(command, language).then((kernelSpecs) => {
                if (kernelSpecs.length === 0) {
                    return resolve();
                }
                this.displayKernelPicker(kernelSpecs).then((kernelSpec) => {
                    if (kernelSpec) {
                        vscode.commands.executeCommand(constants_1.Commands.Jupyter.StartKernelForKernelSpeck, kernelSpec, kernelSpec.language);
                    }
                });
            });
        });
    }
    displayKernelPicker(kernelspecs) {
        return __awaiter(this, void 0, void 0, function* () {
            const items = kernelspecs.map(spec => {
                return {
                    label: spec.display_name,
                    description: spec.language,
                    detail: spec.argv.join(' '),
                    kernelspec: spec
                };
            });
            let item = yield vscode.window.showQuickPick(items, { placeHolder: 'Select a Kernel' });
            return (item && item.kernelspec) ? item.kernelspec : undefined;
        });
    }
}
exports.KernelPicker = KernelPicker;

//# sourceMappingURL=kernelPicker.js.map
