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
const ms_rest_nodeauth_1 = require("@azure/ms-rest-nodeauth");
const adal_node_1 = require("adal-node");
const tokenCache_1 = require("./tokenCache");
const arm_hdinsight_1 = require("@azure/arm-hdinsight");
const environment_1 = require("../azure/environment");
const authorization_1 = require("./authorization");
const utils = require("../utils");
class BasicAmbariCredentials {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }
    signRequest(webResource, callback) {
        webResource.auth = {
            username: this.username,
            password: this.password
        };
        callback(null);
    }
}
exports.BasicAmbariCredentials = BasicAmbariCredentials;
class Subscription {
    getShortSubId() {
        let slics = this.id.split('/');
        return slics[slics.length - 1];
    }
}
exports.Subscription = Subscription;
class DeviceCodeCredentials extends ms_rest_nodeauth_1.DeviceTokenCredentials {
}
exports.DeviceCodeCredentials = DeviceCodeCredentials;
var AuthenticationStatus;
(function (AuthenticationStatus) {
    AuthenticationStatus[AuthenticationStatus["Login"] = 0] = "Login";
    AuthenticationStatus[AuthenticationStatus["Loginning"] = 1] = "Loginning";
    AuthenticationStatus[AuthenticationStatus["Logout"] = 2] = "Logout";
    AuthenticationStatus[AuthenticationStatus["Unknown"] = 3] = "Unknown";
})(AuthenticationStatus = exports.AuthenticationStatus || (exports.AuthenticationStatus = {}));
class CredentialsManager {
    constructor() {
        // AD authentication status
        this._authenticationStatus = AuthenticationStatus.Unknown;
        // memory cache for AD
        this.tokenCache = new adal_node_1.MemoryCache();
        this._hdiEnvironment = environment_1.HDIEnvironment.GLOBAL;
        // true if the authentication information is recovering from keytar cache
        this._isFromCachedToken = false;
        this._clusters = new Map();
        this._adManagedClusterNames = [];
        this._linkedClusterNames = new Set();
        // true if at least one of the ambari managed cluster is linked from current extension lifetime    
        this._isLinkedConfChanged = false;
        // false if we tried acquiring cluster from AD
        this._isAcquireClusterNecessary = true;
    }
    canTriggerAuthenication() {
        return this.authenticationStatus === AuthenticationStatus.Logout || this.authenticationStatus === AuthenticationStatus.Unknown;
    }
    get authenticationStatus() {
        return this._authenticationStatus;
    }
    set authenticationStatus(status) {
        this._authenticationStatus = status;
    }
    get isFromCachedToken() {
        return this._isFromCachedToken;
    }
    set isFromCachedToken(v) {
        this._isFromCachedToken = v;
    }
    get hdiEnvironment() {
        return this._hdiEnvironment;
    }
    set hdiEnvironment(env) {
        this._hdiEnvironment = env;
    }
    get credentials() {
        return this._credentials;
    }
    set credentials(creds) {
        this._credentials = creds;
    }
    get subscriptions() {
        return this._subscriptions;
    }
    set subscriptions(subs) {
        this._subscriptions = subs;
    }
    isRequiredRefresh() {
        return this.allClusters().length === this.linkedClusterNames().length;
    }
    /** Get device token credential by domain/Azure AD id
     * @param {string} domin - Azure AD id
     */
    getDeviceTokenCredentials(domain) {
        return this.credentials.find(credential => credential.domain === domain);
    }
    /**
     * Get a selected HDInsight by cluster formatted name
     *  for Ambari managed cluster, it should be `MyClusterName (Linked)`
     *  for AD managed cluster, it should be `MyClusterName`
     * @param clusterFormattedname
     */
    getCluster(formattedClusterName) {
        return this._clusters.get(formattedClusterName);
    }
    /**
     * Get all the HDInsight clusters
     */
    allClusters() {
        return Array.from(this._clusters.values());
    }
    /**
     * Logout operation. Clean AD managed cluster
     * Ambari managed cluster will not be unlinked.
     * @returns {boolean} true if authentication info been cleaned successfully
     */
    clearAuthorizationInfo() {
        if (!this.isAuthorization) {
            return false;
        }
        this._hdiEnvironment = environment_1.HDIEnvironment.GLOBAL;
        this._adManagedClusterNames.forEach(name => this._clusters.delete(name));
        this._adManagedClusterNames = [];
        this.subscriptions = [];
        this.credentials = [];
        this.authenticationStatus = AuthenticationStatus.Logout;
        // reset the flag incase login operation is triggered again
        this._isAcquireClusterNecessary = true;
        return true;
    }
    /**
     * Clear cached clusters
     */
    clearCachedClusters() {
        this._adManagedClusterNames.forEach(name => this._clusters.delete(name));
        this._adManagedClusterNames = [];
    }
    /**
     * is link a new cluster or not during current extension lifetime
     */
    isLinkedNewCluster() {
        return this._isLinkedConfChanged;
    }
    /**
     * putting AD managed cluster to cluster List
     * @param name cluster name
     * @param cluster
     */
    addCluster(name, cluster) {
        this._clusters.set(name, cluster);
        // check duplicated clusterName
        if (!this._adManagedClusterNames.find((item) => item === name)) {
            this._adManagedClusterNames.push(name);
        }
        this._adManagedClusterNames = this._adManagedClusterNames.sort();
    }
    /**
     * putting Ambari managed cluster to cluster list
     * @param cluster
     * @param isFromCached is recoverring from local configuration or not
     */
    addLinkedCluster(cluster, isLinkNewCluster = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = yield cluster.getFormattedName();
            this._clusters.set(key, cluster);
            this._linkedClusterNames.add(key);
            this._isLinkedConfChanged = isLinkNewCluster;
        });
    }
    /**
     * remove a linked cluster from cluster list
     * @param clusterFormatedName cluster formated name
     */
    removeLinkedCluster(clusterFormatedName) {
        return __awaiter(this, void 0, void 0, function* () {
            const selectedCluster = this._clusters.get(clusterFormatedName);
            if (selectedCluster) {
                this._clusters.delete(clusterFormatedName);
                this._linkedClusterNames.delete(clusterFormatedName);
                this._isLinkedConfChanged = true;
                const accountKey = `${selectedCluster.getConnectString()}\t${yield selectedCluster.getAmbariUserName()}`;
                return authorization_1.keytar && (yield authorization_1.keytar.deletePassword(authorization_1.keytarServiceName, accountKey));
            }
            return false;
        });
    }
    isAuthorization() {
        return this.authenticationStatus === AuthenticationStatus.Login || this._linkedClusterNames.size !== 0;
    }
    clusterNames() {
        return this.linkedClusterNames().concat(this._adManagedClusterNames);
    }
    /**
     * We should disable acquiring cluster after the very fist time
     */
    disableAcquireClusterFromAD() {
        this._isAcquireClusterNecessary = false;
    }
    isAcquireClusterNecessary() {
        return this.authenticationStatus === AuthenticationStatus.Login && this._isAcquireClusterNecessary;
    }
    linkedClusterNames() {
        return Array.from(this._linkedClusterNames.values());
    }
    createHDInsightManagementClientWithCredentialOptional(sub, credential) {
        let cred = credential ? credential : this.getDeviceTokenCredentials(sub.tenantId);
        const baseUrl = this.hdiEnvironment.getManagementUrl();
        const client = new arm_hdinsight_1.HDInsightManagementClient(cred, sub.getShortSubId(), { baseUri: baseUrl, userAgent: utils.getUserAgent() });
        return client;
    }
    updateSessions(tokenResponses) {
        return __awaiter(this, void 0, void 0, function* () {
            yield tokenCache_1.clearTokenCache(this.tokenCache);
            for (const tokenResponse of tokenResponses) {
                yield tokenCache_1.addTokenToCache(this.tokenCache, tokenResponse);
            }
        });
    }
}
exports.CredentialsManager = CredentialsManager;

//# sourceMappingURL=authInfo.js.map
