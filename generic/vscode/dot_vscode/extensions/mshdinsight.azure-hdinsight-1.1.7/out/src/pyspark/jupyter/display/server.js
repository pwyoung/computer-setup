"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const io = require("socket.io");
const http = require("http");
const events_1 = require("events");
const express = require("express");
const path = require("path");
const cors = require("cors");
const vscode = require("vscode");
const common_1 = require("../../../common");
const utils = require("../../../utils");
const uniqid = require("uniqid");
class Server extends events_1.EventEmitter {
    constructor() {
        super();
        this.clients = [];
        this.buffer = [];
        this.responsePromises = new Map();
    }
    dispose() {
        this.app = utils.nullValue();
        this.port = utils.nullValue();
        if (this.httpServer) {
            this.httpServer.close();
            this.httpServer = utils.nullValue();
        }
        if (this.server) {
            this.server.close();
            this.server = utils.nullValue();
        }
    }
    start() {
        if (this.port) {
            return Promise.resolve(this.port);
        }
        let def = common_1.createDeferred();
        this.app = express();
        this.httpServer = http.createServer(this.app);
        this.server = io(this.httpServer);
        let rootDirectory = path.join(__dirname, '..', '..', '..', '..', 'browser');
        this.app.use(express.static(rootDirectory));
        // Required by transformime
        // It will look in the path http://localhost:port/resources/MathJax/MathJax.js
        this.app.use(express.static(path.join(__dirname, '..', '..', '..', '..', '..', 'node_modules', 'mathjax-electron')));
        this.app.use(cors());
        // this.app.get('/', function (req, res, next) {
        //     res.sendFile(path.join(rootDirectory, 'index.html'));
        // });
        this.app.get('/', (req, res, next) => {
            this.rootRequestHandler(req, res);
        });
        this.httpServer.listen(0, () => {
            this.port = this.httpServer.address().port;
            def.resolve(this.port);
            def = utils.nullValue();
        });
        this.httpServer.on('error', error => {
            if (def) {
                def.reject(error);
            }
        });
        this.server.on('connection', this.onSocketConnection.bind(this));
        return def.promise;
    }
    rootRequestHandler(req, res) {
        let theme = req.query.theme;
        let backgroundColor = req.query.backgroundcolor;
        let color = req.query.color;
        let editorConfig = vscode.workspace.getConfiguration('editor');
        let fontFamily = editorConfig.get('fontFamily').split('\'').join('').split('"').join('');
        let fontSize = editorConfig.get('fontSize') + 'px';
        let fontWeight = editorConfig.get('fontWeight');
        res.render(path.join(__dirname, '..', '..', '..', '..', 'browser', 'index.ejs'), {
            theme: theme,
            backgroundColor: backgroundColor,
            color: color,
            fontFamily: fontFamily,
            fontSize: fontSize,
            fontWeight: fontWeight
        });
    }
    clearBuffer() {
        this.buffer = [];
    }
    sendResults(data) {
        // Add an id to each item (poor separation of concerns... but what ever)
        let results = data.map(item => { return { id: uniqid('x'), value: item }; });
        this.buffer = this.buffer.concat(results);
        this.broadcast('results', results);
    }
    sendSetting(name, value) {
        this.broadcast(name, value);
    }
    broadcast(eventName, data) {
        this.server.emit(eventName, data);
    }
    onSocketConnection(socket) {
        this.clients.push(socket);
        socket.on('disconnect', () => {
            const index = this.clients.findIndex(sock => sock.id === socket.id);
            if (index >= 0) {
                this.clients.splice(index, 1);
            }
        });
        socket.on('clientExists', (data) => {
            console.log('clientExists, on server');
            console.log(data);
            if (!this.responsePromises.has(data.id)) {
                console.log('Not found');
                return;
            }
            const def = this.responsePromises.get(data.id);
            this.responsePromises.delete(data.id);
            def.resolve(true);
        });
        socket.on('settings.appendResults', (data) => {
            this.emit('settings.appendResults', data);
        });
        socket.on('clearResults', () => {
            this.buffer = [];
        });
        socket.on('results.ack', () => {
            this.buffer = [];
        });
        this.emit('connected');
        // Someone is connected, send them the data we have
        socket.emit('results', this.buffer);
    }
    clientsConnected(timeoutMilliSeconds) {
        const id = new Date().getTime().toString();
        const def = common_1.createDeferred();
        this.broadcast('clientExists', { id: id });
        this.responsePromises.set(id, def);
        setTimeout(() => {
            if (this.responsePromises.has(id)) {
                this.responsePromises.delete(id);
                def.resolve(false);
                console.log('Timeout');
            }
        }, timeoutMilliSeconds);
        return def.promise;
    }
}
exports.Server = Server;

//# sourceMappingURL=server.js.map
