"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kernel_1 = require("./kernel");
class JupyterClientKernel extends kernel_1.KernelImpl {
    constructor(kernelUUID, kernelSpec, connection, connectionFile, jupyterClient) {
        super(kernelUUID, kernelSpec, jupyterClient);
        this.connection = connection;
        this.connectionFile = connectionFile;
        this.jupyterClient.on('status', status => {
            this.raiseOnStatusChange(status);
        });
    }
    dispose() {
        this.shutdown().catch(() => { });
        super.dispose();
    }
    interrupt() {
        this.jupyterClient.interruptKernel(this.kernelUUID);
    }
    shutdown(restart) {
        if (restart === true) {
            return this.jupyterClient.restartKernel(this.kernelUUID);
        }
        return this.jupyterClient.shutdownkernel(this.kernelUUID);
    }
    execute(code) {
        return this.jupyterClient.runCode(code);
    }
}
exports.JupyterClientKernel = JupyterClientKernel;

//# sourceMappingURL=jupyter_client_kernel.js.map
