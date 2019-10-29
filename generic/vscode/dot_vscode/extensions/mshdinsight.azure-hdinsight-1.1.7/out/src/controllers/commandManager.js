"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events = require("events");
const vscode_1 = require("vscode");
const authorization_1 = require("../azure/authorization");
const authInfo_1 = require("../azure/authInfo");
const fileType_1 = require("./fileType");
class DefaultClusterChangedEvent {
}
exports.DefaultClusterChangedEvent = DefaultClusterChangedEvent;
class AuthorizationStatusChangedEvent {
}
exports.AuthorizationStatusChangedEvent = AuthorizationStatusChangedEvent;
class ActiveEditorChangedEvent {
}
exports.ActiveEditorChangedEvent = ActiveEditorChangedEvent;
class DefaultClusterChangedEmitter {
    getType() {
        return 'defaultClusterChanged';
    }
}
exports.DefaultClusterChangedEmitter = DefaultClusterChangedEmitter;
class AuthorizationStatusChangedEmitter {
    getType() {
        return 'authorizationStatusChanged';
    }
}
exports.AuthorizationStatusChangedEmitter = AuthorizationStatusChangedEmitter;
class ActiveEditorStatusChangedEmitter {
    getType() {
        return 'activeEditorChanged';
    }
}
exports.ActiveEditorStatusChangedEmitter = ActiveEditorStatusChangedEmitter;
class CommandManager {
    constructor() {
        this._eventEmitter = new events.EventEmitter();
        vscode_1.window.onDidChangeActiveTextEditor(textEditor => {
            let fileType;
            if (!textEditor || !textEditor.document) {
                return;
            }
            if (textEditor.document.languageId === 'hql') {
                fileType = fileType_1.FileType.Hql;
            }
            else if (textEditor.document.languageId === 'python') {
                fileType = fileType_1.FileType.PySpark;
            }
            if (fileType !== undefined) {
                this.fireActiveEditorChanged(fileType);
            }
        });
        this._eventEmitter.on('defaultClusterChanged', (event) => {
            let defaultClusterChangedEvent = event;
            vscode_1.commands.executeCommand('setContext', 'hdinsight.llapcluster', authorization_1.CredentialsManagerInstance.authenticationStatus === authInfo_1.AuthenticationStatus.Login
                && defaultClusterChangedEvent.cluster
                && defaultClusterChangedEvent.cluster.isLlapCluster());
        });
        this._eventEmitter.on('authorizationStatusChanged', (event) => {
            vscode_1.commands.executeCommand('setContext', 'hdinsight.authorization', event.isAuthorization);
        });
        this._eventEmitter.on('activeEditorChanged', (event) => {
            let fileType = event.fileType;
            let isHive = fileType === fileType_1.FileType.Hql;
            let isPyspark = fileType === fileType_1.FileType.PySpark;
            vscode_1.commands.executeCommand('setContext', 'hdinsight.hive', isHive);
            vscode_1.commands.executeCommand('setContext', 'hdinsight.pyspark', isPyspark);
        });
    }
    fire(emitter, event) {
        this._eventEmitter.emit(emitter.getType(), event);
    }
    fireAuthorizationStatusChanged(isAuthorization) {
        this.fire(new AuthorizationStatusChangedEmitter(), { isAuthorization: isAuthorization });
    }
    fireDefaultClusterChanged(cluster) {
        this.fire(new DefaultClusterChangedEmitter(), { cluster: cluster });
    }
    fireActiveEditorChanged(fileType) {
        this.fire(new ActiveEditorStatusChangedEmitter(), { fileType: fileType });
    }
}
CommandManager.Instance = new CommandManager();
exports.CommandManager = CommandManager;

//# sourceMappingURL=commandManager.js.map
