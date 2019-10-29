'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const azure_common_1 = require("azure-common");
const utils = require("../utils");
const newSettings_1 = require("../newSettings");
const genericLivyCluster_1 = require("../cluster/genericLivyCluster");
const sqlServerBigDataCluster_1 = require("../cluster/sqlServerBigDataCluster");
class LivyClient extends azure_common_1.Service {
    constructor(cluster, credentials) {
        super(credentials);
        this.cluster = cluster;
        this.credentials = credentials;
        this.operator = new JobOperations(this);
    }
}
exports.LivyClient = LivyClient;
class LivyLog {
    getSize() {
        return this.total ? this.total : this.size;
    }
}
exports.LivyLog = LivyLog;
/**
 *
 *     name	        |                  description	                        |      type
 *   file	        |   File containing the application to execute	        | path (required)
 *    proxyUser	    |User to impersonate when running the job	            |string
 *    className	    |Application Java/Spark main class	                    |string
 *    args	        |   Command line arguments for the application	        |list of strings
 *    jars	        |   jars to be used in this session	                    |List of string
 *    pyFiles	        |Python files to be used in this session	            |List of string
 *    files	        |files to be used in this session	                    |List of string
 *    driverMemory    |	Amount of memory to use for the driver process	    |string
 *    driverCores	    |Number of cores to use for the driver process	        |int
 *    executorMemory  |	Amount of memory to use per executor process	    |string
 *    executorCores   |	Number of cores to use for each executor	        |int
 *    numExecutors    |	Number of executors to launch for this session	    |int
 *    archives	    |Archives to be used in this session	                |List of string
 *    queue	        |   The name of the YARN queue to which submitted	    |string
 *    name	        |The name of this session	                            |string
 *    conf	        |Spark configuration properties
 */
class LivyParamters {
    constructor(fullRemoteFilePath) {
        this.file = fullRemoteFilePath;
    }
    // propertry start with '_' will be ignored
    toJsonString() {
        const livyConfigurations = newSettings_1.SettingsManagerNew.Instance.getSparkConfiguration();
        for (const key in livyConfigurations) {
            if (livyConfigurations[key]) {
                this[key] = livyConfigurations[key];
            }
            else {
                delete livyConfigurations[key];
            }
        }
        utils.log(`Livy Configuration \n${JSON.stringify(livyConfigurations, undefined, 2)}`);
        return JSON.stringify(this, (key, value) => {
            return key.startsWith('_') ? undefined : value;
        });
    }
}
exports.LivyParamters = LivyParamters;
class JobOperations {
    constructor(client) {
        this.client = client;
    }
    httpRequest(url, type, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let httpRequest = new azure_common_1.WebResource();
            httpRequest.method = type;
            httpRequest.headers = {};
            httpRequest.url = url;
            httpRequest.rejectUnauthorized = false;
            if (type === 'POST') {
                if (options && options.body) {
                    httpRequest.body = options.body;
                }
                else {
                    throw Error('Http body is required in POST model');
                }
            }
            // Set Headers
            httpRequest.headers['accept'] = (options && options.accept) ? options['accept'] : 'application/json';
            httpRequest.headers['Content-Type'] = (options && options.contentType) ? options['Content-Type'] : 'application/text';
            httpRequest.headers['X-Requested-By'] = 'ambari';
            httpRequest.headers['useragent'] = utils.getUserAgent();
            httpRequest.headers['User-Agent'] = utils.getUserAgent();
            httpRequest.headers['user-agent'] = utils.getUserAgent();
            return new Promise((resolve, reject) => {
                this.client['pipeline'](httpRequest, (error, result) => {
                    if (error) {
                        reject({ error: error, response: result });
                    }
                    else if (result.statusCode === 200 || result.statusCode === 201) {
                        resolve(result);
                    }
                    else {
                        reject({ response: result });
                    }
                });
            });
        });
    }
    getJobLogs(batchId) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = `${this.client.cluster.getLivyEndpoint()}/batches/${batchId}/log`;
            return yield this.httpRequest(url, 'GET');
        });
    }
    getApplicationId(message) {
        let matchResult = message.match(JobOperations.APP_ID_REGEX);
        return matchResult && matchResult.length === 2 ? matchResult[1] : null;
    }
    getIntervalTime(times) {
        let interval = JobOperations.MIN_INTERVAL_TIME + times * JobOperations.INC_TIME;
        return interval > JobOperations.MAX_INTERVAL_TIME ? JobOperations.MAX_INTERVAL_TIME : interval;
    }
    getInferredUILink(cluster, appid) {
        if (cluster instanceof genericLivyCluster_1.GenericLivyCluster) {
            const url = cluster.getLivyEndpoint();
            let matchResult = url.match(JobOperations.genericLivyRegx);
            if (matchResult) {
                const urlPrefix = matchResult[1];
                return {
                    inferred: true,
                    sparkui: `${urlPrefix}:18080/history/${appid}`,
                    yarnui: `${urlPrefix}:8088/cluster/apps/${appid}`
                };
            }
            matchResult = url.match(JobOperations.arisEndpoing);
            if (matchResult) {
                const urlPrefix = matchResult[1];
                const clusterName = matchResult[2];
                return {
                    inferred: true,
                    sparkui: `${urlPrefix}/${clusterName}/sparkhistory/history/${appid}`,
                    yarnui: `${urlPrefix}/${clusterName}/yarn/cluster/apps/${appid}`
                };
            }
        }
        else if (cluster instanceof sqlServerBigDataCluster_1.SqlServerBigDataCluster) {
            return {
                inferred: true,
                sparkui: `${this.client.cluster.getConnectString()}/gateway/default/sparkhistory`,
                yarnui: `${this.client.cluster.getConnectString()}/gateway/default/yarn/cluster/app/${this.appId}`
            };
        }
        return {
            inferred: false,
            sparkui: `${this.client.cluster.getConnectString()}/sparkhistory`,
            yarnui: `${this.client.cluster.getConnectString()}/yarnui/hn/cluster/app/${this.appId}`
        };
    }
    handleJobLogSteamingly(bathId) {
        return __awaiter(this, void 0, void 0, function* () {
            let preSize = -1, lineCount = 0;
            // utils.logclear();
            utils.log('======================Begin printing out spark job log.=======================', true);
            let times = 0;
            while (true) {
                try {
                    let result = yield this.getJobLogs(bathId);
                    let liveLog = Object.assign(new LivyLog(), JSON.parse(result['body']));
                    if (preSize === liveLog.getSize()) {
                        result = yield this.getJobStatus(bathId);
                        let messageBody = JSON.parse(result['body']);
                        let jobStatus = messageBody['state'].toLowerCase();
                        if (jobStatus === 'success' || jobStatus === 'error' || jobStatus === 'dead') {
                            utils.logAppendLine('');
                            utils.log('======================end printing out spark job log.=======================', true);
                            if (jobStatus === 'success') {
                                utils.log(`Job ${this.appId} ends up with success!`, true);
                            }
                            else if (jobStatus === 'error' || jobStatus === 'dead') {
                                utils.error(`job ${this.appId} ends up with failure!`, true);
                            }
                            const inferredUILink = this.getInferredUILink(this.client.cluster, this.appId);
                            utils.log(`${inferredUILink.inferred ? 'Inferred' : ''} Spark UI: ${inferredUILink.sparkui}`, true);
                            utils.log(`${inferredUILink.inferred ? 'Inferred' : ''} Yarn UI: ${inferredUILink.yarnui}`, true);
                            return { appId: this.appId, status: jobStatus };
                        }
                    }
                    preSize = liveLog.getSize();
                    let lineLength = liveLog.log.length;
                    if (!this.appId) {
                        liveLog.log.forEach(line => {
                            let appId = this.getApplicationId(line);
                            if (appId) {
                                this.appId = appId;
                            }
                        });
                    }
                    utils.logAppend(liveLog.log.slice(lineCount, lineLength).join(os.EOL));
                    lineCount = lineLength;
                    let timeInterval = this.getIntervalTime(++times);
                    yield utils.delay(timeInterval);
                }
                catch (ex) {
                    utils.warn(utils.exceptionToString(ex), true);
                    break;
                }
            }
            return undefined;
        });
    }
    getJobStatus(batchId) {
        return this.httpRequest(`${this.client.cluster.getLivyEndpoint()}/batches/${batchId}`, 'GET');
    }
    submitSparkJobWithParamters(paramters) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = `${this.client.cluster.getLivyEndpoint()}/batches`;
            let paramterString = paramters.toJsonString();
            return yield this.httpRequest(url, 'POST', { body: paramterString });
        });
    }
}
JobOperations.MAX_INTERVAL_TIME = 5000;
JobOperations.MIN_INTERVAL_TIME = 1000;
JobOperations.INC_TIME = 100;
// example message: Application report for application_1500294782280_0098 (state: ACCEPTED)
JobOperations.APP_ID_REGEX = new RegExp('Application report for ([^ ]*) \\(state: ACCEPTED\\)');
JobOperations.genericLivyRegx = new RegExp('(^https?:\/\/[^:]*):?([0-9]*)?\/?$', 'i');
JobOperations.arisEndpoing = new RegExp('(^https?:\/\/[^:]*:[0-9]*\/gateway)\/([^/]*)\/livy\/?', 'i');
exports.JobOperations = JobOperations;
function uploadFileToStorage(cluster, localFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        let index = localFilePath.lastIndexOf('/') + 1;
        if (index === 0) {
            index = localFilePath.lastIndexOf('\\') + 1;
        }
        const fileName = localFilePath.substring(index);
        const releativeRemotePath = `spark_job_fromvscode/${utils.generateUuid()}/${fileName}`;
        utils.log(`upload local file ${localFilePath} to storage`, true);
        const fullRemotePath = yield cluster.uploadFileToStorage(localFilePath, releativeRemotePath);
        const clusterFormattedName = yield cluster.getFormattedName();
        yield newSettings_1.SettingsManagerNew.Instance.setClusterConfiguration(clusterFormattedName, localFilePath);
        utils.log(`upload file to ${fullRemotePath} successfully!`, true);
        return fullRemotePath;
    });
}

//# sourceMappingURL=livyClient.js.map
