"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../../../common");
const events_1 = require("events");
const factory_1 = require("./factory");
var utils_1 = require("./utils");
exports.inputNotebookDetails = utils_1.inputNotebookDetails;
exports.selectExistingNotebook = utils_1.selectExistingNotebook;
class NotebookManager extends events_1.EventEmitter {
    constructor(outputChannel) {
        super();
        this.outputChannel = outputChannel;
        this.disposables = [];
        this.factory = new factory_1.NotebookFactory(outputChannel);
        this.factory.on('onShutdown', () => {
            this.emit('onShutdown');
        });
        this.disposables.push(this.factory);
    }
    dispose() {
        this.disposables.forEach(d => {
            d.dispose();
        });
        this.disposables = [];
    }
    setNotebook(notebook) {
        this._currentNotebook = notebook;
        this.emit('onNotebookChanged', notebook);
    }
    canShutdown(nb) {
        return this.factory.canShutdown(nb.baseUrl);
    }
    shutdown() {
        this.factory.shutdown();
        this.emit('onShutdown');
    }
    startNewNotebook() {
        this.shutdown();
        return this.factory.startNewNotebook().then(nb => {
            this._currentNotebook = nb;
            return nb;
        });
    }
    getNotebook() {
        if (this._currentNotebook && this._currentNotebook.baseUrl.length > 0) {
            return Promise.resolve(this._currentNotebook);
        }
        let def = common_1.createDeferred();
        Promise.resolve().then(() => {
            this.factory.startNewNotebook()
                .then(def.resolve.bind(def))
                .catch(def.reject.bind(def));
        });
        // window.showQuickPick([startNew, selectExisting]).then(option => {
        //     if (!option) {
        //         return def.resolve();
        //     }
        //     if (option === startNew) {
        //         this.factory.startNewNotebook()
        //             .then(def.resolve.bind(def))
        //             .catch(def.reject.bind(def));
        //     } else {
        //         selectExistingNotebook()
        //             .then(def.resolve.bind(def))
        //             .catch(def.reject.bind(def));
        //     }
        // });
        def.promise.then(nb => {
            this._currentNotebook = nb;
            return nb;
        });
        return def.promise;
    }
}
exports.NotebookManager = NotebookManager;

//# sourceMappingURL=manager.js.map
