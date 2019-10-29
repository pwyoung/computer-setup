'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const log4js = require("log4js");
const path = require("path");
const productConstants_1 = require("./productConstants");
class Logger {
    constructor(channelName) {
        this.level = LogLevel.High;
        this.logDebug = LogDebug.Enable;
        this.outputChannel = vscode.window.createOutputChannel(channelName);
        const filePath = path.join(productConstants_1.ProductConstants.WorkingFolder, 'hdi.log');
        this.logDebug = LogDebug.Disable;
        // all messages are logged to {user.home}/.msvscode.hdinsight/hdi.log
        log4js.configure({
            appenders: { hdiFileLogger: { type: 'file', filename: filePath, encoding: 'utf-8' } },
            categories: { default: { appenders: ['hdiFileLogger'], level: 'debug' } }
        });
        this.logger = log4js.getLogger('hdiFileLogger');
    }
    static getLogger(name) {
        if (name in this._instance) {
            return this._instance[name];
        }
        else {
            this._instance[name] = new Logger(name);
            this._instance[name].setLogLevel(LogLevel.High);
            return this._instance[name];
        }
    }
    setLogLevel(level) {
        this.level = level;
    }
    setDebug(debug) {
        this.logDebug = debug;
    }
    static focusLogger(name, notFocus = true) {
        this.getLogger(name).show(notFocus);
    }
    logInfoWithoutPrefix(message) {
        this.outputChannel.appendLine(message);
    }
    getCurrentDateTimeString() {
        const date = new Date();
        return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-') + ':' + [date.getHours(), date.getMinutes(), date.getSeconds()].join(':');
    }
    log(message, isDisplay, type) {
        let logType = type ? type : LogType.Info;
        if (logType.valueOf() <= this.level.valueOf()) {
            this.outputChannel.appendLine(`[${this.getCurrentDateTimeString()}] [${LogType[logType]}] ${message}`);
            switch (logType) {
                case LogType.Error:
                    this.logger.error(message);
                    if (isDisplay) {
                        this.show(true);
                    }
                    break;
                case LogType.Info:
                    this.logger.info(message);
                    if (isDisplay) {
                        this.show(true);
                    }
                    break;
                case LogType.Warning:
                    this.logger.warn(message);
                    if (isDisplay) {
                        this.show(true);
                    }
                    break;
            }
        }
        else {
            this.logger.debug(message);
            if (isDisplay) {
                this.show(true);
            }
        }
    }
    debug(message) {
        if (this.logDebug === LogDebug.Enable) {
            this.outputChannel.appendLine(`[Debug] ${message}`);
        }
        this.logger.debug(message);
    }
    append(info) {
        this.outputChannel.append(info);
    }
    appendLine(info) {
        this.outputChannel.appendLine(info);
    }
    clear() {
        this.outputChannel.clear();
    }
    show(notFocus = true) {
        this.outputChannel.show(notFocus);
    }
    hide() {
        this.outputChannel.hide();
    }
    getChannel() {
        return this.outputChannel;
    }
}
Logger._instance = {};
exports.Logger = Logger;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Low"] = 1] = "Low";
    LogLevel[LogLevel["Media"] = 2] = "Media";
    LogLevel[LogLevel["High"] = 3] = "High";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
var LogDebug;
(function (LogDebug) {
    LogDebug[LogDebug["Enable"] = 0] = "Enable";
    LogDebug[LogDebug["Disable"] = 1] = "Disable";
})(LogDebug = exports.LogDebug || (exports.LogDebug = {}));
var LogType;
(function (LogType) {
    LogType[LogType["Error"] = 1] = "Error";
    LogType[LogType["Warning"] = 2] = "Warning";
    LogType[LogType["Info"] = 3] = "Info";
})(LogType = exports.LogType || (exports.LogType = {}));

//# sourceMappingURL=logger.js.map
