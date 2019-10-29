'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// This code is originally from https://github.com/Microsoft/vscode-mssql
// License: https://github.com/Microsoft/vscode-mssql/blob/master/LICENSE.txt
// we made some changes based on the source code
exports.languageId = 'hive';
exports.extensionName = 'hdinsight';
exports.extensionConfigSectionName = 'hive';
exports.outputChannelName = 'Azure Spark & Hive';
exports.cmdRunQuery = 'extension.runQuery';
exports.outputContentTypeRoot = 'root';
exports.outputContentTypeMessages = 'messages';
exports.outputContentTypeResultsetMeta = 'resultsetsMeta';
exports.outputContentTypeColumns = 'columns';
exports.outputContentTypeRows = 'rows';
exports.outputContentTypeConfig = 'config';
exports.outputContentTypeSaveResults = 'saveResults';
exports.outputContentTypeOpenLink = 'openLink';
exports.outputContentTypeCopy = 'copyResults';
exports.outputContentTypeEditorSelection = 'setEditorSelection';
exports.outputContentTypeShowError = 'showError';
exports.outputContentTypeShowWarning = 'showWarning';
exports.outputServiceLocalhost = 'http://127.0.0.1:';
exports.msgContentProviderSqlOutputHtml = 'dist/html/sqlOutput.ejs';
exports.contentProviderMinFile = 'dist/js/app.min.js';
exports.untitledSaveTimeThreshold = 10.0;
// // Configuration Constants
exports.copyIncludeHeaders = 'copyIncludeHeaders';
exports.configSaveAsCsv = 'saveAsCsv';
exports.configSaveAsJson = 'saveAsJson';
exports.configSaveAsExcel = 'saveAsExcel';
exports.configCopyRemoveNewLine = 'copyRemoveNewLine';
exports.configSplitPaneSelection = 'splitPaneSelection';
exports.configShowBatchTime = 'showBatchTime';
exports.extConfigResultKeys = ['shortcuts', 'messagesDefaultOpen'];
exports.extConfigResultFontSize = 'resultsFontSize';
exports.sqlServerBigDataClusterDefaultPort = '30443';
exports.clusterNameColumnSpacinglMax = 30;
// // ToolsService Constants
exports.serviceInstallingTo = 'Installing HDInsight tools service to';
exports.serviceInstalling = 'Installing';
exports.serviceInstalled = 'HDInsight Tools Service installed';
exports.serviceInstallationFailed = 'Failed to install HDInsight Tools Service';
exports.serviceInitializingOutputChannelName = 'HDInsight.Initialization';
// // JupyterService Constants
exports.jupyterDir = 'hdinsightJupyter';
exports.pythonOfficialWebsite = 'https://www.python.org';
exports.pipOfficialWebsite = 'https://pypi.org/project/pip';
exports.jupyterEnvironmentSetupDocLink = 'https://go.microsoft.com/fwlink/?linkid=861972';
exports.ManuallySpecifyPythonInterpreterDocLink = 'https://code.visualstudio.com/docs/python/environments#_manually-specify-an-interpreter';
// // adls gen2 Constants
exports.XMsVersion = '2018-11-09'; // https://docs.microsoft.com/en-us/rest/api/storageservices/versioning-for-the-azure-storage-services
exports.getStorageAccessKeyHelpLink = 'https://docs.microsoft.com/en-us/azure/storage/common/storage-account-manage#view-and-copy-access-keys';
// // link ambari cluster Constants
exports.promptInfo = 'No permission to view the Hive database or submit job to the cluster. Please enter Ambari or ESP domain credential to link the cluster, or ask the cluster owner to upgrade your role to HDInsight Cluster Operator in ';
exports.reportIssueUrl = 'https://github.com/Microsoft/HDInsightVSCodeExtension/issues';
exports.docsUrl = 'https://docs.microsoft.com/en-us/azure/hdinsight/hdinsight-migrate-granular-access-cluster-configurations#add-the-hdinsight-cluster-operator-role-assignment-to-a-user';

//# sourceMappingURL=constants.js.map
