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
const fs = require("fs");
const request = require("request");
const jobType_1 = require("../job/jobType");
const seccluster_1 = require("./seccluster");
const utils = require("../utils");
const livyApi_1 = require("./livyApi");
const seccluster_2 = require("./seccluster");
class AmbariManagedCluster {
    constructor(clusterName, clusterUrl, userName, password, clusterType, clusterNickName) {
        this.clusterName = clusterName;
        this.clusterUrl = clusterUrl;
        this.userName = userName;
        this.password = password;
        this.clusterType = clusterType;
        this.clusterNickName = clusterNickName;
        this._sparkVersion = undefined;
        this._statementExecutionCounter = 0;
        this._activeSessionId = null;
        this._isSparkEnabled = false;
        this.linkedClusterType = seccluster_2.LinkedClusterType.AzureHDInsight;
        this.authorizationType = seccluster_1.EAuthorizationType.Basic;
        if (clusterType === seccluster_1.SecClusterType.Spark || clusterType === seccluster_1.SecClusterType.Unknown) {
            this._isSparkEnabled = true;
        }
    }
    getclusterNickName() {
        return this.clusterNickName;
    }
    getLinkedClusterType() {
        return this.linkedClusterType;
    }
    getLivyEndpoint() {
        return `${this.clusterUrl}/livy`;
    }
    getFormattedName() {
        return __awaiter(this, void 0, void 0, function* () {
            return `${this.getName()} (${yield this.getAmbariUserName()})`;
        });
    }
    httpRequest(url, type = 'GET', josnData) {
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-By': 'ambari'
        };
        let responseData = '';
        return new Promise((resolve, reject) => {
            let requestObj = this.authorizationType === seccluster_1.EAuthorizationType.Basic ? {
                method: type,
                uri: url,
                headers: headers,
                auth: { username: this.userName, password: this.password },
                json: josnData,
                rejectUnauthorized: false
            } : {
                method: type,
                uri: url,
                headers: headers,
                json: josnData,
                rejectUnauthorized: false
            };
            request(requestObj).on('error', (error) => {
                reject({
                    data: responseData,
                    error: error
                });
            }).on('data', (d) => {
                responseData += d;
            }).on('complete', (response) => {
                if (response.statusCode === 200 || response.statusCode === 201) {
                    resolve(JSON.parse(responseData));
                }
                else {
                    reject({
                        statusCode: response.statusCode,
                        message: response.statusMessage,
                        data: responseData
                    });
                }
            });
        });
    }
    isSessionCanBeWait(state) {
        return AmbariManagedCluster.sessionCanWaitStatus.indexOf(state) >= 0;
    }
    isSessionAvailable(state) {
        return state === livyApi_1.SessionState.idle;
    }
    uploadFileToStorage(filePath, remotePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileContent = fs.readFileSync(filePath).toString();
            return yield this.uploadToStorage(fileContent, remotePath);
        });
    }
    uploadToStorage(fileContent, remoteFilePath, uploadCounter = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            if (uploadCounter >= AmbariManagedCluster.MAX_UPLOAD_RETRY) {
                throw new Error(`Upload error more than ${uploadCounter} times`);
            }
            if (!this._activeSessionId) {
                this._activeSessionId = yield this.newSession();
            }
            let sessionStateAll = yield this.getSessionStateAllInfo(this._activeSessionId);
            // we will wait at most 100 secs if current session is busy
            if (this.isSessionCanBeWait(sessionStateAll.state)) {
                let counter = AmbariManagedCluster.MAX_SESSION_BUSY_RETRY;
                utils.log(`Session Retry starts, MAX_SESSION_BUSY_RETRY is ${AmbariManagedCluster.MAX_SESSION_BUSY_RETRY} `, true);
                while (counter-- >= 0) {
                    sessionStateAll = yield this.getSessionStateAllInfo(this._activeSessionId);
                    if (!this.isSessionCanBeWait(sessionStateAll.state)) {
                        break;
                    }
                    utils.log(`current retry counter is: ${counter} / ${AmbariManagedCluster.MAX_SESSION_BUSY_RETRY} `, true);
                    utils.log(`sessionState is: ${sessionStateAll.state} `, true);
                    utils.log(`id is: ${sessionStateAll.id} and appId is: ${sessionStateAll.appId} `, true);
                    utils.log(`current kind is: ${sessionStateAll.kind} `, true);
                    utils.log(`owner is: ${sessionStateAll.owner} and proxyUser is: ${sessionStateAll.proxyUser}`, true);
                    utils.log(`appinfo driverLogUrl is: ${sessionStateAll.appInfo.driverLogUrl} and appinfo sparkUiUrl is: ${sessionStateAll.appInfo.sparkUiUrl}`, true);
                    utils.log(`log is: ${sessionStateAll.log} `, true);
                    yield utils.delay(1000);
                }
                utils.log(`All retries to session has been completed, the user's script submitted as a spark session will be uploaded to storage`, true);
                if (this.isSessionCanBeWait(sessionStateAll.state) && counter < 0) {
                    // we need close current session and start a new session here
                    yield this.closeSession();
                    this._statementExecutionCounter = 0;
                    return yield this.uploadToStorage(fileContent, remoteFilePath, uploadCounter++);
                }
            }
            if (this.isSessionAvailable(sessionStateAll.state)) {
                // submit script if session available
                return yield this.executionAndWait(this._activeSessionId, fileContent, remoteFilePath);
            }
            else {
                // close the session and fire new session for the rest status of session
                yield this.closeSession();
                this._statementExecutionCounter = 0;
                yield this.uploadToStorage(fileContent, remoteFilePath, uploadCounter++);
            }
            throw new Error('upload file error');
        });
    }
    closeSession() {
        if (this._activeSessionId) {
            this.httpRequest(`${this.getLivyEndpoint()}/sessions/${this._activeSessionId}`, 'DELETE');
            this._activeSessionId = null;
        }
    }
    newSession() {
        return __awaiter(this, void 0, void 0, function* () {
            // 1 driver core and 0 executors is enough since we just do writing file action
            const data = {
                kind: 'spark',
                driverCores: 1,
                // driverMemory: '1g',
                executorCores: 1,
                // executorMemory: '1g',
                numExecutors: 1,
                heartbeatTimeoutInSecond: 10 * 60
            };
            let resposne = yield this.httpRequest(`${this.getLivyEndpoint()}/sessions`, 'POST', data);
            return resposne.id;
        });
    }
    getSessionStateAllInfo(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionState = yield this.httpRequest(`${this.getLivyEndpoint()}/sessions/${sessionId}`, 'GET');
            return sessionState;
        });
    }
    statementCanBeWait(statementStatus) {
        return statementStatus === livyApi_1.StatementStatus.running || statementStatus === livyApi_1.StatementStatus.waiting;
    }
    statementAvailable(statementStatus) {
        return statementStatus === livyApi_1.StatementStatus.available;
    }
    executionAndWait(sessionId, fileContent, remotePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const statementId = yield this.execution(sessionId, fileContent, remotePath);
            let response = null;
            let counter = AmbariManagedCluster.MAX_STATEMENT_RETRY;
            utils.log(`Statement retry starts, MAX_STATEMENT_RETRY is ${AmbariManagedCluster.MAX_STATEMENT_RETRY} `, true);
            while (counter-- >= 0) {
                response = yield this.getStatementStatus(sessionId, statementId);
                if (this.statementAvailable(response.state)) {
                    const output = response.output.data['text/plain'];
                    const lastElement = output.split('\n').filter(elem => elem.length !== 0).pop();
                    return lastElement ? lastElement : 'file not found!';
                }
                else if (!this.statementCanBeWait(response.state)) {
                    break;
                }
                utils.log(`current retry counter of STATEMENT_RETRY is: ${counter} / ${AmbariManagedCluster.MAX_STATEMENT_RETRY} `, true);
                utils.log(`response id is: ${response.id} and response state is: ${response.state} `, true);
                yield utils.delay(1000);
            }
            utils.log(`All retries to statement has been completed`, true);
            throw new Error(JSON.stringify(response));
        });
    }
    execution(sessionId, fileContent, remotePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const isFirstStatement = this._statementExecutionCounter++ === 0;
            const nonFistStatement = {
                code: `
            val file${sessionId} = fs.create(new org.apache.hadoop.fs.Path("${remotePath}"))
            file${sessionId}.writeBytes("""${fileContent}""")
            file${sessionId}.flush()
            file${sessionId}.close()
            println(fs.resolvePath(new org.apache.hadoop.fs.Path("${remotePath}")).toUri.toString)
            `
            };
            const content = {
                code: `val hadoopConf = new org.apache.hadoop.conf.Configuration()
            val fs = org.apache.hadoop.fs.FileSystem.get(hadoopConf)
            val file${sessionId} = fs.create(new org.apache.hadoop.fs.Path("${remotePath}"))
            file${sessionId}.writeBytes("""${fileContent}""")
            file${sessionId}.flush()
            file${sessionId}.close()
            println(fs.resolvePath(new org.apache.hadoop.fs.Path("${remotePath}")).toUri.toString)
        `
            };
            const statementResponse = yield this.httpRequest(`${this.getLivyEndpoint()}/sessions/${sessionId}/statements`, 'POST', isFirstStatement ? content : nonFistStatement);
            return statementResponse.id;
        });
    }
    getStatementStatus(sessionId, statementId) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield this.httpRequest(`${this.getLivyEndpoint()}/sessions/${sessionId}/statements/${statementId}`);
            return response;
        });
    }
    getAmbariUserName() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.userName;
        });
    }
    getAmbariPassword() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.password;
        });
    }
    getClusterType() {
        return this.clusterType.toString();
    }
    getName() {
        return this.clusterNickName ? this.clusterNickName + ': ' + this.clusterName : this.clusterName;
    }
    getConnectString() {
        return this.clusterUrl;
    }
    getSparkVersion() {
        return this._sparkVersion ? this._sparkVersion : 'unknown';
    }
    getOSType() {
        return 'Linux';
    }
    getClusterStatus() {
        return 'Running';
    }
    isLlapCluster() {
        return true;
    }
    isSparkCluster() {
        return this._isSparkEnabled;
    }
    // try to get cluster level configuration to valid the authorization info
    validAuthorizationInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            // trigger validation if it's not a generic livy endpoint
            if (this.linkedClusterType === seccluster_2.LinkedClusterType.AzureHDInsight) {
                yield this.ambariCredentialCheck();
                yield this.tryGetCheckSparkService();
            }
        });
    }
    ambariCredentialCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            const ambariRestUrl = `${this.clusterUrl}/api/v1/clusters`;
            yield this.httpRequest(ambariRestUrl, 'GET');
        });
    }
    tryGetCheckSparkService() {
        return __awaiter(this, void 0, void 0, function* () {
            const spark2ServiceUrl = `${this.clusterUrl}/api/v1/clusters/${this.clusterName}/services/SPARK2`;
            try {
                yield this.httpRequest(spark2ServiceUrl);
                this._isSparkEnabled = true;
                this._sparkVersion = '2.X';
            }
            catch (ex) {
                // retry to detect spark service
                if (ex['statusCode'] === 404) {
                    yield this.tryToGetSparkOneService();
                }
                else if (ex['statusCode'] === 403) {
                    // the account do not have permission to get service from ambari server if we get 403(Forbidden) here
                    // we do not have a better way to know if it is a Spark cluster
                    // so we just regard the cluster as Spark cluster
                    this._isSparkEnabled = true;
                }
            }
        });
    }
    tryToGetSparkOneService() {
        return __awaiter(this, void 0, void 0, function* () {
            const sparkServiceUrl = `${this.clusterUrl}/api/v1/clusters/${this.clusterName}/services/SPARK`;
            try {
                yield this.httpRequest(sparkServiceUrl);
                this._isSparkEnabled = true;
                this._sparkVersion = '1.X';
            }
            catch (ignored) {
                // ignore the exception
            }
        });
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
}
AmbariManagedCluster.MAX_UPLOAD_RETRY = 5;
AmbariManagedCluster.MAX_SESSION_BUSY_RETRY = 20;
AmbariManagedCluster.MAX_STATEMENT_RETRY = 10;
AmbariManagedCluster.sessionCanWaitStatus = [livyApi_1.SessionState.busy, livyApi_1.SessionState.not_started, livyApi_1.SessionState.starting];
exports.AmbariManagedCluster = AmbariManagedCluster;

//# sourceMappingURL=ambariManagedCluster.js.map
