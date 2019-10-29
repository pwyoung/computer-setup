"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class JobStatusEmitter extends events_1.EventEmitter {
    constructor() {
        super();
        this._isRunning = false;
        this.on('start', () => {
            this._isRunning = true;
        });
        this.on('stop', () => {
            this._isRunning = false;
        });
    }
    isRunning() {
        return this._isRunning;
    }
}
class JobStatusManager {
    constructor() {
        this._jobStatusEmitter = new JobStatusEmitter();
    }
    static get Instance() {
        return JobStatusManager._instance;
    }
    isRunning() {
        // return this._jobStatusEmitter.isRunning();
        return false;
    }
    setToRunStatus() {
        this._jobStatusEmitter.emit('start');
    }
    setToStopStatus() {
        this._jobStatusEmitter.emit('stop');
    }
}
JobStatusManager._instance = new JobStatusManager();
exports.JobStatusManager = JobStatusManager;

//# sourceMappingURL=jobStatusManager.js.map
