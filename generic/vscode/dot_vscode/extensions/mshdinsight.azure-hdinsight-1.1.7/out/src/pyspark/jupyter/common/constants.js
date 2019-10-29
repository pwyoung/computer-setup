"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonLanguage = { language: 'python', scheme: 'file' };
var Commands;
(function (Commands) {
    let Jupyter;
    (function (Jupyter) {
        Jupyter.Get_All_KernelSpecs_For_Language = 'hdinsgiht.jupyter.getAllKernelSpecsForLanguage';
        Jupyter.Get_All_KernelSpecs = 'hdinsgiht.jupyter.getAllKernelSpecs';
        Jupyter.Kernel_Options = 'hdinsgiht.jupyter.kernelOptions';
        Jupyter.StartNotebook = 'hdinsgiht.jupyter.startNotebook';
        Jupyter.SelectExistingNotebook = 'hdinsgiht.jupyter.selectExistingNotebook';
        Jupyter.ProvideNotebookDetails = 'hdinsgiht.jupyter.provideNotebookDetails';
        Jupyter.StartKernelForKernelSpeck = 'hdinsgiht.jupyter.sartKernelForKernelSpecs';
        Jupyter.ExecuteRangeInKernel = 'hdinsgiht.jupyter.execRangeInKernel';
        Jupyter.ExecuteSelectionOrLineInKernel = 'hdinsgiht.jupyter.runSelectionLine';
        let Cell;
        (function (Cell) {
            Cell.ExecuteCurrentCell = 'hdinsgiht.jupyter.execCurrentCell';
            Cell.ExecuteCurrentCellAndAdvance = 'hdinsgiht.jupyter.execCurrentCellAndAdvance';
            Cell.AdcanceToCell = 'hdinsgiht.jupyter.advanceToNextCell';
            Cell.DisplayCellMenu = 'hdinsgiht.jupyter.displayCellMenu';
            Cell.GoToPreviousCell = 'hdinsgiht.jupyter.gotToPreviousCell';
            Cell.GoToNextCell = 'hdinsgiht.jupyter.gotToNextCell';
        })(Cell = Jupyter.Cell || (Jupyter.Cell = {}));
        let Kernel;
        (function (Kernel) {
            Kernel.Select = 'hdinsgiht.jupyter.selectKernel';
            Kernel.Interrupt = 'hdinsgiht.jupyter.kernelInterrupt';
            Kernel.Restart = 'hdinsgiht.jupyter.kernelRestart';
            Kernel.Shutdown = 'hdinsgiht.jupyter.kernelShutDown';
            Kernel.Details = 'hdinsgiht.jupyter.kernelDetails';
        })(Kernel = Jupyter.Kernel || (Jupyter.Kernel = {}));
        let Notebook;
        (function (Notebook) {
            Notebook.ShutDown = 'hdinsgiht.jupyter.shutdown';
        })(Notebook = Jupyter.Notebook || (Jupyter.Notebook = {}));
    })(Jupyter = Commands.Jupyter || (Commands.Jupyter = {}));
})(Commands = exports.Commands || (exports.Commands = {}));

//# sourceMappingURL=constants.js.map
