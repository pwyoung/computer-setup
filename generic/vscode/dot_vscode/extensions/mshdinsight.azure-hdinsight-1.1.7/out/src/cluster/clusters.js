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
const arm_hdinsight_1 = require("@azure/arm-hdinsight");
const msStorage = require("azure-storage-legacy");
const vscode = require("vscode");
const sprintf_js_1 = require("sprintf-js");
const adlsManagement = require("azure-arm-datalake-store");
const fs = require("fs");
const stream = require("stream");
const utils = require("../utils");
const authorization_1 = require("../azure/authorization");
const storage_1 = require("../storage/storage");
const jobType_1 = require("../job/jobType");
const commandManager_1 = require("../controllers/commandManager");
const stHelper = require("../storage/storageHelper");
const seccluster_1 = require("./seccluster");
const ambariManagedCluster_1 = require("./ambariManagedCluster");
const newSettings_1 = require("../newSettings");
const HdinsightTreeInfoProvider_1 = require("../treeView/HdinsightTreeInfoProvider");
const azureAccount_1 = require("../azure/azureAccount");
const HdinsightTreeInfoProvider_2 = require("../treeView/HdinsightTreeInfoProvider");
const genericLivyCluster_1 = require("./genericLivyCluster");
const sqlServerBigDataCluster_1 = require("./sqlServerBigDataCluster");
const AdlsGen2Wrapper_1 = require("../storage/AdlsGen2Wrapper");
const AdlsGen2Rest_1 = require("../storage/AdlsGen2Rest");
const authorization_2 = require("../azure/authorization");
const environment_1 = require("../azure/environment");
const telemetry_1 = require("../telemetry");
const Constants = require("../constants/constants");
const seccluster_2 = require("./seccluster");
// /subscriptions/7f31cba8-b597-4129-b158-8f21a7395bd0/resourceGroups/SparkRServerTestRG/providers/Microsoft.HDInsight/clusters/sparkRServer
const regexp = new RegExp('^/subscriptions/([^/]+)/resourceGroups/([^/]+)/providers/Microsoft.HDInsight/clusters/([^/]+)$');
class Cluster {
    constructor(name, id, sub) {
        this.name = name;
        this.id = id;
        this.sub = sub;
        if (id) {
            var infos = this.id.match(regexp);
            if (!infos || infos.length !== 4) {
                throw Error(`cluster id ${this.id} format error!`);
            }
            if (!sub) {
                this.subscriptionId = infos[1];
                this.subscription = authorization_1.CredentialsManagerInstance.subscriptions.find(subscription => subscription.id === `/subscriptions/${this.subscriptionId}`);
                this.resouceGroupName = infos[2];
            }
            else {
                // when expending the hdinsight tree view, there's no subscription information available on azure treeitem so we don't set subscription here 
                this.subscriptionId = infos[1];
                this.subscription = sub;
                this.resouceGroupName = infos[2];
            }
        }
    }
    getLivyEndpoint() {
        return `${this.getConnectString()}/livy`;
    }
    configurationValidation() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.storage) {
                yield this.getConfiguration();
            }
            // The Ambari password is empty when the cluster is security Hadoop cluster
            // A new Ambari credential is required here
            if (!this.ambariPassword) {
                const ambariConfig = yield this.getAmbariConfig();
                this.ambairUserName = ambariConfig.ambairUserName;
                this.ambariPassword = ambariConfig.ambariPassword;
            }
        });
    }
    uploadtoADLS(localPath, remotePath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.storage.adlsHomeMountpont) {
                throw Error(`mount point of adls storage ${this.storage.adlsHomeHostName} can not find`);
            }
            const tokenCredentials = yield stHelper.getTokenCredentials(this.storage.adlsConfig);
            let fileSystemClient = new adlsManagement.DataLakeStoreFileSystemClient(tokenCredentials);
            // read and write access to adls is required here;
            yield fileSystemClient.fileSystem.checkAccess(this.storage.getAdlsStorageName(), this.storage.adlsHomeMountpont, 'rw-');
            let remoteFilePath = `${this.storage.adlsHomeMountpont}/${remotePath}`;
            let bufferStream = new stream.PassThrough();
            bufferStream.end(fs.readFileSync(localPath));
            let requestOptions = {
                streamContents: bufferStream,
                overwirte: true
            };
            return yield new Promise((resolve, reject) => {
                fileSystemClient.fileSystem.create(this.storage.getAdlsStorageName(), remoteFilePath, requestOptions, (error, result, request, response) => {
                    if (error) {
                        reject(error);
                    }
                    if (response) {
                        const code = response['statusCode'];
                        if (code === 201 || code === 200) {
                            resolve(remoteFilePath);
                        }
                    }
                    reject(response);
                });
            });
        });
    }
    uploadtoAdlsGen2(localPath, remotePath) {
        return __awaiter(this, void 0, void 0, function* () {
            let storageAccessKey = null;
            if (authorization_2.keytar) {
                storageAccessKey = yield authorization_2.keytar.getPassword(authorization_2.keytarServiceName, this.storage.defaultStorageWithDnsSuffix);
            }
            if (!storageAccessKey) {
                const credentail = yield this._getCredential();
                // TODO: subscriptionId is not attached to the storageAccount, but cluster. Need some more fix. 
                storageAccessKey = yield this.storage.getDefaultStorageAccessKeyWithCred(credentail, this.subscriptionId, this.resouceGroupName);
            }
            const response = yield AdlsGen2Wrapper_1.default.uploadFile(localPath, remotePath, this.storage.getDefaultStorageAccountName(), storageAccessKey, this.storage.getAdlsGen2RestUrl());
            if (response === AdlsGen2Rest_1.AdlsGen2ResponseStatus.UploadSuccess) {
                return AdlsGen2Rest_1.AdlsGen2ResponseStatus.UploadSuccess;
            }
            else {
                authorization_2.keytar.deletePassword(authorization_2.keytarServiceName, this.storage.defaultStorageWithDnsSuffix);
                throw new Error(`Authentication failed, please check your storage access key and run again!`);
            }
        });
    }
    uploadtoBlob(localPath, remotePath) {
        return __awaiter(this, void 0, void 0, function* () {
            let blobService = msStorage.createBlobService(this.storage.getDefaultConnectString());
            return yield new Promise((resolve, reject) => {
                blobService.putBlockBlobFromFile(this.storage.defaultContainer, remotePath, localPath, function (error, result) {
                    if (error) {
                        reject(error);
                    }
                    resolve(result);
                });
            });
        });
    }
    uploadFileToStorage(localPath, remotePath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.configurationValidation();
            if (this.ambariCluster) {
                return yield this.ambariCluster.uploadFileToStorage(localPath, remotePath);
            }
            else {
                if (this.storage.isAdls && this.storage.adlsConfig) {
                    yield this.uploadtoADLS(localPath, remotePath);
                }
                else if (this.storage.isAdlsGen2) {
                    yield this.uploadtoAdlsGen2(localPath, remotePath);
                }
                else {
                    yield this.uploadtoBlob(localPath, remotePath);
                }
                const fullRemotePath = this.storage.getDefaultStorageFullPath(remotePath);
                return fullRemotePath;
            }
        });
    }
    // for example: /subscriptions/xxxxxx-xxxxx-xxxxx-xxxx    
    getFullSubId() {
        return this.subscription.id;
    }
    getSubId() {
        // when clusters are obtained from azure account, this.subscription is not avalable
        if (this.subscription) {
            return this.subscription.getShortSubId();
        }
        else {
            return this.subscriptionId;
        }
    }
    getFormattedName() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.ambariCluster) {
                return this.ambariCluster.getFormattedName();
            }
            else {
                return this.getName();
            }
        });
    }
    getAmbariUserName() {
        return __awaiter(this, void 0, void 0, function* () {
            // await getConfigurationWithCred()
            yield this.configurationValidation();
            return this.ambairUserName;
        });
    }
    getAmbariPassword() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.configurationValidation();
            return this.ambariPassword;
        });
    }
    getResourceGroupName() {
        return this.resouceGroupName;
    }
    getConnectString() {
        let formatName = encodeURIComponent(this.name);
        let formatStr = authorization_1.CredentialsManagerInstance.hdiEnvironment.getClusterConnectionFormat();
        return sprintf_js_1.sprintf(formatStr, formatName);
    }
    getSparkVersion() {
        if (!this.isSparkCluster()) {
            throw new Error('Not supported since it\'s not a Spark cluster');
        }
        let clusterVersion = this.properties.clusterVersion;
        if (!clusterVersion) {
            return 'unknown';
        }
        else if (clusterVersion.startsWith('3.3')) {
            return '1.5.2';
        }
        else if (clusterVersion.startsWith('3.4')) {
            return '1.6.0';
        }
        else if (clusterVersion.startsWith('3.5')) {
            let componentVersion = this.properties.clusterDefinition.componentVersion;
            if (componentVersion) {
                return this._getSparkVersionFromComponentVersion(componentVersion);
            }
            return '1.6.2';
        }
        else {
            let componentVersion = this.properties.clusterDefinition.componentVersion;
            if (componentVersion) {
                return this._getSparkVersionFromComponentVersion(componentVersion);
            }
            return 'unknown';
        }
    }
    _getSparkVersionFromComponentVersion(componentVersion) {
        for (let key in componentVersion) {
            if (key.toLowerCase() === 'spark') {
                return componentVersion[key];
            }
        }
        return 'unknown';
    }
    getName() {
        return this.name;
    }
    getOSType() {
        let osType = this.properties.osType;
        if (!osType) {
            osType = this.properties.operatingSystemType;
        }
        return osType ? osType.toLowerCase() : 'unknown';
    }
    getClusterStatus() {
        return this.properties.clusterState;
    }
    getClusterType() {
        let clusterType = this.properties.clusterDefinition.clusterType;
        if (!clusterType) {
            clusterType = this.properties.clusterDefinition.kind;
        }
        return clusterType ? clusterType[0].toUpperCase() + clusterType.slice(1).toLowerCase() : 'unknown';
    }
    isVaildType(jobType) {
        switch (jobType) {
            case jobType_1.JobType.PySparkBatch:
            case jobType_1.JobType.SparkInteractive:
                return this.isSparkCluster();
            case jobType_1.JobType.HiveBatch:
                return !this.isLlapCluster();
            case jobType_1.JobType.HiveInteractive:
                return true;
            default:
                return false;
        }
    }
    isLlapCluster() {
        let clusterType = this.getClusterType().toLowerCase();
        return clusterType === 'interactivehive';
    }
    isSparkCluster() {
        let clusterType = this.getClusterType().toLowerCase();
        return clusterType === 'spark' || clusterType === 'rserver';
    }
    getStorage() {
        return this.storage;
    }
    getConfiguration(credential) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.storage = yield this._getClusterConfiguration(credential);
            }
            catch (ex) {
                utils.error(`get Configuration Credential FAILED: ${utils.exceptionToString(ex)}`);
            }
            finally {
                if (!this.storage) {
                    const ambariConfig = yield this.getAmbariConfig();
                    this.storage = yield this._getClusterConfiguration(credential, ambariConfig);
                }
                this.ambairUserName = this.storage.ambariUserName;
                this.ambariPassword = this.storage.ambariPasswd;
                utils.log(`Get cluster ${this.getName()} configuration successfully!`);
            }
        });
    }
    _getClusterConfiguration(credential, ambariConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!credential) {
                credential = yield HdinsightTreeInfoProvider_1.getCredentialFromTreeView(this.subscriptionId);
            }
            ambariConfig = ambariConfig || {
                ambairUserName: this.ambairUserName,
                ambariPassword: this.ambariPassword
            };
            const hdiManagementClient = authorization_1.CredentialsManagerInstance.createHDInsightManagementClientWithCredentialOptional(this.subscription, credential);
            const resourceGroupName = this.getResourceGroupName();
            const clusterName = this.getName();
            if (!ambariConfig.ambairUserName) {
                try {
                    const configuraitonsListResponse = yield hdiManagementClient.configurations.list(resourceGroupName, clusterName);
                    const configurations = configuraitonsListResponse.configurations;
                    return storage_1.getClusterStorageInfo(configurations);
                }
                catch (ex) {
                    // If throw Error, means the user does not have access and we go back to upper level to ask for ambariConfig.
                    // Error Code: AuthorizationFailed. Status: 403. Message: The client 'accoutnName' with object id 'id' does not have authorization to perform action 'actionName' over scope 'resourcePath'.
                    throw new Error(`Error Code: ${ex.code}. Status: ${ex.statusCode}. Message: ${ex.message}`);
                }
            }
            else {
                // User already has ambariConfig, we only need to get `core-site`. For these 2 together we have enough infomation.
                try {
                    const configurations = yield hdiManagementClient.configurations.get(resourceGroupName, clusterName, 'core-site');
                    return storage_1.getClusterStorageInfo(configurations, ambariConfig);
                }
                catch (ex) {
                    throw new Error(`Error Code: ${ex.code}. Status: ${ex.statusCode}. Message: ${ex.message}`);
                }
            }
        });
    }
    getAmbariConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('NoOperatorCredential', { Action: 'hdinsight.enterAmbariCredential' });
            const credentials = yield this._getCredential();
            const portalUrl = credentials.environment.portalUrl;
            const upgradeRoleUrl = `${portalUrl}/#@${this.subscription.tenantId}/resource${this.id}/users`;
            const viewDocsStr = 'View Docs';
            const upgradeRoleStr = 'Upgrade Role';
            const azurePortalStr = 'Azure Portal';
            const reportIssueStr = 'Report Issue';
            // Showing info in the output 
            utils.log(Constants.promptInfo + upgradeRoleUrl);
            utils.log('View docs about adding operator role: ' + Constants.docsUrl);
            // Showing information message
            vscode.window.showInformationMessage(Constants.promptInfo + azurePortalStr, viewDocsStr, upgradeRoleStr, reportIssueStr).then((message) => {
                if (message === viewDocsStr) {
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(Constants.docsUrl));
                }
                else if (message === upgradeRoleStr) {
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(upgradeRoleUrl));
                }
                else if (message === reportIssueStr) {
                    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(Constants.reportIssueUrl));
                }
            });
            // Showing inputBox to enter ambari username and password
            const clsuterType = this.getClusterType().toLowerCase().indexOf('spark') >= 0 ? seccluster_1.SecClusterType.Spark : seccluster_1.SecClusterType.Hive;
            const linkClusterOptions = new seccluster_1.LinkedClusterOptions(seccluster_2.LinkedClusterType.AzureHDInsight, this.name, this.getConnectString(), clsuterType);
            const updatedOptions = yield seccluster_1.getAmbariClusterOptions(linkClusterOptions, `${Constants.promptInfo} ${azurePortalStr}.`);
            if (!updatedOptions) {
                throw new Error('Ambari user name or password cann\'t be empty!');
            }
            this.ambariCluster = new ambariManagedCluster_1.AmbariManagedCluster(updatedOptions.clusterName, updatedOptions.clusterUrl, updatedOptions.userName, updatedOptions.password, updatedOptions.clusterType, updatedOptions.clusterNickName);
            yield this.ambariCluster.validAuthorizationInfo();
            // update the ClusterConfig
            yield authorization_1.CredentialsManagerInstance.addLinkedCluster(this.ambariCluster, true);
            utils.log(`Link cluster ${this.ambariCluster.getName()} successfully!`, true, false);
            seccluster_1.updateLinkedClusterConfig(this.ambariCluster);
            return {
                ambairUserName: updatedOptions.userName,
                ambariPassword: updatedOptions.password
            };
        });
    }
    _getCredential() {
        return __awaiter(this, void 0, void 0, function* () {
            // for Azure cloud, get credential from treeView
            let credential = yield HdinsightTreeInfoProvider_1.getCredentialFromTreeView(this.subscriptionId);
            // for national cloud, get credential from CredentialMangerInstance
            if (!credential) {
                credential = authorization_1.CredentialsManagerInstance.getDeviceTokenCredentials(this.subscription.tenantId);
            }
            return credential;
        });
    }
}
exports.Cluster = Cluster;
function getAllCluster() {
    return __awaiter(this, void 0, void 0, function* () {
        if (authorization_1.CredentialsManagerInstance.isAcquireClusterNecessary()) {
            try {
                utils.log('Start getting HDInsight cluster(s)!', true);
                utils.setProgressMessage('getting clusters', true);
                let clusterMap = null;
                for (const sub of authorization_1.CredentialsManagerInstance.subscriptions) {
                    try {
                        const hdiClient = authorization_1.CredentialsManagerInstance.createHDInsightManagementClientWithCredentialOptional(sub);
                        clusterMap = yield getClusterFromClient(hdiClient);
                    }
                    catch (ex) {
                        // log the exception and continue acquiring clusters from other subscriptions
                        const message = utils.exceptionToString(ex);
                        utils.warn(`Getting cluster in subscription ${sub.getShortSubId()} error ${message}`, true);
                    }
                    if (clusterMap) {
                        for (const clustersInsub of clusterMap) {
                            authorization_1.CredentialsManagerInstance.addCluster(clustersInsub[0], clustersInsub[1]);
                        }
                    }
                }
                return authorization_1.CredentialsManagerInstance.clusterNames();
            }
            finally {
                utils.stopProgressMessage();
                utils.setHdiStatusBar('Azure account: ' + authorization_1.CredentialsManagerInstance.credentials['username']);
                authorization_1.CredentialsManagerInstance.disableAcquireClusterFromAD();
            }
        }
        else {
            return authorization_1.CredentialsManagerInstance.clusterNames();
        }
    });
}
exports.getAllCluster = getAllCluster;
const listClusterSchema = '%1$-40s\t%2$-30s\t%3$-25s%4$-10s';
function listClusters() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!authorization_1.CredentialsManagerInstance.isAuthorization) {
            utils.error('Please login, or run command "Azure BD: Link a Cluster" to add an attached cluster', true);
            vscode.window.showErrorMessage('Please login, or run command "Azure BD: Link a Cluster" to link a cluster');
            return;
        }
        else {
            if (authorization_1.CredentialsManagerInstance.isRequiredRefresh()) {
                yield addClustersForAzureAccount();
            }
            try {
                let clusterNams = yield getAllCluster();
                utils.log('List Azure BD cluster:', true, true);
                if (clusterNams.length === 0) {
                    utils.warn('There\'s no Azure BD cluster!', true);
                }
                else {
                    utils.logWithoutPrefix('=========================================================');
                    utils.logWithoutPrefix(clusterInfoHeaders());
                    for (const clusterName of clusterNams) {
                        let curCluster = authorization_1.CredentialsManagerInstance.getCluster(clusterName);
                        if (!curCluster) {
                            utils.logWithoutPrefix('');
                        }
                        else {
                            utils.logWithoutPrefix(yield getFormatedInformation(clusterName));
                            // print clusterName more than one line when clusterName is very long
                            let clusterNameStart = Constants.clusterNameColumnSpacinglMax;
                            let clusterFormattedName = yield curCluster.getFormattedName();
                            while (clusterNameStart < clusterFormattedName.length) {
                                utils.logWithoutPrefix(sprintf_js_1.sprintf(listClusterSchema, '', clusterFormattedName.substring(clusterNameStart, clusterNameStart + Constants.clusterNameColumnSpacinglMax), '', ''));
                                clusterNameStart += Constants.clusterNameColumnSpacinglMax;
                            }
                        }
                    }
                    utils.logWithoutPrefix('=========================================================');
                    utils.log('list cluster(s) successfully!', true);
                }
            }
            catch (err) {
                utils.error(`list cluster(s) error: ${utils.exceptionToString(err)}`, true);
            }
        }
    });
}
exports.listClusters = listClusters;
function addClustersForAzureAccount() {
    return __awaiter(this, void 0, void 0, function* () {
        const azureAccountAPI = azureAccount_1.getAzureAccountAPI();
        if (azureAccountAPI) {
            if (azureAccountAPI.status === 'LoggedIn') {
                let nodeInfoList = [];
                authorization_1.CredentialsManagerInstance.clearCachedClusters();
                let azureConfig = vscode.workspace.getConfiguration('azure').get('resourceFilter');
                if (!azureConfig) {
                    yield vscode.commands.executeCommand('azure-account.selectSubscriptions');
                    azureConfig = vscode.workspace.getConfiguration('azure').get('resourceFilter');
                    if (azureConfig) {
                        for (const num in azureConfig) {
                            const splitSubId = azureConfig[num].split('/');
                            const nodeinfo = yield HdinsightTreeInfoProvider_1.getSubscriptionWithCredFromTreeviewByID(`/subscriptions/${splitSubId[1]}`);
                            if (nodeinfo) {
                                nodeInfoList.push(nodeinfo);
                            }
                        }
                    }
                    else {
                        nodeInfoList = yield HdinsightTreeInfoProvider_1.getSubscriptionWithCredFromTreeview();
                    }
                }
                else {
                    nodeInfoList = yield HdinsightTreeInfoProvider_1.getSubscriptionWithCredFromTreeview();
                }
                utils.log('start listing cluster', true);
                utils.setProgressMessage('loading', true);
                for (let i = 0; i < nodeInfoList.length; i++) {
                    let clusterList = yield HdinsightTreeInfoProvider_2.HdinsightProvider.getInstance().getClusters(nodeInfoList[i].subscription, nodeInfoList[i].credential);
                    clusterList.forEach(cluster => {
                        authorization_1.CredentialsManagerInstance.addCluster(cluster.getName(), cluster);
                    });
                }
                utils.stopProgressMessage();
            }
        }
    });
}
exports.addClustersForAzureAccount = addClustersForAzureAccount;
function loadCluster() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            utils.log('start loading cluster', true);
            utils.setProgressMessage('loading', true);
            const subscriptionsWithCred = yield HdinsightTreeInfoProvider_1.getSubscriptionWithCredFromTreeview();
            for (let i = 0; i < subscriptionsWithCred.length; i++) {
                let clusterList = yield HdinsightTreeInfoProvider_2.HdinsightProvider.getInstance().getClusters(subscriptionsWithCred[i].subscription, subscriptionsWithCred[i].credential);
                clusterList.forEach(cluster => {
                    authorization_1.CredentialsManagerInstance.addCluster(cluster.getName(), cluster);
                });
            }
            utils.stopProgressMessage();
            utils.log('load cluster successfully', true);
        }
        catch (err) {
            utils.error(`load cluster error: ${utils.exceptionToString(err)}`, true);
        }
    });
}
exports.loadCluster = loadCluster;
function setClusters(isSpark) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!authorization_1.CredentialsManagerInstance.isAuthorization) {
            utils.error('Please login, or run command "Big Data: Link a Cluster" to add an attached cluster', true);
            vscode.window.showErrorMessage('Please login, or run command "Big Data: Link a Cluster" to add an attached cluster');
            return;
        }
        try {
            let cls = [];
            const azureAccountAPI = azureAccount_1.getAzureAccountAPI();
            if (azureAccountAPI && azureAccountAPI.status === 'LoggedIn' && authorization_1.CredentialsManagerInstance.isRequiredRefresh()) {
                cls = cls.concat(yield getAllLinuxClustersAzureAccount());
            }
            else {
                cls = cls.concat(yield getAllLinuxClusters());
            }
            if (isSpark) {
                cls = cls.filter((item) => item.isSparkCluster());
            }
            let clusterDetails = yield Promise.all(cls.map((item) => __awaiter(this, void 0, void 0, function* () {
                return {
                    label: yield item.getFormattedName(),
                    description: _getDescription(item, isSpark),
                    cluster: item
                };
            })));
            let selectedItem = yield vscode.window.showQuickPick(clusterDetails);
            if (selectedItem) {
                const formattedName = yield selectedItem.cluster.getFormattedName();
                let currentDoc = utils.getCurrentActiveDocument();
                if (currentDoc) {
                    yield newSettings_1.SettingsManagerNew.Instance.setClusterConfiguration(formattedName, currentDoc.fileName);
                    utils.log(`Set ${selectedItem.cluster.getName()} as the default job submission cluster!`, true, true);
                    let selectedCluster = authorization_1.CredentialsManagerInstance.getCluster(formattedName);
                    if (selectedCluster) {
                        commandManager_1.CommandManager.Instance.fireDefaultClusterChanged(selectedCluster);
                    }
                }
            }
        }
        catch (error) {
            utils.error(`Set default cluster errror: ${utils.exceptionToString(error)}`, true);
        }
    });
}
exports.setClusters = setClusters;
function getAllClusters() {
    return getAllCluster().then((clusterNames) => {
        return authorization_1.CredentialsManagerInstance.allClusters();
    });
}
exports.getAllClusters = getAllClusters;
function getAllLinuxClusters() {
    return getAllClusters().then((clusters) => {
        return Promise.resolve(clusters.filter(cluster => cluster.getOSType() !== 'windows'));
    });
}
exports.getAllLinuxClusters = getAllLinuxClusters;
function getAllLinuxClustersAzureAccount() {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadCluster();
        return authorization_1.CredentialsManagerInstance.allClusters().filter(cluster => cluster.getOSType() !== 'windows');
    });
}
exports.getAllLinuxClustersAzureAccount = getAllLinuxClustersAzureAccount;
function getllapClusters() {
    return getAllClusters().then((clusters) => {
        return Promise.resolve(clusters.filter((cluster) => cluster.getClusterType() === 'INTERACTIVEHIVE'));
    });
}
exports.getllapClusters = getllapClusters;
function getClusterFromClient(hdiManagementClient, subscription) {
    return __awaiter(this, void 0, void 0, function* () {
        let clusterMaps = new Map();
        const clustersListResponse = yield hdiManagementClient.clusters.list();
        if (clustersListResponse._response.status === 200) {
            const clusters = clustersListResponse._response.parsedBody;
            if (!clusters) {
                throw new Error('no clusters');
            }
            for (const cluster of clusters) {
                if (subscription) {
                    clusterMaps.set(cluster.name, Object.assign(new Cluster(cluster.name, cluster.id, subscription), cluster));
                }
                else {
                    clusterMaps.set(cluster.name, Object.assign(new Cluster(cluster.name, cluster.id), cluster));
                }
            }
            return clusterMaps;
        }
        else {
            throw new Error(`status: ${clustersListResponse._response.status.toString()}, error: ${clustersListResponse._response.bodyAsText}`);
        }
    });
}
exports.getClusterFromClient = getClusterFromClient;
function getClusterBySubscriptionAndCred(subscription, credentials) {
    return __awaiter(this, void 0, void 0, function* () {
        let clusterMap = null;
        const clusterList = [];
        try {
            const baseUrl = credentials.environment.resourceManagerEndpointUrl;
            const hdiClient = new arm_hdinsight_1.HDInsightManagementClient(credentials, subscription.getShortSubId(), { baseUri: baseUrl, userAgent: utils.getUserAgent() });
            clusterMap = yield getClusterFromClient(hdiClient, subscription);
            for (const cluster of clusterMap) {
                clusterList.push(cluster[1]);
            }
        }
        catch (ex) {
            utils.error(`get Cluster By Subscription failed: ${utils.exceptionToString(ex)}`);
        }
        return clusterList;
    });
}
exports.getClusterBySubscriptionAndCred = getClusterBySubscriptionAndCred;
function selectCluster(filePath, jobType) {
    return __awaiter(this, void 0, void 0, function* () {
        let clusterName = yield newSettings_1.SettingsManagerNew.Instance.getSelectClusterConfiguration(filePath);
        if (clusterName) {
            let selectedCluster;
            selectedCluster = authorization_1.CredentialsManagerInstance.getCluster(clusterName);
            if (!selectedCluster && (yield newSettings_1.SettingsManagerNew.Instance.getAzureEnvironment()) === environment_1.HDIEnvironment.GLOBAL.getName()) {
                if (authorization_1.CredentialsManagerInstance.isRequiredRefresh()) {
                    yield loadCluster();
                }
                selectedCluster = authorization_1.CredentialsManagerInstance.getCluster(clusterName);
            }
            if (selectedCluster && selectedCluster.isVaildType(jobType)) {
                return clusterName;
            }
        }
        let isSpark = (jobType === jobType_1.JobType.PySparkBatch || jobType === jobType_1.JobType.SparkInteractive);
        if ((yield newSettings_1.SettingsManagerNew.Instance.getAzureEnvironment()) === environment_1.HDIEnvironment.GLOBAL.getName()) {
            if (authorization_1.CredentialsManagerInstance.isRequiredRefresh()) {
                yield loadCluster();
            }
        }
        const allClusters = yield getAllLinuxClusters();
        const itemsPromise = allClusters.filter(item => item.isVaildType(jobType))
            .map((item) => __awaiter(this, void 0, void 0, function* () {
            return {
                label: yield item.getFormattedName(),
                description: _getDescription(item, isSpark),
                detail: item.getConnectString(),
                cluster: item
            };
        }));
        const quickPickItems = yield Promise.all(itemsPromise);
        const selectedItem = yield vscode.window.showQuickPick(quickPickItems);
        if (selectedItem) {
            const clusterName = yield selectedItem.cluster.getFormattedName();
            newSettings_1.SettingsManagerNew.Instance.setClusterConfiguration(clusterName, filePath);
            return clusterName;
        }
        else {
            throw new Error('No selected cluster');
        }
    });
}
exports.selectCluster = selectCluster;
function _getDescription(cluster, isSpark) {
    if (isSpark) {
        return `Spark: ${cluster.getSparkVersion()}  (${cluster.getClusterStatus()})`;
    }
    return `State: ${cluster.getClusterStatus()}`;
}
// subscription clusterName ClusterType Status
function clusterInfoHeaders() {
    return sprintf_js_1.sprintf(listClusterSchema, 'Subscription/Type', 'ClusterName', 'ClusterType', 'Status');
}
function getFormatedInformation(clusterName) {
    return __awaiter(this, void 0, void 0, function* () {
        let currCluster = authorization_1.CredentialsManagerInstance.getCluster(clusterName);
        if (currCluster) {
            let clusterTypeInfo = currCluster.getClusterType();
            if (currCluster.isSparkCluster()) {
                clusterTypeInfo = `${clusterTypeInfo}(Version: ${currCluster.getSparkVersion()})`;
            }
            if (currCluster instanceof Cluster) {
                return sprintf_js_1.sprintf(listClusterSchema, currCluster.getSubId(), (yield currCluster.getFormattedName()).length < Constants.clusterNameColumnSpacinglMax ? yield currCluster.getFormattedName() : (yield currCluster.getFormattedName()).substring(0, Constants.clusterNameColumnSpacinglMax), clusterTypeInfo, currCluster.getClusterStatus());
            }
            else {
                return sprintf_js_1.sprintf(listClusterSchema, currCluster instanceof genericLivyCluster_1.GenericLivyCluster ? 'Generic Livy' : currCluster instanceof sqlServerBigDataCluster_1.SqlServerBigDataCluster ? 'SQL Server Big Data' : 'HDInsight Cluster', (yield currCluster.getFormattedName()).length < Constants.clusterNameColumnSpacinglMax ? yield currCluster.getFormattedName() : (yield currCluster.getFormattedName()).substring(0, Constants.clusterNameColumnSpacinglMax), clusterTypeInfo, currCluster.getClusterStatus());
            }
        }
        return '';
    });
}

//# sourceMappingURL=clusters.js.map
