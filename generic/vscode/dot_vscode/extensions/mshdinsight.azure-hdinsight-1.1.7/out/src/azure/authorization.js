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
const vscode = require("vscode");
const cp = require("child_process");
const copypaste = require("copy-paste");
const adal_node_1 = require("adal-node");
const opener = require("opener");
const arm_subscriptions_1 = require("@azure/arm-subscriptions");
const tokenCache_1 = require("./tokenCache");
const utils = require("../utils");
const commandManager_1 = require("../controllers/commandManager");
const environment_1 = require("../azure/environment");
const telemetry_1 = require("../telemetry");
const seccluster_1 = require("../cluster/seccluster");
const authInfo_1 = require("./authInfo");
const newSettings_1 = require("../newSettings");
const HdinsightTreeInfoProvider_1 = require("../treeView/HdinsightTreeInfoProvider");
const azureAccount_1 = require("../azure/azureAccount");
const hiveController_1 = require("../controllers/hiveController");
const environment_2 = require("./environment");
exports.azureClientId = '04b07795-8ddb-461a-bbee-02f9e1bf7b46'; // from nodejs SDK
exports.keytarServiceName = 'HDInsight on VSCode';
exports.keytarAccountName = 'devicelogin';
exports.keytar = getCoreNodeModule('keytar');
/**
 * Helper function that returns a node module installed with VSCode, or null if it fails.
 */
function getCoreNodeModule(moduleName) {
    try {
        return require(`${vscode.env.appRoot}/node_modules.asar/${moduleName}`);
    }
    catch (ignored) {
        // ignore the exception since keytar didn't work.
    }
    try {
        return require(`${vscode.env.appRoot}/node_modules/${moduleName}`);
    }
    catch (ignored) {
        // ignore the exception since keytar didn't work.
    }
    return null;
}
exports.CredentialsManagerInstance = new authInfo_1.CredentialsManager();
function loginFromCachedRefreshToken() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            utils.log('recovering authentication status', true);
            utils.setProgressMessage('loading', true);
            exports.CredentialsManagerInstance.credentials = yield initializeFromRefreshToken();
            exports.CredentialsManagerInstance.isFromCachedToken = true;
            exports.CredentialsManagerInstance.authenticationStatus = authInfo_1.AuthenticationStatus.Login;
        }
        catch (ignored) {
            // switch to a new line
            utils.logAppendLine('');
            utils.warn('no recovering authentication info!', true);
            utils.warn('Please login using Azure credential, or run command "Big Data: Link a Cluster" using Ambari credential', true);
            // ignore the exception of gettting token from cached refresh token 
        }
    });
}
function displayTreeAndAskForLogin(context) {
    return __awaiter(this, void 0, void 0, function* () {
        hiveController_1.getOrCreateHiveController(context);
        yield HdinsightTreeInfoProvider_1.registerHdInsightTreeView(context);
        const azureAccountAPI = azureAccount_1.getAzureAccountAPI();
        if (azureAccountAPI) {
            yield vscode.commands.executeCommand('setContext', 'hdinsight.displayTreeview', true);
            if (azureAccountAPI.status === 'LoggedIn') {
                yield vscode.commands.executeCommand('setContext', 'hdinsight.authorization', true);
            }
            else {
                yield vscode.commands.executeCommand('azure-account.askForLogin');
            }
        }
    });
}
exports.displayTreeAndAskForLogin = displayTreeAndAskForLogin;
function loginCheck(isAuto = false, context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield seccluster_1.recoverLinkedClusters();
        }
        catch (ignored) {
            // ignore the exception
        }
        const azureEnv = newSettings_1.SettingsManagerNew.Instance.getAzureEnvironment();
        // if azureEnvironment is global then show the treeview
        const azureAccountAPI = azureAccount_1.getAzureAccountAPI();
        if (azureAccountAPI && azureEnv === '') {
            if (azureAccountAPI.status === 'LoggedIn') {
                hiveController_1.getOrCreateHiveController(context);
                yield HdinsightTreeInfoProvider_1.registerHdInsightTreeView(context);
                yield newSettings_1.SettingsManagerNew.Instance.setAzureEnvironment(environment_1.HDIEnvironment.GLOBAL.getName());
                yield vscode.commands.executeCommand('setContext', 'hdinsight.displayTreeview', true);
                yield vscode.commands.executeCommand('setContext', 'hdinsight.authorization', true);
            }
        }
        else if (azureEnv === environment_1.HDIEnvironment.GLOBAL.getName()) {
            displayTreeAndAskForLogin(context);
        }
        else {
            login(isAuto, context);
        }
    });
}
exports.loginCheck = loginCheck;
/**
 * login to Azure AD by device code
 * @param isAuto true if authentication is trigger by our code, not customer
 */
function login(isAuto = false, context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!exports.CredentialsManagerInstance.canTriggerAuthenication()) {
            // just ingore the login action here
            const azureAccountAPI = azureAccount_1.getAzureAccountAPI();
            if (azureAccountAPI) {
                if (azureAccountAPI.status === 'LoggedIn') {
                    return;
                }
            }
            else {
                return;
            }
        }
        exports.CredentialsManagerInstance.authenticationStatus = authInfo_1.AuthenticationStatus.Loginning;
        try {
            if (isAuto) {
                yield loginFromCachedRefreshToken();
                if (exports.CredentialsManagerInstance.credentials) {
                    exports.CredentialsManagerInstance.subscriptions = yield getSubscriptions();
                }
            }
            else {
                utils.log('start Authentication...', true, true);
                utils.setProgressMessage('loading', true);
                const env = yield environmentSelect(context);
                if (!env) {
                    return;
                }
                else if (env.getAzureEnvironmentName() === environment_2.AzureEnvironment.Azure.name) {
                    exports.CredentialsManagerInstance.hdiEnvironment = env;
                    yield displayTreeAndAskForLogin(context);
                }
                else {
                    exports.CredentialsManagerInstance.hdiEnvironment = env;
                    const deviceCodeInfo = yield getDeviceCodeInfo();
                    const message = showDeviceCodeMessage(deviceCodeInfo);
                    const login = loginWithDeviceCode(deviceCodeInfo);
                    const tokenResponse = yield Promise.race([login, message.then(() => login)]);
                    const refreshToken = tokenResponse.refreshToken;
                    exports.CredentialsManagerInstance.credentials = yield getTokensFromToken(tokenResponse);
                    const userName = exports.CredentialsManagerInstance.credentials[0].username;
                    if (userName) {
                        utils.setHdiStatusBar('Azure account: ' + userName);
                    }
                    if (exports.keytar && refreshToken) {
                        yield exports.keytar.setPassword(exports.keytarServiceName, exports.keytarAccountName, `${exports.CredentialsManagerInstance.hdiEnvironment.getName()}\t${refreshToken}`);
                    }
                    if (exports.CredentialsManagerInstance.credentials) {
                        exports.CredentialsManagerInstance.subscriptions = yield getSubscriptions();
                    }
                }
            }
        }
        catch (err) {
            utils.error(`authentication error: ${utils.exceptionToString(err)}`, true);
            vscode.window.showWarningMessage('We may have an authentication issue here! Please login using Azure credential, or run command "Big Data: Link a Cluster" using Ambari credential.');
        }
        finally {
            utils.stopProgressMessage();
            const azureAccountAPI = azureAccount_1.getAzureAccountAPI();
            if (azureAccountAPI) {
                if (azureAccountAPI.status === 'LoggedIn' && (yield newSettings_1.SettingsManagerNew.Instance.getAzureEnvironment()) === environment_1.HDIEnvironment.GLOBAL.getName()) {
                    utils.log('Authenticate successfully!', true);
                }
                else if (azureAccountAPI.status === 'LoggedOut' && (yield newSettings_1.SettingsManagerNew.Instance.getAzureEnvironment()) === environment_1.HDIEnvironment.GLOBAL.getName()) {
                    utils.log('Authentication cancelled!', true);
                }
            }
            if (exports.CredentialsManagerInstance.credentials && exports.CredentialsManagerInstance.credentials.length !== 0) {
                exports.CredentialsManagerInstance.authenticationStatus = authInfo_1.AuthenticationStatus.Login;
                utils.log('Authenticate successfully!', true);
                commandManager_1.CommandManager.Instance.fireAuthorizationStatusChanged(true);
            }
            else {
                exports.CredentialsManagerInstance.authenticationStatus = authInfo_1.AuthenticationStatus.Logout;
            }
        }
    });
}
exports.login = login;
/**
 * List subscriptions from all tenants
 */
function getSubscriptions() {
    return __awaiter(this, void 0, void 0, function* () {
        const subscriptions = [];
        for (const cred of exports.CredentialsManagerInstance.credentials) {
            const client = new arm_subscriptions_1.SubscriptionClient(cred, { baseUri: `${exports.CredentialsManagerInstance.hdiEnvironment.getManagementUrl()}`, userAgent: utils.getUserAgent() });
            try {
                const subs = yield client.subscriptions.list();
                for (const sub of subs) {
                    let subscription = Object.assign(new authInfo_1.Subscription(), sub);
                    subscription.tenantId = cred.domain;
                    subscriptions.push(subscription);
                }
            }
            catch (ex) {
                // just show the exception for further debugging and continue getting subscription
                const message = `Listing subscriptions in domain: ${cred.domain} error: ${utils.exceptionToString(ex)}`;
                utils.warn(message, true);
                vscode.window.showWarningMessage(message);
            }
        }
        return subscriptions;
    });
}
/**
 * get device code info from `common` tenant id
 */
function getDeviceCodeInfo() {
    return new Promise((resolve, reject) => {
        const cache = new adal_node_1.MemoryCache();
        const aadEndpointUrl = exports.CredentialsManagerInstance.hdiEnvironment.getAADEndpointUrl();
        const manageMentUrl = exports.CredentialsManagerInstance.hdiEnvironment.getManagementUrl();
        const context = new adal_node_1.AuthenticationContext(`${aadEndpointUrl}common`, true, cache);
        context.acquireUserCode(manageMentUrl, exports.azureClientId, 'en-us', (err, response) => {
            if (err) {
                reject({ error: err, response: response });
            }
            else {
                resolve(response);
            }
        });
    });
}
function showDeviceCodeMessage(deviceLogin) {
    return __awaiter(this, void 0, void 0, function* () {
        const copyAndOpen = 'Copy & Open';
        const open = 'Open';
        const canCopy = process.platform !== 'linux' || (yield exitCode('xclip', '-version')) === 0;
        utils.log(deviceLogin.message, true);
        const response = yield vscode.window.showInformationMessage(deviceLogin.message, canCopy ? copyAndOpen : open);
        if (response === copyAndOpen) {
            copypaste.copy(deviceLogin.userCode);
            opener(deviceLogin.verificationUrl);
        }
        else if (response === open) {
            opener(deviceLogin.verificationUrl);
        }
        else {
            return Promise.reject(null);
        }
    });
}
function loginWithDeviceCode(deviceLogin) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const cache = new adal_node_1.MemoryCache();
            const aadEndpointUrl = exports.CredentialsManagerInstance.hdiEnvironment.getAADEndpointUrl();
            const manageMentUrl = exports.CredentialsManagerInstance.hdiEnvironment.getManagementUrl();
            const context = new adal_node_1.AuthenticationContext(`${aadEndpointUrl}common`, true, cache);
            context.acquireTokenWithDeviceCode(`${manageMentUrl}`, exports.azureClientId, deviceLogin, function (err, tokenResponse) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(tokenResponse);
                }
            });
        });
    });
}
function environmentSelect(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let environmentName = newSettings_1.SettingsManagerNew.Instance.getAzureEnvironment();
        let selectedEnv = environment_1.AzureEnvironmentUtil.getEnvironmentByFriendlyName(environmentName);
        if (selectedEnv) {
            return selectedEnv;
        }
        else {
            let selectedEvnName = yield vscode.window.showQuickPick(environment_1.AzureEnvironmentUtil.getAllSupportedEnv());
            // log the selected environment to workspace settings
            if (selectedEvnName) {
                yield newSettings_1.SettingsManagerNew.Instance.setAzureEnvironment(selectedEvnName);
            }
            return environment_1.AzureEnvironmentUtil.getEnvironmentByFriendlyName(selectedEvnName);
        }
    });
}
function initializeFromRefreshToken() {
    return __awaiter(this, void 0, void 0, function* () {
        telemetry_1.TelemetryManager.Instance.enqueueTelemetryMsg('CommandExe', { Action: 'hdinsight.autoLogin' });
        let envNameWithrefreshToken = exports.keytar && (yield exports.keytar.getPassword(exports.keytarServiceName, exports.keytarAccountName));
        if (envNameWithrefreshToken) {
            let [envName, refreshToken] = envNameWithrefreshToken.split('\t');
            if (envName || refreshToken) {
                let selectedEvnironment = environment_1.AzureEnvironmentUtil.getEnvironmentByFriendlyName(envName);
                if (!selectedEvnironment) {
                    throw new Error(`unmatched environment ${envName}`);
                }
                exports.CredentialsManagerInstance.hdiEnvironment = selectedEvnironment;
                const tokenResponse = yield getTokenFromRefreshToken(refreshToken);
                return yield getTokensFromToken(tokenResponse);
            }
        }
        throw new Error('Getting cached refresh token error');
    });
}
function getTokenFromRefreshToken(refreshToken, tenantId = 'common') {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenCache = new adal_node_1.MemoryCache();
        const context = new adal_node_1.AuthenticationContext(`${exports.CredentialsManagerInstance.hdiEnvironment.getAADEndpointUrl()}${tenantId}`, true, tokenCache);
        return new Promise((resolve, reject) => {
            context.acquireTokenWithRefreshToken(refreshToken, exports.azureClientId, null, (error, response) => {
                if (error) {
                    reject({ error: error, response: response });
                }
                else {
                    resolve(response);
                }
            });
        });
    });
}
/**
 *
 * @param firstTokenResponse token from `common` tenant
 * @param tenantId account tenant id
 */
function getTokensFromToken(firstTokenResponse, tenantId = 'common') {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenResponses = [firstTokenResponse];
        const tokenCache = new adal_node_1.MemoryCache();
        yield tokenCache_1.addTokenToCache(tokenCache, firstTokenResponse);
        const credentials = new ms_rest_nodeauth_1.DeviceTokenCredentials(exports.azureClientId, undefined, firstTokenResponse.userId, undefined, exports.CredentialsManagerInstance.hdiEnvironment.getAzureEnvironment(), tokenCache);
        const client = new arm_subscriptions_1.SubscriptionClient(credentials, { baseUri: `${exports.CredentialsManagerInstance.hdiEnvironment.getManagementUrl()}` });
        const tenants = yield client.tenants.list();
        for (const tenant of tenants) {
            if (tenant.tenantId !== firstTokenResponse.tenantId) {
                const tokenResponse = yield getTokenFromRefreshToken(firstTokenResponse.refreshToken, tenant.tenantId);
                tokenResponses.push(tokenResponse);
            }
        }
        exports.CredentialsManagerInstance.updateSessions(tokenResponses);
        return tokenResponses.map(tokenResponse => {
            return new authInfo_1.DeviceCodeCredentials(exports.azureClientId, tokenResponse.tenantId, tokenResponse.userId, undefined, exports.CredentialsManagerInstance.hdiEnvironment.getAzureEnvironment(), tokenCache);
        });
    });
}
function logout(disableNotification) {
    return __awaiter(this, void 0, void 0, function* () {
        if (exports.CredentialsManagerInstance.clearAuthorizationInfo()) {
            try {
                if (exports.keytar) {
                    yield exports.keytar.deletePassword(exports.keytarServiceName, exports.keytarAccountName);
                }
            }
            finally {
                if (!disableNotification) {
                    vscode.window.showInformationMessage('Logout successfully!');
                }
                commandManager_1.CommandManager.Instance.fireAuthorizationStatusChanged(false);
            }
        }
        else {
            if (!disableNotification) {
                vscode.window.showWarningMessage('no authentication information!');
            }
        }
    });
}
exports.logout = logout;
function setAzureEnvironment(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const azureAccountAPI = azureAccount_1.getAzureAccountAPI();
        const result = yield vscode.window.showQuickPick(environment_1.AzureEnvironmentUtil.getAllSupportedEnv());
        if (result) {
            yield newSettings_1.SettingsManagerNew.Instance.setAzureEnvironment(result);
            // If user set environment as global, then trigger treeview
            if (result === environment_1.HDIEnvironment.GLOBAL.getName()) {
                if (exports.CredentialsManagerInstance.isAuthorization()) {
                    yield logout(true);
                }
                yield vscode.commands.executeCommand('setContext', 'hdinsight.displayTreeview', true);
                displayTreeAndAskForLogin(context);
            }
            else {
                yield vscode.commands.executeCommand('setContext', 'hdinsight.displayTreeview', false);
                if (azureAccountAPI) {
                    if (azureAccountAPI.status === 'LoggedIn') {
                        yield vscode.commands.executeCommand('azure-account.logout');
                    }
                }
                yield login(false, context);
            }
        }
    });
}
exports.setAzureEnvironment = setAzureEnvironment;
function exitCode(command, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            cp.spawn(command, args)
                .on('error', err => resolve())
                .on('exit', code => resolve(code));
        });
    });
}
exports.exitCode = exitCode;

//# sourceMappingURL=authorization.js.map
