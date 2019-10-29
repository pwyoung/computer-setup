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
const authorization_1 = require("../azure/authorization");
const authorization_2 = require("../azure/authorization");
const utils = require("../utils");
const ambariManagedCluster_1 = require("./ambariManagedCluster");
const genericLivyCluster_1 = require("./genericLivyCluster");
const sqlServerBigDataCluster_1 = require("./sqlServerBigDataCluster");
const constants_1 = require("../constants/constants");
const regex = new RegExp('^https://([^(,/.)]+).azurehdinsight.(net|de|cn|us)/?$');
class LinkedClusterOptions {
    constructor(linkedClusterType, clusterName, clusterUrl, clusterType, userName, password, clusterNickName) {
        this.linkedClusterType = linkedClusterType;
        this.clusterName = clusterName;
        this.clusterUrl = clusterUrl;
        this.clusterType = clusterType;
        this.userName = userName;
        this.password = password;
        this.clusterNickName = clusterNickName;
        //
    }
}
exports.LinkedClusterOptions = LinkedClusterOptions;
var EAuthorizationType;
(function (EAuthorizationType) {
    EAuthorizationType["Basic"] = "Basic";
    EAuthorizationType["None"] = "None";
})(EAuthorizationType = exports.EAuthorizationType || (exports.EAuthorizationType = {}));
var LinkedClusterType;
(function (LinkedClusterType) {
    LinkedClusterType["AzureHDInsight"] = "Azure HDInsight";
    LinkedClusterType["SQLServerBigData"] = "SQL Server Big Data";
    LinkedClusterType["GenericLivy"] = "Generic Livy Endpoint";
})(LinkedClusterType = exports.LinkedClusterType || (exports.LinkedClusterType = {}));
var SecClusterType;
(function (SecClusterType) {
    SecClusterType["Hive"] = "Hive";
    SecClusterType["Spark"] = "Spark";
    SecClusterType["Unknown"] = "Unknown";
})(SecClusterType = exports.SecClusterType || (exports.SecClusterType = {}));
function unlinkCluster() {
    return __awaiter(this, void 0, void 0, function* () {
        const clusterNames = authorization_1.CredentialsManagerInstance.linkedClusterNames();
        let selectedClusterName = yield vscode.window.showQuickPick(clusterNames, {
            placeHolder: 'Select a cluster to unlink'
        });
        if (selectedClusterName) {
            yield authorization_1.CredentialsManagerInstance.removeLinkedCluster(selectedClusterName);
            yield updateLinkedClusterConfig();
            vscode.window.showInformationMessage('unlink cluster successfully!');
            utils.log('unlink cluster successfully!', true);
        }
    });
}
exports.unlinkCluster = unlinkCluster;
/*
 * `options` is for recovery cluster from cache.
 */
function linkCluster(options) {
    return __awaiter(this, void 0, void 0, function* () {
        let cluster = undefined;
        try {
            const isLinkedNewCluster = !options;
            const clusterOptions = options ? options : yield getAmbariClusterOptions();
            if (!clusterOptions) {
                return;
            }
            switch (clusterOptions.linkedClusterType) {
                case LinkedClusterType.GenericLivy:
                    cluster = new genericLivyCluster_1.GenericLivyCluster(clusterOptions.clusterUrl, clusterOptions.clusterUrl, clusterOptions.userName, clusterOptions.password, clusterOptions.clusterNickName);
                    break;
                case LinkedClusterType.SQLServerBigData:
                    cluster = new sqlServerBigDataCluster_1.SqlServerBigDataCluster(clusterOptions.clusterUrl, clusterOptions.clusterUrl, clusterOptions.userName, clusterOptions.password, clusterOptions.clusterNickName);
                    break;
                case LinkedClusterType.AzureHDInsight:
                    cluster = new ambariManagedCluster_1.AmbariManagedCluster(clusterOptions.clusterName, clusterOptions.clusterUrl, clusterOptions.userName, clusterOptions.password, clusterOptions.clusterType, clusterOptions.clusterNickName);
                    break;
                default:
                    return;
            }
            // await cluster.validAuthorizationInfo();
            yield authorization_1.CredentialsManagerInstance.addLinkedCluster(cluster, isLinkedNewCluster);
            utils.log(`Link cluster ${cluster.getName()} successfully!`, true, false);
            vscode.window.showInformationMessage(`Link cluster ${cluster.getName()} successfully!`);
            if (isLinkedNewCluster) {
                updateLinkedClusterConfig(cluster);
            }
        }
        catch (ex) {
            if (!options) {
                vscode.window.showErrorMessage(`Validating HDInsight cluster failed: ${utils.exceptionToString(ex)}`);
            }
            utils.error(`Validating HDInsight cluster failed: ${utils.exceptionToString(ex)}`, true);
        }
    });
}
exports.linkCluster = linkCluster;
/**
 *
 * @param argument could be a cluster. undefined means we should update global configuration of password cache
 *
 */
function updateLinkedClusterConfig(cluster) {
    return __awaiter(this, void 0, void 0, function* () {
        // update the configuration if  keytar is available and customers link new clusters during extension life time
        if (authorization_2.keytar) {
            let config = vscode.workspace.getConfiguration('hdinsightCluster');
            const cls = authorization_1.CredentialsManagerInstance.linkedClusterNames()
                .map(name => authorization_1.CredentialsManagerInstance.getCluster(name))
                .filter(elem => elem !== undefined);
            const linkedClusterUrlsPromise = cls.map((cluster) => __awaiter(this, void 0, void 0, function* () {
                return {
                    url: cluster.getConnectString(),
                    userName: yield cluster.getAmbariUserName(),
                    type: cluster.getClusterType(),
                    linkedClusterType: cluster.getLinkedClusterType(),
                    clusterNickName: cluster.getclusterNickName()
                };
            }));
            const linkedClusterUrls = yield Promise.all(linkedClusterUrlsPromise);
            yield config.update('linkedClusters', linkedClusterUrls, true);
            if (cluster) {
                const url = cluster.getConnectString();
                const userName = yield cluster.getAmbariUserName();
                // do nothing for generic livy endpoint without auth info
                if (userName) {
                    const password = yield cluster.getAmbariPassword();
                    yield authorization_2.keytar.setPassword(authorization_2.keytarServiceName, `${url}\t${userName}`, password);
                }
            }
            else {
                cls.forEach((cluster) => __awaiter(this, void 0, void 0, function* () {
                    const url = cluster.getConnectString();
                    const userName = yield cluster.getAmbariUserName();
                    // do nothing for generic livy endpoint without auth info
                    if (userName) {
                        const password = yield cluster.getAmbariPassword();
                        yield authorization_2.keytar.setPassword(authorization_2.keytarServiceName, `${url}\t${userName}`, password);
                    }
                }));
            }
        }
    });
}
exports.updateLinkedClusterConfig = updateLinkedClusterConfig;
function recoverLinkedClusters() {
    return __awaiter(this, void 0, void 0, function* () {
        if (authorization_2.keytar) {
            let config = vscode.workspace.getConfiguration('hdinsightCluster');
            let clusters = config && config['linkedClusters'];
            if (clusters) {
                let updatedConfig = [];
                for (const cluster of clusters) {
                    updatedConfig.push(cluster);
                    if (!cluster.url || !cluster.type) {
                        // just ignore the cluster url if match failed
                        continue;
                    }
                    let clusterType = SecClusterType[cluster.type.toString()];
                    if (!clusterType) {
                        clusterType = SecClusterType.Unknown;
                    }
                    let clusterName = cluster.url;
                    const accountKey = `${cluster.url}\t${cluster.userName}`;
                    if (cluster.linkedClusterType === LinkedClusterType.AzureHDInsight) {
                        const matchedResult = cluster.url.match(regex);
                        if (!matchedResult) {
                            // just ignore the cluster url if match failed
                            continue;
                        }
                        clusterName = matchedResult[1];
                    }
                    let password = '';
                    try {
                        if (cluster.userName) {
                            password = yield authorization_2.keytar.getPassword(authorization_2.keytarServiceName, accountKey);
                            if (!password || password === '') {
                                authorization_2.keytar.deletePassword(authorization_2.keytarServiceName, accountKey);
                                // delete last item if password cannot be grabbed
                                if (updatedConfig) {
                                    updatedConfig.pop();
                                }
                                continue;
                            }
                        }
                        yield linkCluster(new LinkedClusterOptions(cluster.linkedClusterType, clusterName, cluster.url, clusterType, cluster.userName, password, cluster.clusterNickName));
                    }
                    catch (ex) {
                        utils.warn(`recover linked cluster error: ${utils.exceptionToString(ex)}`);
                    }
                }
                // delete Config which still not get passwrod
                yield config.update('linkedClusters', updatedConfig, true);
            }
        }
    });
}
exports.recoverLinkedClusters = recoverLinkedClusters;
function getGenericClusterOptions() {
    return __awaiter(this, void 0, void 0, function* () {
        const livyEndpoint = yield utils.vscodeInputBoxActionWithRetry(() => vscode.window.showInputBox({
            placeHolder: 'For example: http(s)://192.168.2.1:8888',
            ignoreFocusOut: true,
            prompt: 'Please input generic livy endpoint',
            //  value: 'https://mycluster.azurehdinsight.net',
            validateInput: (value) => {
                if (!value || value === '') {
                    return 'livy endpoint couldn\'t be empty!';
                }
                else if (!value.startsWith('http')) {
                    return `livy endpoint should be start with http[s]://`;
                }
                else {
                    return null;
                }
            }
        }), 'invalid livy endpoint! For example: http(s)://192.168.2.1:8888');
        // cancel the operation
        if (livyEndpoint === undefined) {
            return;
        }
        const authorizationType = yield vscode.window.showQuickPick([EAuthorizationType.Basic, EAuthorizationType.None], { placeHolder: 'Authorization Type' });
        let userName, password, clusterNickName;
        if (authorizationType === undefined) {
            return;
        }
        if (authorizationType === EAuthorizationType.Basic) {
            userName = yield utils.vscodeInputBoxActionWithRetry(() => vscode.window.showInputBox({
                ignoreFocusOut: true,
                prompt: 'Please input Ambari user name(default: admin):',
                value: 'admin'
            }), 'Ambari user name cann\'t be empty');
            if (userName === undefined) {
                return;
            }
            password = yield utils.vscodeInputBoxActionWithRetry(() => vscode.window.showInputBox({
                ignoreFocusOut: true,
                password: true,
                prompt: `Please input password for user ${userName}:`
            }), ' Password cann\'t be empty');
            if (password === undefined) {
                return;
            }
        }
        // no error message since it is optional input, clusterNickName is named by user
        clusterNickName = yield utils.vscodeInputBoxActionWithRetry(() => vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: '[Optional] Cluster name',
            prompt: 'Please input cluster display name(default:admin):'
        }), '', 1);
        if (clusterNickName === undefined) {
            return;
        }
        return new LinkedClusterOptions(LinkedClusterType.GenericLivy, livyEndpoint, livyEndpoint, SecClusterType.Spark, userName, password, clusterNickName);
    });
}
exports.getGenericClusterOptions = getGenericClusterOptions;
function linkNewSQLServerBigDataCluster() {
    return __awaiter(this, void 0, void 0, function* () {
        let sqlServerEndpoint, userName, password, clusterNickName;
        sqlServerEndpoint = yield utils.vscodeInputBoxActionWithRetry(() => vscode.window.showInputBox({
            placeHolder: 'For example: http(s)://10.123.123.123:8888(30443 by default)',
            ignoreFocusOut: true,
            prompt: 'Please input SQL Server Big Data endpoint',
            // value:
            validateInput: (value) => {
                if (!value || value === '') {
                    return 'SQL server endpoint couldn\'t be empty!';
                }
                else if (!value.startsWith('http')) {
                    return `livy endpoint should be start with http[s]://`;
                }
                else {
                    return null;
                }
            }
        }), 'Invalid SQL server Big data endpoint! For example: http(s)://10.123.123.123:8888(30443 by default)');
        // cancel the operation
        if (sqlServerEndpoint === undefined) {
            return;
        }
        else {
            // use sqlServerBigDataClusterDefaultPort if users do not specify port number.
            sqlServerEndpoint = sqlServerEndpoint.replace(/\/+$/, '').trim();
            sqlServerEndpoint = sqlServerEndpoint.match(/[:,][\s]*[0-9]+$/) ? sqlServerEndpoint : sqlServerEndpoint + ':' + constants_1.sqlServerBigDataClusterDefaultPort;
        }
        userName = yield utils.vscodeInputBoxActionWithRetry(() => vscode.window.showInputBox({
            ignoreFocusOut: true,
            prompt: 'Please input SQL Big Data Cluster user name',
            value: 'root'
        }), 'User name cann\'t be empty');
        if (userName === undefined) {
            return;
        }
        password = yield utils.vscodeInputBoxActionWithRetry(() => vscode.window.showInputBox({
            ignoreFocusOut: true,
            password: true,
            prompt: 'Please input password for user admin:'
        }), ' Password cann\'t be empty');
        if (password === undefined) {
            return;
        }
        // no error message since it is optional input, clusterNickName is named by user
        clusterNickName = yield utils.vscodeInputBoxActionWithRetry(() => vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: '[Optional] Cluster name',
            prompt: 'Please input cluster display name(default:admin):'
        }), '', 1);
        if (clusterNickName === undefined) {
            return;
        }
        return new LinkedClusterOptions(LinkedClusterType.SQLServerBigData, sqlServerEndpoint, sqlServerEndpoint, SecClusterType.Spark, userName, password, clusterNickName);
    });
}
exports.linkNewSQLServerBigDataCluster = linkNewSQLServerBigDataCluster;
function getAmbariClusterOptions(options, userNamePrompt) {
    return __awaiter(this, void 0, void 0, function* () {
        if (options) {
            userNamePrompt = userNamePrompt ? userNamePrompt : 'Please input Ambari user name(default: admin):';
            const ambariUserName = yield utils.vscodeInputBoxActionWithRetry(() => vscode.window.showInputBox({
                ignoreFocusOut: true,
                prompt: userNamePrompt,
                value: 'admin'
            }), 'Ambari user name cann\'t be empty');
            if (ambariUserName === undefined) {
                return;
            }
            options.userName = ambariUserName;
            const passwordPrompt = `Please input Ambari password for user ${ambariUserName}:`;
            const ambariPassword = yield utils.vscodeInputBoxActionWithRetry(() => vscode.window.showInputBox({
                ignoreFocusOut: true,
                password: true,
                prompt: passwordPrompt
            }), 'Ambari password cann\'t be empty');
            if (ambariPassword === undefined) {
                return;
            }
            options.password = ambariPassword;
            return options;
        }
        else {
            const selectedClusterType = yield vscode.window.showQuickPick([LinkedClusterType.AzureHDInsight, LinkedClusterType.SQLServerBigData, LinkedClusterType.GenericLivy], { placeHolder: 'Please select linked cluster type' });
            switch (selectedClusterType) {
                case LinkedClusterType.AzureHDInsight:
                    return yield linkNewHDInsightCluster();
                case LinkedClusterType.SQLServerBigData:
                    return yield linkNewSQLServerBigDataCluster();
                case LinkedClusterType.GenericLivy:
                    return yield getGenericClusterOptions();
                default:
                    return undefined;
            }
        }
    });
}
exports.getAmbariClusterOptions = getAmbariClusterOptions;
function linkNewHDInsightCluster() {
    return __awaiter(this, void 0, void 0, function* () {
        let clusterName = undefined, clusterNickName;
        const clusterUrl = yield utils.vscodeInputBoxActionWithRetry(() => vscode.window.showInputBox({
            placeHolder: 'For example: https://myClusterName.azurehdinsight.net',
            prompt: 'Please input HDInsight cluster url',
            //  value: 'https://mycluster.azurehdinsight.net',
            validateInput: (value) => {
                if (value) {
                    if (value === '') {
                        return 'Cluster URL couldn\'t be empty!';
                    }
                    const result = value.trim().match(regex);
                    if (result) {
                        clusterName = result[1];
                        return null;
                    }
                    return 'invalid cluster URL! For example: https://myClusterName.azurehdinsight.net';
                }
                return null;
            }
        }), 'invalid cluster URL! For example: https://myClusterName.azurehdinsight.net');
        // cancel the operation
        if (clusterUrl === undefined || !clusterName) {
            return;
        }
        const ambariUserName = yield utils.vscodeInputBoxActionWithRetry(() => vscode.window.showInputBox({
            ignoreFocusOut: true,
            prompt: 'Please input Ambari user name(default: admin):',
            value: 'admin'
        }), 'Ambari user name cann\'t be empty');
        if (ambariUserName === undefined) {
            return;
        }
        const ambariPassword = yield utils.vscodeInputBoxActionWithRetry(() => vscode.window.showInputBox({
            ignoreFocusOut: true,
            password: true,
            prompt: `Please input Ambari password for user ${ambariUserName}:`
        }), 'Ambari password cann\'t be empty');
        if (ambariPassword === undefined) {
            return;
        }
        const clusterType = yield utils.vscodeInputBoxActionWithRetry(() => vscode.window.showQuickPick(['Hive', 'Spark'], {
            ignoreFocusOut: true,
            placeHolder: 'Please select cluster type:'
        }), 'Cluster type can not be null');
        if (clusterType === undefined) {
            return;
        }
        // no error message since it is optional input, clusterNickName is named by user
        clusterNickName = yield utils.vscodeInputBoxActionWithRetry(() => vscode.window.showInputBox({
            ignoreFocusOut: true,
            placeHolder: '[Optional] Cluster name',
            prompt: 'Please input cluster display name(default:admin):'
        }), '', 1);
        return new LinkedClusterOptions(LinkedClusterType.AzureHDInsight, clusterName, clusterUrl, SecClusterType[clusterType], ambariUserName, ambariPassword, clusterNickName);
    });
}
function closeAllSession() {
    authorization_1.CredentialsManagerInstance.linkedClusterNames()
        .map(name => authorization_1.CredentialsManagerInstance.getCluster(name))
        .forEach((cls) => {
        if (cls) {
            cls.closeSession();
        }
    });
}
exports.closeAllSession = closeAllSession;

//# sourceMappingURL=seccluster.js.map
