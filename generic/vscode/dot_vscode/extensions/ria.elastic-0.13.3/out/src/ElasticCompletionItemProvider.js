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
const ElasticMatch_1 = require("./ElasticMatch");
const ElasticMatches_1 = require("./ElasticMatches");
'use script';
const vscode = require("vscode");
const request = require("request");
const url = require("url");
const routington = require("routington");
const closestSemver = require("semver-closest");
const os = require("os");
class ElasticCompletionItemProvider {
    constructor(context) {
        this.context = context;
        this.restSpec = this.buildRestSpecRouter();
    }
    buildRestSpecRouter() {
        const restSpec = require('./rest-spec').default;
        const versions = Object.keys(restSpec);
        const result = {};
        versions.forEach(version => {
            const endpointDescriptions = restSpec[version].default;
            const common = endpointDescriptions._common;
            delete endpointDescriptions._common;
            const endpointNames = Object.keys(endpointDescriptions);
            const router = result[version] = routington();
            endpointNames.forEach(endpointName => {
                const endpointDescription = endpointDescriptions[endpointName];
                if (common) {
                    if (endpointDescription.url.params)
                        Object.keys(common.params)
                            .forEach(param => endpointDescription.url.params[param] = common.params[param]);
                    else
                        endpointDescription.url.params = common.params;
                }
                const paths = endpointDescription.url.paths.map(path => path.replace(/\{/g, ':').replace(/\}/g, ''));
                const methods = endpointDescription.methods;
                methods.forEach(method => paths
                    .forEach(path => (router.define(`${method}${path}`)[0].spec = endpointDescription)));
            });
        });
        return result;
    }
    provideCompletionItems(document, position, token) {
        return this.asyncProvideCompletionItems(document, position, token);
    }
    provideHover(document, position) {
        return this.asyncProvideHover(document, position);
    }
    asyncProvideHover(document, position) {
        return __awaiter(this, void 0, void 0, function* () {
            let esVersion = yield this.getElasticVersion();
            esVersion = '6.0.0';
            if (!esVersion)
                return;
            let apiVersion = closestSemver(esVersion, Object.keys(this.restSpec));
            let restSpec = this.restSpec[apiVersion];
            if (!restSpec)
                return;
            const line = document.lineAt(position);
            var match = ElasticMatch_1.ElasticMatch.RegexMatch.exec(line.text);
            var params = [];
            if (match != null) {
                let range = line.range;
                var path = match[2].split('?')[0];
                var signature = path.split('/').pop();
                const m = restSpec.match(`${match[1]}${path}`);
                params.push(`${m.node.spec.body.description}`);
                if (m.node.spec.url.params) {
                    params.push(os.EOL + 'url params:');
                    for (var i in m.node.spec.url.params) {
                        var p = m.node.spec.url.params[i];
                        var text = `* ${i} *(${p.type})*`;
                        params.push(text);
                    }
                }
                var htm = [`${m.node.spec.methods.join(' | ')} **${m.node.string}** ([documentation](${m.node.spec.documentation}))`, params.join(os.EOL)];
                return Promise.resolve(new vscode.Hover(htm, range));
            }
            return;
        });
    }
    asyncProvideCompletionItems(document, position, token) {
        return __awaiter(this, void 0, void 0, function* () {
            let esVersion = yield this.getElasticVersion();
            esVersion = '6.0.0';
            if (!esVersion)
                return [];
            const editor = vscode.window.activeTextEditor;
            let esMatch = new ElasticMatches_1.ElasticMatches(editor).Selection;
            if (!esMatch)
                return [];
            let apiVersion = closestSemver(esVersion, Object.keys(this.restSpec));
            let restSpec = this.restSpec[apiVersion];
            if (!restSpec)
                return [];
            if (this.isPathCompletion(esMatch, position))
                return this.providePathCompletionItem(esMatch, restSpec);
            else if (this.isPathParamCompletion(esMatch, position))
                return this.providePathParamCompletionItem(esMatch, restSpec);
            console.log(esMatch.Body.Text);
            return [];
        });
    }
    providePathParamCompletionItem(esMatch, restSpec) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = restSpec.match(`${esMatch.Method.Text}${esMatch.Path.Text.split('?')[0]}`);
            if (!match)
                return [];
            return Object.keys(match.node.spec.url.params)
                .map(param => new vscode.CompletionItem(param));
        });
    }
    providePathCompletionItem(esMatch, restSpec) {
        return __awaiter(this, void 0, void 0, function* () {
            let parts = esMatch.Path.Text.split('/').filter(part => part.length);
            let parent = restSpec.child[esMatch.Method.Text];
            let grandParent;
            parts.forEach(part => {
                if (!parent)
                    return;
                grandParent = parent;
                parent = part in parent.child ?
                    parent.child[part] :
                    parent.children[0];
            });
            if (!parent)
                return [];
            let result = [];
            let variable = parent.children[0];
            if (variable) {
                if (variable.name == 'index') {
                    result = result.concat((yield this.listIndices()).map(index => ({
                        label: index
                    })));
                    result = result.concat((yield this.listAliases()).map(index => ({
                        label: index
                    })));
                }
                else if (variable.name == 'name' && grandParent && grandParent.string === '_alias')
                    result = result.concat((yield this.listAliases()).map(index => ({
                        label: index
                    })));
                else if (variable.name == 'repository')
                    result = result.concat((yield this.listRepositories()).map(repository => ({
                        label: repository
                    })));
                else
                    result.push({ label: `<${variable.name}>` });
            }
            result = result.concat(Object.keys(parent.child).map(child => ({
                label: child
            })));
            return result.filter(part => part.label.length)
                .map(part => new vscode.CompletionItem(part.label));
        });
    }
    isPathCompletion(esMatch, position) {
        return esMatch.Method.Range.start.line === position.line &&
            esMatch.Path.Text[esMatch.Path.Text.length - 1] === '/';
    }
    isPathParamCompletion(esMatch, position) {
        return esMatch.Method.Range.start.line === position.line &&
            (esMatch.Path.Text[esMatch.Path.Text.length - 1] === '?' ||
                esMatch.Path.Text[esMatch.Path.Text.length - 1] === '&');
    }
    //private lookupEndpoint(esVersion: string, )
    listIndices() {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.context.workspaceState.get("elastic.host", null);
            const requestUrl = url.format({ host, pathname: '/_cat/indices', protocol: 'http' });
            return new Promise((resolve, reject) => {
                request({
                    url: requestUrl + '?format=json', method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }, (error, response, body) => {
                    try {
                        resolve(JSON.parse(body).map(entry => entry.index));
                    }
                    catch (e) {
                        resolve([]);
                    }
                });
            });
        });
    }
    listAliases() {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.context.workspaceState.get("elastic.host", null);
            const requestUrl = url.format({ host, pathname: '/_cat/aliases', protocol: 'http' });
            return new Promise((resolve, reject) => {
                request({
                    url: requestUrl + '?format=json', method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }, (error, response, body) => {
                    try {
                        resolve(JSON.parse(body).map(entry => entry.alias));
                    }
                    catch (e) {
                        resolve([]);
                    }
                });
            });
        });
    }
    listRepositories() {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.context.workspaceState.get("elastic.host", null);
            const requestUrl = url.format({ host, pathname: '/_snapshot', protocol: 'http' });
            return new Promise((resolve, reject) => {
                request({
                    url: requestUrl, method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }, (error, response, body) => {
                    try {
                        resolve(Object.keys(JSON.parse(body)));
                    }
                    catch (e) {
                        resolve([]);
                    }
                });
            });
        });
    }
    getElasticVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            const host = this.context.workspaceState.get("elastic.host", null);
            const requestUrl = url.format({ host, pathname: '/', protocol: 'http' });
            return new Promise((resolve, reject) => {
                request({
                    url: requestUrl, method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }, (error, response, body) => {
                    try {
                        resolve(JSON.parse(body).version.number);
                    }
                    catch (e) {
                        resolve(null);
                    }
                });
            });
        });
    }
}
exports.ElasticCompletionItemProvider = ElasticCompletionItemProvider;
//# sourceMappingURL=ElasticCompletionItemProvider.js.map