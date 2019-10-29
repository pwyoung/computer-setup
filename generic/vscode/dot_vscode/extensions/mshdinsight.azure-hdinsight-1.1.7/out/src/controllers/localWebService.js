'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// This code is originally from https://github.com/Microsoft/vscode-mssql
// License: https://github.com/Microsoft/vscode-mssql/blob/master/LICENSE.txt
// we made some changes based on the source code
const path = require("path");
const ws = require("ws");
const url = require("url");
const querystring = require("querystring");
const Constants = require("../constants/constants");
const http = require("http");
const bodyParser = require("body-parser");
const express = require("express");
const utils = require("../utils");
const WebSocketServer = ws.Server;
// interfaces
var ContentType;
(function (ContentType) {
    ContentType[ContentType["Root"] = 0] = "Root";
    ContentType[ContentType["Messages"] = 1] = "Messages";
    ContentType[ContentType["ResultsetsMeta"] = 2] = "ResultsetsMeta";
    ContentType[ContentType["Columns"] = 3] = "Columns";
    ContentType[ContentType["Rows"] = 4] = "Rows";
    ContentType[ContentType["SaveResults"] = 5] = "SaveResults";
    ContentType[ContentType["Copy"] = 6] = "Copy";
    ContentType[ContentType["EditorSelection"] = 7] = "EditorSelection";
    ContentType[ContentType["OpenLink"] = 8] = "OpenLink";
    ContentType[ContentType["ShowError"] = 9] = "ShowError";
    ContentType[ContentType["ShowWarning"] = 10] = "ShowWarning";
    ContentType[ContentType["Config"] = 11] = "Config";
})(ContentType = exports.ContentType || (exports.ContentType = {}));
exports.ContentTypes = [
    Constants.outputContentTypeRoot,
    Constants.outputContentTypeMessages,
    Constants.outputContentTypeResultsetMeta,
    Constants.outputContentTypeColumns,
    Constants.outputContentTypeRows,
    Constants.outputContentTypeSaveResults,
    Constants.outputContentTypeCopy,
    Constants.outputContentTypeEditorSelection,
    Constants.outputContentTypeOpenLink,
    Constants.outputContentTypeShowError,
    Constants.outputContentTypeShowWarning,
    Constants.outputContentTypeConfig
];
class WebSocketMapping {
    constructor() {
        this.pendingMessages = [];
    }
}
class WebSocketMessage {
}
class LocalWebService {
    constructor(extensionPath) {
        this.app = express();
        this.server = http.createServer();
        this.wss = new WebSocketServer({ server: this.server });
        this.wsMap = new Map();
        // add static content for express web server to serve
        const self = this;
        LocalWebService._vscodeExtensionPath = extensionPath;
        LocalWebService._staticContentPath = path.join(extensionPath, LocalWebService._htmlContentLocation);
        this.app.use(express.static(LocalWebService.staticContentPath));
        this.app.use(bodyParser.json({ limit: '50mb', type: 'application/json' }));
        this.app.set('view engine', 'ejs');
        utils.debug(`LocalWebService: added static html content path: ${LocalWebService.staticContentPath}`);
        this.server.on('request', this.app);
        // Handle new connections to the web socket server
        this.wss.on('connection', (ws) => {
            let parse = querystring.parse(url.parse(ws.upgradeReq.url).query);
            // Attempt to find the mapping for the web socket server
            let mapping = self.wsMap.get(parse.uri);
            // If the mapping does not exist, create it now
            if (mapping === undefined) {
                mapping = new WebSocketMapping();
                self.wsMap.set(parse.uri, mapping);
            }
            // Assign the web socket server to the mapping
            mapping.webSocketServer = ws;
            // Replay all messages to the server
            mapping.pendingMessages.forEach(m => {
                ws.send(JSON.stringify(m));
            });
        });
    }
    getWsMap() {
        return this.wsMap;
    }
    static get serviceUrl() {
        return Constants.outputServiceLocalhost + LocalWebService._servicePort;
    }
    static get staticContentPath() {
        return LocalWebService._staticContentPath;
    }
    static get extensionPath() {
        return LocalWebService._vscodeExtensionPath;
    }
    static getEndpointUri(type) {
        return this.serviceUrl + '/' + exports.ContentTypes[type];
    }
    broadcast(uri, event, data) {
        // Create a message to send out
        let message = {
            type: event,
            // if result rows are 0 while in preview mode, 0 should be sent instead of undefined
            data: data ? data : (typeof data === 'number' ? data : undefined)
        };
        // Attempt to find the web socket server
        let mapping = this.wsMap.get(uri);
        // Is the URI mapped to a web socket server?
        if (mapping === undefined) {
            // There isn't a mapping, so create it
            mapping = new WebSocketMapping();
            this.wsMap.set(uri, mapping);
        }
        else {
            // Make sure the web socket server is open, then fire away
            if (mapping.webSocketServer && mapping.webSocketServer.readyState === ws.OPEN) {
                mapping.webSocketServer.send(JSON.stringify(message));
            }
        }
        // Append the message to the message history
        mapping.pendingMessages.push(message);
    }
    /**
     * Purges the queue of messages to send on the web socket server for the given uri
     * @param   uri URI of the web socket server to reset
     */
    resetSocket(uri) {
        if (this.wsMap.has(uri)) {
            this.wsMap.delete(uri);
        }
    }
    addHandler(type, handler) {
        let segment = '/' + exports.ContentTypes[type];
        this.app.get(segment, handler);
    }
    addPostHandler(type, handler) {
        let segment = '/' + exports.ContentTypes[type];
        this.app.post(segment, handler);
    }
    start() {
        const port = this.server.listen(0).address().port; // 0 = listen on a random port
        utils.debug(`LocalWebService listening on port ${port}`);
        LocalWebService._servicePort = port.toString();
    }
}
LocalWebService._htmlContentLocation = 'out/src/views/htmlcontent';
exports.default = LocalWebService;

//# sourceMappingURL=localWebService.js.map
