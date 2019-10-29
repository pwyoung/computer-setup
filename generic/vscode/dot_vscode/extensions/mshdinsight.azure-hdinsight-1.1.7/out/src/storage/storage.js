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
const msStorage = require("azure-storage-legacy");
const adlsManagement = require("azure-arm-datalake-store");
const arm_storage_1 = require("@azure/arm-storage");
const vscode = require("vscode");
const opener = require("opener");
const stHelper = require("../storage/storageHelper");
const utils = require("../utils");
const authorization_1 = require("../azure/authorization");
const common_1 = require("../common");
const Constants = require("../constants/constants");
const authorization_2 = require("../azure/authorization");
exports.storageKeyRegexp = new RegExp('^fs\.azure\.account\.key.([^\.]*)\.blob\.core\.(windows|chinacloudapi|usgovcloudapi)\.(net|cn|de)$');
exports.blobStorageRegexp = new RegExp('^(wasbs|wasb)://([^@]*)@(([^\.]*)\.blob\.core\.(windows|chinacloudapi|usgovcloudapi|cloudapi)\.(net|cn|de))$');
exports.adlsGen2Regexp = new RegExp('^(abfss|abfs)://([^@]*)@(([^\.]*)\.dfs\.core\.(windows|chinacloudapi|usgovcloudapi|cloudapi)\.(net|cn|de))$');
class AdlsConfiguration {
    constructor(configurations) {
        if (configurations && configurations['clusterIdentity']) {
            let clusterIdentity = configurations['clusterIdentity'];
            this.applicationId = clusterIdentity['clusterIdentity.applicationId'];
            this.certificateStr = clusterIdentity['clusterIdentity.certificate'];
            this.addTenantId = clusterIdentity['clusterIdentity.aadTenantId'];
            this.resourceUri = clusterIdentity['clusterIdentity.resourceUri'];
            this.certificatePassword = clusterIdentity['clusterIdentity.certificatePassword'];
        }
        else {
            throw new Error('adls configuration error');
        }
    }
}
exports.AdlsConfiguration = AdlsConfiguration;
class AmbariConfigOptions {
}
exports.AmbariConfigOptions = AmbariConfigOptions;
class HdiStorage {
    constructor(config, ambariConfig) {
        this._isAdls = false;
        this._isAdlsGen2 = false;
        this._storageKeys = [];
        if (!ambariConfig) {
            var coreSite = config['core-site'];
            var gateway = config['gateway'];
        }
        else {
            coreSite = config;
        }
        for (let key in coreSite) {
            // get storage access key for blob storage
            if (key.startsWith('fs.azure.account.key.')) {
                let info = key.match(exports.storageKeyRegexp);
                if (!info || info.length <= 1) {
                    utils.error(`parse storage account error: ${JSON.stringify(key)}`);
                    throw Error('parse storage account error');
                }
                this.putStorageKey(info[1], coreSite[key]);
            }
            else if (key.startsWith('fs.defaultFS')) {
                let value = coreSite[key];
                // adls start with 'adl://home'
                if (value.startsWith('adl://home')) {
                    this._adlsHomeHostName = coreSite['dfs.adls.home.hostname'];
                    this._adlsHomeMountpont = coreSite['dfs.adls.home.mountpoint'];
                    this._isAdls = true;
                    this._adlsConfig = new AdlsConfiguration(config);
                }
                else {
                    // blob storage or adls gen2
                    let info = value.match(exports.blobStorageRegexp);
                    if (!info) {
                        info = value.match(exports.adlsGen2Regexp);
                        this._isAdlsGen2 = true;
                    }
                    if (!info || info.length <= 6) {
                        utils.error(`parse storage account error: ${JSON.stringify(key)}`);
                        throw Error('parse storage account error');
                    }
                    this._defaultContainerFullPath = value;
                    this._schema = info[1];
                    this._defaultContainer = info[2];
                    this._defaultStorageWithDnsSuffix = info[3];
                    this._defaultStorageAccountName = info[4];
                }
            }
        }
        if (!ambariConfig) {
            this._ambariUserName = gateway['restAuthCredential.username'];
            this._ambariPasswd = gateway['restAuthCredential.password'];
        }
        else {
            this._ambariUserName = ambariConfig.ambairUserName;
            this._ambariPasswd = ambariConfig.ambariPassword;
        }
    }
    // getters
    get isAdls() {
        return this._isAdls;
    }
    get isAdlsGen2() {
        return this._isAdlsGen2;
    }
    getStorageKey() {
        return this._storageKeys;
    }
    getDefaultStorageAccountName() {
        return this._defaultStorageAccountName;
    }
    get defaultContainer() {
        if (this.isAdls) {
            throw new Error('not supporeted for ADLS storage');
        }
        return this._defaultContainer;
    }
    get defaultStorageWithDnsSuffix() {
        if (this.isAdls) {
            throw new Error('not supporeted for ADLS storage');
        }
        return this._defaultStorageWithDnsSuffix;
    }
    get adlsHomeHostName() {
        if (this.isAdls) {
            return this._adlsHomeHostName;
        }
        throw new Error('not supported for non ADLS storage');
    }
    get adlsHomeMountpont() {
        if (this.isAdls) {
            return this._adlsHomeMountpont;
        }
        throw new Error('not supporeted for non ADLS storage');
    }
    get adlsConfig() {
        if (!this.isAdls) {
            throw Error('Default Storage is not ADLS. the action is not supported here');
        }
        return this._adlsConfig;
    }
    get ambariUserName() {
        return this._ambariUserName;
    }
    get ambariPasswd() {
        return this._ambariPasswd;
    }
    // end of getters
    getDefaultStorageFullPath(relativePath) {
        if (this.isAdls) {
            return `adl://${this.adlsHomeHostName}/${this.adlsHomeMountpont}/${relativePath}`;
        }
        else {
            return `${this._defaultContainerFullPath}/${relativePath}`;
        }
    }
    // for adls gen2 storage
    getAdlsGen2RestUrl() {
        if (!this.isAdlsGen2) {
            throw new Error('Only support ADLS Gen2 storage');
        }
        else {
            return `https://${this._defaultStorageWithDnsSuffix}/${this._defaultContainer}`;
        }
    }
    // for adls only
    getAdlsStorageName() {
        if (!this.isAdls) {
            throw new Error('Not supported for non ADLS storage');
        }
        if (this._adlsHomeHostName) {
            return this._adlsHomeHostName.split('.')[0];
        }
        else {
            throw new Error(`ADLS configuration error: ${this._adlsHomeHostName}`);
        }
    }
    // for blob storage only
    getDefaultConnectString() {
        let storageKey = this.getDefaultStorageKey();
        let endpoints = this.getAllBlobEndpoint();
        return `DefaultEndpointsProtocol=https;AccountName=${this._defaultStorageAccountName};AccountKey=${storageKey};${endpoints}`;
    }
    getAllBlobEndpoint() {
        let storageName = this._defaultStorageAccountName;
        let storageSuffix = authorization_1.CredentialsManagerInstance.hdiEnvironment.getStorageSuffix();
        let blobEndpoint = `${storageName}.blob${storageSuffix}`;
        let queueEndpoint = `${storageName}.queue${storageSuffix}`;
        let tableEndpoint = `${storageName}.table${storageSuffix}`;
        return `BlobEndpoint=${blobEndpoint};QueueEndpoint=${queueEndpoint};TableEndpoint=${tableEndpoint}`;
    }
    getDefaultStorageKey() {
        let storage = this._storageKeys.find(storageKeyInfo => storageKeyInfo.storageName === this._defaultStorageAccountName);
        if (!storage) {
            throw Error(`default storage ${this._defaultStorageAccountName} can not find`);
        }
        return storage.storageKey;
    }
    putStorageKey(storageName, storageKey) {
        this._storageKeys.push(new StorageKey(storageName, storageKey));
    }
    getStorageAccessKeyWithNoCred(storageNameWithDnsSuffix) {
        return __awaiter(this, void 0, void 0, function* () {
            let storageKey = null;
            if (authorization_2.keytar) {
                storageKey = yield authorization_2.keytar.getPassword(authorization_2.keytarServiceName, storageNameWithDnsSuffix);
            }
            // TODO: get access key with credential/subscription automatically, refer the following getDefaultStorageAccessKeyWithCred()
            if (!storageKey) {
                storageKey = yield this.inputDefaultStorageAccessKey();
            }
            if (authorization_2.keytar) {
                yield authorization_2.keytar.setPassword(authorization_2.keytarServiceName, storageNameWithDnsSuffix, storageKey);
            }
            this.putStorageKey(this.getDefaultStorageAccountName(), storageKey);
            return storageKey;
        });
    }
    // for adls gen2, need get access key with credential or input manually
    getDefaultStorageAccessKeyWithCred(credential, subscriptionId, resourceGroupName) {
        return __awaiter(this, void 0, void 0, function* () {
            let defaultStorageAccessKey;
            const storageManagementClient = new arm_storage_1.StorageManagementClient(credential, subscriptionId);
            try {
                const response = yield storageManagementClient.storageAccounts.listKeys(resourceGroupName, this.getDefaultStorageAccountName());
                if (response._response.status === 200) {
                    defaultStorageAccessKey = response.keys[0]['value'];
                }
                else {
                    // for current version SDK, returned response.status will always be 200, so this else-branch will not be hit
                    utils.log(`status: ${response._response.status.toString()}, error: ${response._response.bodyAsText}`);
                    defaultStorageAccessKey = yield this.inputDefaultStorageAccessKey();
                }
            }
            catch (err) {
                utils.error(err['message']);
                defaultStorageAccessKey = yield this.inputDefaultStorageAccessKey();
            }
            if (authorization_2.keytar) {
                yield authorization_2.keytar.setPassword(authorization_2.keytarServiceName, this.defaultStorageWithDnsSuffix, defaultStorageAccessKey);
            }
            this.putStorageKey(this.getDefaultStorageAccountName(), defaultStorageAccessKey);
            return defaultStorageAccessKey;
        });
    }
    inputDefaultStorageAccessKey() {
        return __awaiter(this, void 0, void 0, function* () {
            const info = `Need view and copy access key for Storage account '${this._defaultStorageAccountName}' from Azure portal`;
            const viewDocsStr = 'View Docs';
            const reportIssueStr = 'Report Issue';
            // const copyKeyStr = 'Copy Key';
            // TODO: Make up the copy key link in Portalo would be a better experience
            // const portalUrl = this.getAdlsGen2RestUrl
            // const copyKeyUrl = `${portalUrl}/#@${this.subscription.tenantId}/resource${this.id}/users`;
            // Showing info in the output 
            utils.log(`View docs about accessing storage key: ${Constants.getStorageAccessKeyHelpLink}`);
            // Showing information message
            vscode.window.showInformationMessage(info, viewDocsStr, reportIssueStr).then((message) => {
                if (message === viewDocsStr) {
                    opener(Constants.getStorageAccessKeyHelpLink);
                }
                else if (message === reportIssueStr) {
                    opener(Constants.reportIssueUrl);
                    // } else if (message === copyKeyStr) {
                    //     opener(Constants.getStorageAccessKeyHelpLink);
                }
            });
            // Showing inputBox to enter storage key
            const newStorageAccessKey = yield utils.vscodeInputBoxActionWithRetry(() => vscode.window.showInputBox({
                ignoreFocusOut: true,
                prompt: 'Please input storage access key:',
                validateInput: (value) => {
                    if (value) {
                        if (value.trim() === '') {
                            return `Storage access key couldn't be empty!`;
                        }
                        return null;
                    }
                    return 'Invalid storage access key';
                }
            }), `Storage access key couldn't be empty`);
            if (!newStorageAccessKey) {
                throw new Error(`Storage access key couldn't be empty`);
            }
            return newStorageAccessKey;
        });
    }
}
exports.HdiStorage = HdiStorage;
class StorageKey {
    constructor(storageName, storageKey) {
        this.storageName = storageName;
        this.storageKey = storageKey;
    }
    getStorageName() {
        return this.storageName;
    }
}
exports.StorageKey = StorageKey;
class ClusterWithResult {
    constructor(cluster, result) {
        this.cluster = cluster;
        this.result = result;
    }
}
exports.ClusterWithResult = ClusterWithResult;
function fileExists(cluster, hdiStorage, remotePath) {
    let def = common_1.createDeferred();
    if (hdiStorage.isAdls && hdiStorage.adlsConfig) {
        return stHelper.getTokenCredentials(hdiStorage.adlsConfig)
            .then((tokenCredentials) => {
            let fileSystemClient = new adlsManagement.DataLakeStoreFileSystemClient(tokenCredentials);
            // read and write access to adls is required here.
            let remoteFilePath = `${hdiStorage.adlsHomeMountpont}/${remotePath}`;
            fileSystemClient.fileSystem.getFileStatus(hdiStorage.getAdlsStorageName(), remoteFilePath, (error, result, request, response) => {
                if (error) {
                    def.resolve(false);
                }
                else {
                    def.resolve(true);
                }
            });
            return def.promise;
        });
    }
    else {
        let blobService = msStorage.createBlobService(hdiStorage.getDefaultConnectString());
        blobService.getBlobMetadata(hdiStorage.defaultContainer, remotePath, (error, blob, response) => {
            if (error) {
                def.resolve(false);
            }
            else {
                def.resolve(true);
            }
        });
    }
    return def.promise;
}
exports.fileExists = fileExists;
function readFileToString(cluster, hdiStorage, remotePath) {
    let def = common_1.createDeferred();
    if (hdiStorage.isAdls && hdiStorage.adlsConfig) {
        return stHelper.getTokenCredentials(hdiStorage.adlsConfig)
            .then((tokenCredentials) => {
            let fileSystemClient = new adlsManagement.DataLakeStoreFileSystemClient(tokenCredentials);
            if (!hdiStorage.adlsHomeMountpont) {
                throw Error(`mount point of adls storage ${hdiStorage.adlsHomeHostName} can not find`);
            }
            // read and write access to adls is required here.
            return fileSystemClient.fileSystem.checkAccess(hdiStorage.getAdlsStorageName(), hdiStorage.adlsHomeMountpont, 'r--')
                .then(() => {
                let remoteFilePath = `${hdiStorage.adlsHomeMountpont}/${remotePath}`;
                fileSystemClient.fileSystem.open(hdiStorage.getAdlsStorageName(), remoteFilePath, (error, result, request, response) => {
                    if (response && result) {
                        let code = response['statusCode'];
                        if (code === 201 || code === 200) {
                            let text = '';
                            result.on('data', (chunk) => {
                                text += chunk;
                            });
                            result.on('end', () => {
                                def.resolve(text);
                            });
                        }
                        else {
                            def.reject(response);
                        }
                    }
                    else {
                        def.reject(error);
                    }
                });
                return def.promise;
            });
        });
    }
    else {
        let blobService = msStorage.createBlobService(hdiStorage.getDefaultConnectString());
        blobService.getBlobToText(hdiStorage.defaultContainer, remotePath, function (error, text, blockBlob, response) {
            if (error) {
                utils.error(JSON.stringify(error));
                def.reject();
            }
            else {
                def.resolve(text);
            }
        });
        return def.promise;
    }
}
exports.readFileToString = readFileToString;
function getClusterStorageInfo(config, ambariConfig) {
    let hdiStorage = new HdiStorage(config, ambariConfig);
    return hdiStorage;
}
exports.getClusterStorageInfo = getClusterStorageInfo;

//# sourceMappingURL=storage.js.map
