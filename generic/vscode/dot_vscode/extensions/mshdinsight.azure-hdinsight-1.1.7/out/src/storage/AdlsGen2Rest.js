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
const storage_blob_1 = require("@azure/storage-blob");
const ms_rest_js_1 = require("@azure/storage-blob/node_modules/@azure/ms-rest-js");
const fs = require("fs");
const Constants = require("../constants/constants");
const utils = require("../utils");
class AdlsGen2Rest {
    constructor(localPath, remotePath, storageAccountName, storageAccessKey, restUrl) {
        this.localPath = localPath;
        this.remotePath = remotePath;
        this.sharedKeyCredential = new storage_blob_1.SharedKeyCredential(storageAccountName, storageAccessKey);
        this.sharedKeyCredentialPolicy = this.sharedKeyCredential.create(new ms_rest_js_1.DefaultHttpClient(), new storage_blob_1.RequestPolicyOptions());
        this.restUrl = restUrl;
        this.contentLength = 0;
    }
    createFile() {
        return __awaiter(this, void 0, void 0, function* () {
            let request = new storage_blob_1.WebResource();
            request.url = `${this.restUrl}/${this.remotePath}?resource=file`;
            request.method = 'PUT';
            request.headers = new ms_rest_js_1.HttpHeaders({ 'x-ms-version': Constants.XMsVersion });
            request.headers.set['User-Agent'] = utils.getUserAgent();
            const response = yield this.sharedKeyCredentialPolicy.sendRequest(request);
            if (response.status === 201) {
                return AdlsGen2ResponseStatus.CreateSuccess;
            }
            else if (response.status === 403 && JSON.parse(response['bodyAsText'])['error']['code'] === 'AuthenticationFailed') {
                throw new Error('AuthenticationFailed');
            }
            else {
                throw new Error(`status: ${response.status.toString()}, error: ${response.bodyAsText}`);
            }
        });
    }
    appendFile() {
        return __awaiter(this, void 0, void 0, function* () {
            const fileReadStream = fs.createReadStream(this.localPath);
            const fileByteLength = fs.readFileSync(this.localPath).byteLength.toString();
            let request = new storage_blob_1.WebResource();
            request.url = `${this.restUrl}/${this.remotePath}?action=append&position=0`;
            request.method = 'PATCH';
            // required content-length header will be set inside the sharedKeyCredentialPolicy
            request.headers = new ms_rest_js_1.HttpHeaders({ 'x-ms-version': Constants.XMsVersion, 'content-type': 'application/octet-stream', 'content-length': fileByteLength });
            request.headers.set['User-Agent'] = utils.getUserAgent();
            request.body = fileReadStream;
            const response = yield this.sharedKeyCredentialPolicy.sendRequest(request);
            if (response.status === 202) {
                this.contentLength += parseInt(response.request.headers.get('content-length'), 10);
                return AdlsGen2ResponseStatus.AppendSuccess;
            }
            else if (response.status === 403 && JSON.parse(response['bodyAsText'])['error']['code'] === 'AuthenticationFailed') {
                throw new Error('AuthenticationFailed');
            }
            else {
                throw new Error(`status: ${response.status.toString()}, error: ${response.bodyAsText}`);
            }
        });
    }
    flushFile() {
        return __awaiter(this, void 0, void 0, function* () {
            let request = new storage_blob_1.WebResource();
            request.url = `${this.restUrl}/${this.remotePath}?action=flush&position=${this.contentLength.toString()}`;
            request.method = 'PATCH';
            // required content-length header must be set to '0' for flush operation
            request.headers = new ms_rest_js_1.HttpHeaders({ 'content-length': '0', 'x-ms-version': Constants.XMsVersion });
            request.headers.set['User-Agent'] = utils.getUserAgent();
            const response = yield this.sharedKeyCredentialPolicy.sendRequest(request);
            if (response.status === 200) {
                return AdlsGen2ResponseStatus.FlushSuccess;
            }
            else if (response.status === 403 && JSON.parse(response['bodyAsText'])['error']['code'] === 'AuthenticationFailed') {
                throw new Error('AuthenticationFailed');
            }
            else {
                throw new Error(`status: ${response.status.toString()}, error: ${response.bodyAsText}`);
            }
        });
    }
    uploadFile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.createFile();
                yield this.appendFile();
                yield this.flushFile();
                return AdlsGen2ResponseStatus.UploadSuccess;
            }
            catch (err) {
                if (err.message === 'AuthenticationFailed') {
                    return AdlsGen2ResponseStatus.AuthenticationFailed;
                }
                else {
                    throw err;
                }
            }
        });
    }
}
exports.AdlsGen2Rest = AdlsGen2Rest;
var AdlsGen2ResponseStatus;
(function (AdlsGen2ResponseStatus) {
    AdlsGen2ResponseStatus["CreateSuccess"] = "create file success";
    AdlsGen2ResponseStatus["AppendSuccess"] = "append file success";
    AdlsGen2ResponseStatus["FlushSuccess"] = "flush file success";
    AdlsGen2ResponseStatus["UploadSuccess"] = "upload file success";
    AdlsGen2ResponseStatus["AuthenticationFailed"] = "authentication failed"; // authentication failed, need refresh storage access Key
})(AdlsGen2ResponseStatus = exports.AdlsGen2ResponseStatus || (exports.AdlsGen2ResponseStatus = {}));

//# sourceMappingURL=AdlsGen2Rest.js.map
