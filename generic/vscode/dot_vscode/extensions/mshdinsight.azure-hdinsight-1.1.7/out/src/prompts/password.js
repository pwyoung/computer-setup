'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// This code is originally from https://github.com/DonJayamanne/bowerVSCode
// License: https://github.com/DonJayamanne/bowerVSCode/blob/master/LICENSE
const input_1 = require("./input");
class PasswordPrompt extends input_1.default {
    constructor(question) {
        super(question);
        this._options.password = true;
    }
}
exports.default = PasswordPrompt;

//# sourceMappingURL=password.js.map
