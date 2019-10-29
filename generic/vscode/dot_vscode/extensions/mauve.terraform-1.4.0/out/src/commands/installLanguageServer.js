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
const Octokit = require("@octokit/rest");
const fs = require("fs");
const Path = require("path");
const tar = require("tar");
const HttpClient_1 = require("typed-rest-client/HttpClient");
const vscode = require("vscode");
const configuration_1 = require("../configuration");
const languageclient_1 = require("../languageclient");
const command_1 = require("./command");
class InstallLanguageServerCommand extends command_1.Command {
    constructor(ctx) {
        super(InstallLanguageServerCommand.CommandName, ctx, command_1.CommandType.PALETTE);
    }
    perform(releaseId = null, githubRealeaseData = null) {
        return __awaiter(this, void 0, void 0, function* () {
            yield languageclient_1.ExperimentalLanguageClient.stopIfRunning();
            const serverLocation = configuration_1.getConfiguration().languageServer.pathToBinary ||
                Path.join(this.ctx.extensionPath, 'lspbin');
            // Create dir for lsp binary if it doesn't exist
            if (!fs.existsSync(serverLocation)) {
                fs.mkdirSync(serverLocation);
            }
            const downloadedZipFile = Path.join(serverLocation, 'terraform-lsp.tar.gz');
            // Download language server
            const octokit = new Octokit();
            let availableReleses;
            if (githubRealeaseData) {
                availableReleses =
                    JSON.parse(githubRealeaseData);
            }
            else {
                // What releases are available?
                let apiRespose = yield octokit.repos.listReleases({ owner: 'juliosueiras', repo: 'terraform-lsp' });
                availableReleses = apiRespose.data;
            }
            let releaseOptions = [];
            availableReleses.forEach(r => {
                releaseOptions.push({
                    label: r.name,
                    description: `Tag: ${r.tag_name}${r.prerelease ? ' (prerelease)' : ''}`,
                    detail: r.id.toString()
                });
            });
            if (!releaseId) {
                let choice = yield vscode.window.showQuickPick(releaseOptions, {
                    placeHolder: 'Terraform language server install - please pick a version'
                });
                if (choice === undefined) {
                    vscode.window.showErrorMessage('You must pick a version to complete installation');
                    return;
                }
                releaseId = choice.detail;
            }
            const releaseDetails = availableReleses.filter((v) => v.id.toString() === releaseId)[0];
            let platform = process.platform.toString();
            platform = platform === 'win32' ? 'windows' : platform;
            const downloadUrl = this.getDownloadUrl(releaseDetails, platform);
            if (downloadUrl === 'NotFound') {
                vscode.window.showErrorMessage(`Failed to install, releases for the Lanugage server didn't contain a release for your platform: ${platform}`);
                return;
            }
            const client = new HttpClient_1.HttpClient('clientTest');
            const response = yield client.get(downloadUrl);
            const file = fs.createWriteStream(downloadedZipFile);
            if (response.message.statusCode !== 200) {
                const err = new Error(`Unexpected HTTP response: ${response.message.statusCode}`);
                err['httpStatusCode'] = response.message.statusCode;
                vscode.window.showErrorMessage(`Downloading Terraform language server failed with ${err}`);
                return;
            }
            return new Promise((resolve, reject) => {
                file.on('error', (err) => reject(err));
                const stream = response.message.pipe(file);
                stream.on('close', () => {
                    try {
                        const unzipStream = fs.createReadStream(downloadedZipFile).pipe(tar.x({
                            cwd: serverLocation,
                            onwarn: (message, data) => {
                                console.log(message);
                                reject(message);
                            }
                        }));
                        unzipStream.on('finish', () => __awaiter(this, void 0, void 0, function* () {
                            const langClient = new languageclient_1.ExperimentalLanguageClient(this.ctx);
                            try {
                                yield langClient.start();
                            }
                            catch (e) {
                                vscode.window.showErrorMessage(`Failed to start server: ${e}`);
                            }
                            langClient.currentReleaseId = releaseId;
                            resolve();
                        }));
                    }
                    catch (err) {
                        vscode.window.showErrorMessage(`Unzipping Terraform language server failed with ${err}`);
                        reject(err);
                    }
                });
            });
        });
    }
    getDownloadUrl(release, platform) {
        let downloadUrl = 'NotFound';
        release.assets.forEach(asset => {
            if (!asset.name.endsWith('.tar.gz')) {
                return;
            }
            if (asset.name.includes(platform)) {
                downloadUrl = asset.browser_download_url;
            }
        });
        return downloadUrl;
    }
}
InstallLanguageServerCommand.CommandName = 'installLanguageServer';
exports.InstallLanguageServerCommand = InstallLanguageServerCommand;

//# sourceMappingURL=installLanguageServer.js.map
