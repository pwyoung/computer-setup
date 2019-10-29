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
const msHDIJob = require("azure-arm-hdinsight-jobs");
const azure_common_1 = require("azure-common");
const vscode = require("vscode");
const fs = require("fs");
const os = require("os");
const path = require("path");
const utils = require("../utils");
const common_1 = require("../common");
const authorization_1 = require("../azure/authorization");
const authInfo_1 = require("../azure/authInfo");
const storage = require("../storage/storage");
const ConnectionSettings_1 = require("../controllers/ConnectionSettings");
const jobType_1 = require("../job/jobType");
const jobStatusManager_1 = require("../job/jobStatusManager");
const livyClient_1 = require("../spark/livyClient");
const clusters_1 = require("../cluster/clusters");
const tezApplicationIdPatternFor31 = new RegExp('Executing on YARN cluster with App id (application_[0-9]*_[0-9]*)');
const tezApplicationIdPatternFor32 = new RegExp('Status: Running \\(application id: (application_[0-9]*_[0-9]*)\\)');
class HiveJobParameters {
}
function getHiveMetadata(controller, hiveData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const username = yield hiveData.cluster.getAmbariUserName();
            const password = yield hiveData.cluster.getAmbariPassword();
            const connectString = hiveData.cluster.getConnectString();
            let connSettings = new ConnectionSettings_1.ConnectionSettings(connectString, username, password);
            yield controller.onRunQueryHiveInfo(connSettings, hiveData);
        }
        catch (error) {
            utils.error(`get connect settings error: ${utils.exceptionToString(error)}`);
        }
    });
}
exports.getHiveMetadata = getHiveMetadata;
function hiveQuery(controller, isSelectAll = false) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!authorization_1.CredentialsManagerInstance.isAuthorization) {
            utils.error('Please login, or run command "Big Data: Link a Cluster" to add an attached cluster', true);
            vscode.window.showErrorMessage('Please login, or run command "Big Data: Link a Cluster" to add an attached cluster');
            return;
        }
        try {
            let document = utils.getCurrentActiveDocument();
            let clusterName = yield clusters_1.selectCluster(document.fileName, jobType_1.JobType.HiveInteractive);
            if (!clusterName) {
                utils.error('cluster name can not be null', true);
                return;
            }
            let selectedcluster = authorization_1.CredentialsManagerInstance.getCluster(clusterName);
            if (!selectedcluster) {
                utils.error(`HDInsight cluster ${clusterName} can not find`, true);
                return;
            }
            else {
                const userName = yield selectedcluster.getAmbariUserName();
                const password = yield selectedcluster.getAmbariPassword();
                // the basic-auth cluster doesn't have this 'authorizationType' field, so needs to set true
                const isAuthorized = selectedcluster['authorizationType'] === 'None' ? false : true;
                let connSettings = new ConnectionSettings_1.ConnectionSettings(selectedcluster.getConnectString(), userName, password, isAuthorized);
                controller.onRunQuery(connSettings, undefined, isSelectAll);
            }
        }
        catch (error) {
            utils.error(`submit Hive Query error: ${utils.exceptionToString(error)}`, true);
        }
    });
}
exports.hiveQuery = hiveQuery;
function submitSparkDotnetJobInternal(clusterName, zipFilePath, jarFilePath, className, args, udfFilePaths) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!clusterName) {
            throw new Error('cluster name can not be null');
        }
        utils.log(`start submitting spark dotnet job to cluster ${clusterName}`, true, true);
        let cluster = authorization_1.CredentialsManagerInstance.getCluster(clusterName);
        if (!cluster) {
            throw new Error(`Cluster ${clusterName} not found!`);
        }
        if (!cluster.isSparkCluster()) {
            vscode.window.showErrorMessage(`the default cluster ${cluster.getName()} is not Spark cluster!`);
            throw new Error(`the default cluster ${cluster.getName()} is not Spark cluster!`);
        }
        const zipRemotePath = yield utils.uploadFileToStorage(cluster, zipFilePath);
        const jarRemotePath = yield utils.uploadFileToStorage(cluster, jarFilePath);
        let udfRemotePaths = "";
        const udfList = udfFilePaths.split(",");
        yield Promise.all(udfList.map((udfLocal) => __awaiter(this, void 0, void 0, function* () {
            if (cluster) {
                let currentUdfRemotePath = yield utils.uploadFileToStorage(cluster, udfLocal);
                udfRemotePaths += udfRemotePaths.length > 0 ? `,${currentUdfRemotePath}` : `${currentUdfRemotePath}`;
            }
        })));
        const paramters = new livyClient_1.LivyParamters(jarRemotePath);
        const userName = yield cluster.getAmbariUserName();
        const password = yield cluster.getAmbariPassword();
        const ambariCredentials = new authInfo_1.BasicAmbariCredentials(userName, password);
        const livyClient = new livyClient_1.LivyClient(cluster, ambariCredentials);
        paramters.className = className;
        paramters.args = [zipRemotePath];
        paramters.args = paramters.args.concat(args.split(","));
        if (!!udfRemotePaths && udfFilePaths.length > 0) {
            paramters.files = [udfRemotePaths];
        }
        const result = yield livyClient.operator.submitSparkJobWithParamters(paramters);
        const messageBody = result['body'];
        const batchId = JSON.parse(messageBody)['id'];
        if (!batchId) {
            throw new Error('no batch job generated!');
        }
        utils.log(`Job start successfully with batch Id ${batchId}`, true);
        let appResult = yield livyClient.operator.handleJobLogSteamingly(batchId);
        if (appResult && appResult.status !== 'success') {
            // appid could be null if no initialization of SparkContext
            vscode.window.showErrorMessage(`Spark application ${appResult.appId ? appResult.appId : ''} ended up with ${appResult.status}`);
        }
    });
}
function submitPysparkJobInternal(clusterName, filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!clusterName) {
            throw new Error('cluster name can not be null');
        }
        utils.log(`start submitting spark application to cluster ${clusterName}`, true, true);
        let cluster = authorization_1.CredentialsManagerInstance.getCluster(clusterName);
        if (!cluster) {
            throw new Error(`Cluster ${clusterName} not found!`);
        }
        if (!cluster.isSparkCluster()) {
            vscode.window.showErrorMessage(`the default cluster ${cluster.getName()} is not Spark cluster!`);
            throw new Error(`the default cluster ${cluster.getName()} is not Spark cluster!`);
        }
        const fullRemotePath = yield utils.uploadFileToStorage(cluster, filePath);
        const paramters = new livyClient_1.LivyParamters(fullRemotePath);
        const userName = yield cluster.getAmbariUserName();
        const password = yield cluster.getAmbariPassword();
        const ambariCredentials = new authInfo_1.BasicAmbariCredentials(userName, password);
        const livyClient = new livyClient_1.LivyClient(cluster, ambariCredentials);
        const result = yield livyClient.operator.submitSparkJobWithParamters(paramters);
        const messageBody = result['body'];
        const batchId = JSON.parse(messageBody)['id'];
        if (!batchId) {
            throw new Error('no batch job generated!');
        }
        utils.log(`Job start successfully with batch Id ${batchId}`, true);
        let appResult = yield livyClient.operator.handleJobLogSteamingly(batchId);
        if (appResult && appResult.status !== 'success') {
            // appid could be null if no initialization of SparkContext
            vscode.window.showErrorMessage(`Spark application ${appResult.appId ? appResult.appId : ''} ended up with ${appResult.status}`);
        }
    });
}
function submitPysparkJob(clusterName, fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            jobStatusManager_1.JobStatusManager.Instance.setToRunStatus();
            yield submitPysparkJobInternal(clusterName, fileName);
        }
        catch (error) {
            utils.error(utils.exceptionToString(error), true);
        }
        finally {
            jobStatusManager_1.JobStatusManager.Instance.setToStopStatus();
        }
    });
}
exports.submitPysparkJob = submitPysparkJob;
// file Name is zip file
function submitSparkDotnetToRemote(clusterName, zipFilePath, jarFilePath, className, args, udfFilePaths) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            jobStatusManager_1.JobStatusManager.Instance.setToRunStatus();
            yield submitSparkDotnetJobInternal(clusterName, zipFilePath, jarFilePath, className, args, udfFilePaths);
        }
        catch (error) {
            utils.error(utils.exceptionToString(error), true);
        }
        finally {
            utils.stopProgressMessage();
            fs.unlink(`${zipFilePath}`, (err) => {
                if (err) {
                    utils.log(`Failed to delete temp zip ${zipFilePath} due to{$err}. Please delete it manually.`);
                }
            });
        }
    });
}
exports.submitSparkDotnetToRemote = submitSparkDotnetToRemote;
function previewQuery(controller, queryStringMaps) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!authorization_1.CredentialsManagerInstance.isAuthorization) {
            utils.error('Please login, or run command "Big Data: Link a Cluster" to add an attached cluster', true);
            vscode.window.showErrorMessage('Please login, or run command "Big Data: Link a Cluster" to add an attached cluster');
            return;
        }
        try {
            // clusterName, title will surely exist while in preview mode
            let clusterName = queryStringMaps.get('clusterName');
            let title = queryStringMaps.get('title');
            let previewFolder = path.join(os.tmpdir(), 'previewFolder');
            if (!fs.existsSync(previewFolder)) {
                fs.mkdirSync(previewFolder);
            }
            // '.xhql' is to prevent caching files that are needed for sending hive query when expending tree node
            // related path: wrapper\hivewrapper\Microsoft.HDInsight.Hive.Data.Wrapper\Workspace\Workspace.cs
            // uri is the script path for running preview.
            let uri = path.join(previewFolder, clusterName + title + '.xhql');
            queryStringMaps.set('uri', uri);
            fs.writeFileSync(uri, 'SELECT * FROM ' + title + ' LIMIT 100');
            let selectedcluster = authorization_1.CredentialsManagerInstance.getCluster(clusterName);
            if (!selectedcluster) {
                utils.error(`HDInsight cluster ${clusterName} can not find`, true);
                return;
            }
            else {
                const userName = yield selectedcluster.getAmbariUserName();
                const password = yield selectedcluster.getAmbariPassword();
                // Since preview mode only works for cluster on the tree explorer, so it needs to be set true
                const isAuthorized = true;
                let connSettings = new ConnectionSettings_1.ConnectionSettings(selectedcluster.getConnectString(), userName, password, isAuthorized);
                // While in preivew mode, use node.treeDataProvider.refresh to display 'Starting' which requires await function
                yield controller.onRunQuery(connSettings, undefined, false, queryStringMaps);
            }
        }
        catch (error) {
            utils.error(`submit interactive Preview Query error: ${utils.exceptionToString(error)}`, true);
        }
    });
}
exports.previewQuery = previewQuery;
// export async function submitHiveJob(clusterName: string, script: string, isFileContent?: Boolean) {
//     if (!clusterName) {
//         utils.error('cluster name can not be null');
//         return;
//     }
//     let selectedcluster = CredentialsManagerInstance.clusters.get(clusterName);
//     if (!selectedcluster) {
//         utils.error(`HDInsight cluster ${clusterName} can not find`);
//         return;
//     }
//     JobStatusManager.Instance.setToRunStatus();
//     try {
//         const cluster = <Cluster>selectedcluster;
//         const hiveJobParameters: HiveJobParameters = new HiveJobParameters();
//         const hdiStorage = await selectedcluster.getStorage();
//         const clusterWithResult: storage.ClusterWithResult = isFileContent ?                         
//                         new storage.ClusterWithResult(cluster, { content: script })
//                         : await _uploadHiveScriptToStorage(cluster, hdiStorage, script); 
//         // check the storage path
//         const additionalStorage = await clusterWithResult.cluster.getStorage();
//         if (!additionalStorage) {
//             throw new Error('no storage');
//         }
//         hiveJobParameters.userName = 'admin';
//         // submit with script content
//         if (clusterWithResult.result['content']) {
//             hiveJobParameters.query = clusterWithResult.result['content'];
//             const logUuid = utils.generateUuid();
//             hiveJobParameters.statusDir = logUuid;
//             hiveJobParameters.defines = `hdInsightJobName=${logUuid}`;
//         } else {
//             // submit with script file path
//             const scriptPath = clusterWithResult.result['blob'];
//             hiveJobParameters.file = additionalStorage.getDefaultStorageFullPath(scriptPath);
//         }
//         utils.log(`start submitting Hive script to ${cluster.name}.`, true);
//         utils.setProgressMessage('loading', true);
//         const result = await _submitHiveWithParameters(cluster, additionalStorage, hiveJobParameters);
//         const submitedCluster = result[0];
//         const jobId = result[1].id;
//         utils.logAppendLine('');
//         utils.log(`submit Hive job to cluster ${submitedCluster.name} successfully! Tez job id: ${jobId}`);
//         if (!submitedCluster.getStorage()) {
//             throw new Error('no storage');
//         }
//         utils.openInBrowser(_formatYarnURL(submitedCluster));
//     } catch (error) {
//         utils.error(`submit hive job exception: ${JSON.stringify(error)}`);
//     } finally {
//         JobStatusManager.Instance.setToStopStatus();   
//         utils.stopProgressMessage();        
//     }
// }
function _getAppIdFromJobId(cluster, jobId, hdiStorage, hiveJobParameters) {
    return __awaiter(this, void 0, void 0, function* () {
        let def = common_1.createDeferred();
        let jobOutputPath = `user/${hiveJobParameters.userName}/${hiveJobParameters.statusDir}/stderr`;
        // Wait until the application has been started and its id can be found from logs
        while (true) {
            const fileExists = yield storage.fileExists(cluster, hdiStorage, jobOutputPath);
            yield utils.delay(10000);
            if (fileExists) {
                break;
            }
        }
        storage.readFileToString(cluster, hdiStorage, jobOutputPath)
            .then((text) => {
            let tezAppIds31 = text.match(tezApplicationIdPatternFor31);
            let tezAppIds32 = text.match(tezApplicationIdPatternFor32);
            if (tezAppIds31) {
                def.resolve(tezAppIds31[1]);
            }
            else if (tezAppIds32) {
                def.resolve(tezAppIds32[1]);
            }
            else {
                def.reject('no appliction id');
            }
        });
        return def.promise;
    });
}
// function _uploadHiveScriptToStorage(cluster, hdiStorage: storage.HdiStorage, path: string): Promise<storage.ClusterWithResult> {
//     let index = path.lastIndexOf('/') + 1;
//     if (index === 0) {
//         index = path.lastIndexOf('\\') + 1;
//     }
//     let fileName = path.substring(index);
//     let remotePath = `hive_job_fromvscode/${utils.generateUuid()}/${fileName}`;
//     return storage.uploadFileToStorage(cluster, hdiStorage, path, remotePath);
// }
function _submitHiveWithParameters(cluster, hdiStorage, parameters) {
    let requestUrl = cluster.getConnectString();
    requestUrl = requestUrl + '/templeton/v1/hive';
    let queryParameters = [];
    if (parameters.userName) {
        queryParameters.push(`user.name=${encodeURIComponent(parameters.userName)}`);
    }
    if (queryParameters.length > 0) {
        requestUrl = requestUrl + '?' + queryParameters.join('&');
    }
    requestUrl = requestUrl.replace(' ', '%20');
    let httpRequest = new azure_common_1.WebResource();
    httpRequest.method = 'POST';
    httpRequest.headers = {};
    httpRequest.url = requestUrl;
    let requestContent = '';
    // Serialize Request
    if (parameters.userName) {
        requestContent += 'user.name' + encodeURIComponent(parameters.userName);
    }
    if (parameters.query) {
        requestContent += `&execute=${encodeURIComponent(parameters.query)}`;
    }
    if (parameters.file) {
        requestContent += `&file=${encodeURIComponent(parameters.file)}`;
    }
    if (parameters.arguments) {
        requestContent += `&arg=${parameters.arguments}`;
    }
    if (parameters.files) {
        requestContent += `&files=${encodeURIComponent(parameters.files)}`;
    }
    if (parameters.statusDir) {
        requestContent += `&statusdir=${parameters.statusDir}`;
    }
    if (parameters.defines) {
        requestContent += `&define=${encodeURIComponent(parameters.defines)}`;
    }
    if (parameters.enableLog) {
        requestContent += `&enablelog=${parameters.enableLog}`;
    }
    httpRequest.body = requestContent;
    // Set Headers
    httpRequest.headers['accept'] = 'application/json';
    httpRequest.headers['Content-Type'] = 'application/text';
    httpRequest.headers['useragent'] = utils.getUserAgent();
    httpRequest.headers['User-Agent'] = utils.getUserAgent();
    httpRequest.headers['user-agent'] = utils.getUserAgent();
    httpRequest.headers['Content-Length'] = Buffer.isBuffer(requestContent) ? requestContent.length : Buffer.byteLength(requestContent, 'UTF8');
    let jobManagerClient = msHDIJob.createHDInsightJobManagementClient(`${cluster.getConnectString()}`, new authInfo_1.BasicAmbariCredentials(hdiStorage.ambariUserName, hdiStorage.ambariPasswd));
    let def = common_1.createDeferred();
    jobManagerClient.pipeline(httpRequest, function (error, res) {
        if (error) {
            def.reject(error);
        }
        let result = res;
        if (result.statusCode === 200 || result.statusCode === 201) {
            def.resolve([cluster, JSON.parse(result['body'])]);
        }
        else {
            def.reject(result);
        }
    });
    return def.promise;
}
function _formatURLFromJobResult(cluster, id) {
    return `${cluster.getConnectString()}#/main/views/TEZ/1.0.0/TEZ_CLUSTER_INSTANCE/?viewPath=/#/app/${id}`;
}
function _formatYarnURL(cluster) {
    return `${cluster.getConnectString()}/yarnui/hn/cluster/apps`;
}
// check if it's in Preview mode 
function isPreviewEnabled(queryStringMaps) {
    return queryStringMaps && queryStringMaps.get('isPreview') === 'true' || false;
}
exports.isPreviewEnabled = isPreviewEnabled;

//# sourceMappingURL=jobs.js.map
