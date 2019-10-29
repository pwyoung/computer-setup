"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The AzureEnvironment definition is from ms-rest-azure, which is a dependency of vscode-azuretensionui.
 * It's different from the new definition in @ms-rest-azure-env.
 */
class AzureEnvironment {
}
/**
 * Initializes a new instance of the AzureEnvironment class.
 * @param {string} parameters.name - The Environment name
 * @param {string} parameters.portalUrl - The management portal URL
 * @param {string} parameters.managementEndpointUrl - The management service endpoint
 * @param {string} parameters.resourceManagerEndpointUrl - The resource management endpoint
 * @param {string} parameters.activeDirectoryEndpointUrl - The Active Directory login endpoint
 * @param {string} parameters.activeDirectoryResourceId - The resource ID to obtain AD tokens for (token audience)
 * @param {string} [parameters.publishingProfileUrl] - The publish settings file URL
 * @param {string} [parameters.sqlManagementEndpointUrl] - The sql server management endpoint for mobile commands
 * @param {string} [parameters.sqlServerHostnameSuffix] - The dns suffix for sql servers
 * @param {string} [parameters.galleryEndpointUrl] - The template gallery endpoint
 * @param {string} [parameters.activeDirectoryGraphResourceId] - The Active Directory resource ID
 * @param {string} [parameters.activeDirectoryGraphApiVersion] - The Active Directory api version
 * @param {string} [parameters.storageEndpointSuffix] - The endpoint suffix for storage accounts
 * @param {string} [parameters.keyVaultDnsSuffix] - The keyvault service dns suffix
 * @param {string} [parameters.azureDataLakeStoreFileSystemEndpointSuffix] - The data lake store filesystem service dns suffix
 * @param {string} [parameters.azureDataLakeAnalyticsCatalogAndJobEndpointSuffix] - The data lake analytics job and catalog service dns suffix
 * @param {bool} [parameters.validateAuthority] - Determines whether the authentication endpoint should
 * be validated with Azure AD. Default value is true.
 */
AzureEnvironment.Azure = {
    name: 'Azure',
    portalUrl: 'https://portal.azure.com',
    publishingProfileUrl: 'https://go.microsoft.com/fwlink/?LinkId=254432',
    managementEndpointUrl: 'https://management.core.windows.net',
    resourceManagerEndpointUrl: 'https://management.azure.com/',
    sqlManagementEndpointUrl: 'https://management.core.windows.net:8443/',
    sqlServerHostnameSuffix: '.database.windows.net',
    galleryEndpointUrl: 'https://gallery.azure.com/',
    activeDirectoryEndpointUrl: 'https://login.microsoftonline.com/',
    activeDirectoryResourceId: 'https://management.core.windows.net/',
    activeDirectoryGraphResourceId: 'https://graph.windows.net/',
    activeDirectoryGraphApiVersion: '2013-04-05',
    storageEndpointSuffix: '.core.windows.net',
    keyVaultDnsSuffix: '.vault.azure.net',
    azureDataLakeStoreFileSystemEndpointSuffix: 'azuredatalakestore.net',
    azureDataLakeAnalyticsCatalogAndJobEndpointSuffix: 'azuredatalakeanalytics.net'
};
AzureEnvironment.AzureChina = {
    name: 'AzureChina',
    portalUrl: 'https://portal.azure.cn',
    publishingProfileUrl: 'https://go.microsoft.com/fwlink/?LinkID=301774',
    managementEndpointUrl: 'https://management.core.chinacloudapi.cn',
    resourceManagerEndpointUrl: 'https://management.chinacloudapi.cn',
    sqlManagementEndpointUrl: 'https://management.core.chinacloudapi.cn:8443/',
    sqlServerHostnameSuffix: '.database.chinacloudapi.cn',
    galleryEndpointUrl: 'https://gallery.chinacloudapi.cn/',
    activeDirectoryEndpointUrl: 'https://login.chinacloudapi.cn/',
    activeDirectoryResourceId: 'https://management.core.chinacloudapi.cn/',
    activeDirectoryGraphResourceId: 'https://graph.chinacloudapi.cn/',
    activeDirectoryGraphApiVersion: '2013-04-05',
    storageEndpointSuffix: '.core.chinacloudapi.cn',
    keyVaultDnsSuffix: '.vault.azure.cn',
    // TODO: add dns suffixes for the china cloud for datalake store and datalake analytics once they are defined.
    azureDataLakeStoreFileSystemEndpointSuffix: 'N/A',
    azureDataLakeAnalyticsCatalogAndJobEndpointSuffix: 'N/A'
};
AzureEnvironment.AzureUSGovernment = {
    name: 'AzureUSGovernment',
    portalUrl: 'https://portal.azure.us',
    publishingProfileUrl: 'https://manage.windowsazure.us/publishsettings/index',
    managementEndpointUrl: 'https://management.core.usgovcloudapi.net',
    resourceManagerEndpointUrl: 'https://management.usgovcloudapi.net',
    sqlManagementEndpointUrl: 'https://management.core.usgovcloudapi.net:8443/',
    sqlServerHostnameSuffix: '.database.usgovcloudapi.net',
    galleryEndpointUrl: 'https://gallery.usgovcloudapi.net/',
    activeDirectoryEndpointUrl: 'https://login.microsoftonline.us/',
    activeDirectoryResourceId: 'https://management.core.usgovcloudapi.net/',
    activeDirectoryGraphResourceId: 'https://graph.windows.net/',
    activeDirectoryGraphApiVersion: '2013-04-05',
    storageEndpointSuffix: '.core.usgovcloudapi.net',
    keyVaultDnsSuffix: '.vault.usgovcloudapi.net',
    azureDataLakeStoreFileSystemEndpointSuffix: 'N/A',
    azureDataLakeAnalyticsCatalogAndJobEndpointSuffix: 'N/A'
};
AzureEnvironment.AzureGermanCloud = {
    name: 'AzureGermanCloud',
    portalUrl: 'https://portal.microsoftazure.de/',
    publishingProfileUrl: 'https://manage.microsoftazure.de/publishsettings/index',
    managementEndpointUrl: 'https://management.core.cloudapi.de',
    resourceManagerEndpointUrl: 'https://management.microsoftazure.de',
    sqlManagementEndpointUrl: 'https://management.core.cloudapi.de:8443/',
    sqlServerHostnameSuffix: '.database.cloudapi.de',
    galleryEndpointUrl: 'https://gallery.cloudapi.de/',
    activeDirectoryEndpointUrl: 'https://login.microsoftonline.de/',
    activeDirectoryResourceId: 'https://management.core.cloudapi.de/',
    activeDirectoryGraphResourceId: 'https://graph.cloudapi.de/',
    activeDirectoryGraphApiVersion: '2013-04-05',
    storageEndpointSuffix: '.core.cloudapi.de',
    keyVaultDnsSuffix: '.vault.microsoftazure.de',
    azureDataLakeStoreFileSystemEndpointSuffix: 'N/A',
    azureDataLakeAnalyticsCatalogAndJobEndpointSuffix: 'N/A'
};
exports.AzureEnvironment = AzureEnvironment;
class AzureEnvironmentUtil {
    static getAllSupportedEnv() {
        return HDIEnvironment.HDIEnvironmentGroup.map(env => env.getName());
    }
    // get HDIEnvironment object by Azure Environment name in Node SDK
    static getEnvironmentByAzureEnvName(name) {
        return HDIEnvironment.HDIEnvironmentGroup.find(env => env.getAzureEnvironmentName().toLowerCase() === name.toLowerCase());
    }
    // get HDIEnvironment object by friendly HDIEnvironment name, which seen by users
    static getEnvironmentByFriendlyName(name) {
        if (name) {
            return HDIEnvironment.HDIEnvironmentGroup.find(env => env.getName().toLowerCase() === name.toLowerCase());
        }
        return undefined;
    }
}
exports.AzureEnvironmentUtil = AzureEnvironmentUtil;
class HDIEnvironment {
    constructor(_endpoints, _envName, _azureEnv) {
        this._endpoints = _endpoints;
        this._envName = _envName;
        this._azureEnv = _azureEnv;
    }
    // this _envName is for display
    getName() {
        return this._envName;
    }
    getAzureEnvironmentName() {
        return this.getAzureEnvironment().name;
    }
    getClusterConnectionFormat() {
        return this._endpoints.get('connectionString');
    }
    getBlobFullNameFormat() {
        return this._endpoints.get('blobFullName');
    }
    getManagementUrl() {
        return this.getAzureEnvironment().resourceManagerEndpointUrl;
    }
    getPortal() {
        return this.getAzureEnvironment().portalUrl;
    }
    getStorageSuffix() {
        return this.getAzureEnvironment().storageEndpointSuffix;
    }
    getAADEndpointUrl() {
        return this.getAzureEnvironment().activeDirectoryEndpointUrl;
    }
    getAzureEnvironment() {
        return this._azureEnv;
    }
}
// the _envName is used for display, different from _azureEnv.name
HDIEnvironment.GLOBAL = new HDIEnvironment(new Map([
    ['connectionString', `https://%s.azurehdinsight.net/`],
    ['blobFullName', '%s.blob.core.windows.net']
]), 'Azure', AzureEnvironment.Azure);
HDIEnvironment.CHINA = new HDIEnvironment(new Map([
    ['connectionString', 'https://%s.azurehdinsight.cn/'],
    ['blobFullName', '%s.blob.core.chinacloudapi.cn']
]), 'Azure China', AzureEnvironment.AzureChina);
HDIEnvironment.US_GOVERNMENT = new HDIEnvironment(new Map([
    ['connectionString', 'https://%s.azurehdinsight.us/'],
    ['blobFullName', '%s.blob.core.usgovcloudapi.net']
]), 'Azure US Government', AzureEnvironment.AzureUSGovernment);
HDIEnvironment.GERMANY = new HDIEnvironment(new Map([
    ['connectionString', 'https://%s.azurehdinsight.de/'],
    ['blobFullName', '%s.blob.core.cloudapi.de']
]), 'Azure Germany', AzureEnvironment.AzureGermanCloud);
HDIEnvironment.HDIEnvironmentGroup = [HDIEnvironment.GLOBAL, HDIEnvironment.CHINA, HDIEnvironment.US_GOVERNMENT, HDIEnvironment.GERMANY];
exports.HDIEnvironment = HDIEnvironment;

//# sourceMappingURL=environment.js.map
