"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StatementStatus;
(function (StatementStatus) {
    StatementStatus["waiting"] = "waiting";
    StatementStatus["running"] = "running";
    StatementStatus["available"] = "available";
    StatementStatus["error"] = "error";
    StatementStatus["cancelling"] = "cancelling";
    StatementStatus["cancelled"] = "cancelled"; // Statement is cancelled
})(StatementStatus = exports.StatementStatus || (exports.StatementStatus = {}));
var SessionState;
(function (SessionState) {
    SessionState["not_started"] = "not_started";
    SessionState["starting"] = "starting";
    SessionState["idle"] = "idle";
    SessionState["busy"] = "busy";
    SessionState["shutting_down"] = "shutting_down";
    SessionState["error"] = "error";
    SessionState["dead"] = "dead";
    SessionState["success"] = "success"; // Session is successfully stopped
})(SessionState = exports.SessionState || (exports.SessionState = {}));

//# sourceMappingURL=livyApi.js.map
