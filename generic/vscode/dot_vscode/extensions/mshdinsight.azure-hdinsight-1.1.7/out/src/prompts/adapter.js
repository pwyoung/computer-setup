'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// This code is originally from https://github.com/DonJayamanne/bowerVSCode
// License: https://github.com/DonJayamanne/bowerVSCode/blob/master/LICENSE
const vscode_1 = require("vscode");
const Constants = require("../constants/constants");
const nodeUtil = require("util");
const factory_1 = require("./factory");
const EscapeException_1 = require("../utils/EscapeException");
const logger_1 = require("../logger");
// Supports simple pattern for prompting for user input and acting on this
class CodeAdapter {
    constructor() {
        this.outBuffer = '';
        this.messageLevelFormatters = {};
        // TODO Decide whether output channel logging should be saved here?
        this.outChannel = logger_1.Logger.getLogger(Constants.outputChannelName).getChannel();
        // this.outChannel.clear();
    }
    logError(message) {
        let line = `error: ${message.message}\n    Code - ${message.code}`;
        this.outBuffer += `${line}\n`;
        this.outChannel.appendLine(line);
    }
    formatMessage(message) {
        const prefix = `${message.level}: (${message.id}) `;
        return `${prefix}${message.message}`;
    }
    log(message) {
        let line = '';
        if (message && typeof (message.level) === 'string') {
            let formatter = this.formatMessage;
            if (this.messageLevelFormatters[message.level]) {
                formatter = this.messageLevelFormatters[message.level];
            }
            line = formatter(message);
        }
        else {
            line = nodeUtil.format(arguments);
        }
        this.outBuffer += `${line}\n`;
        this.outChannel.appendLine(line);
    }
    clearLog() {
        this.outChannel.clear();
    }
    showLog() {
        this.outChannel.show();
    }
    // TODO define question interface
    fixQuestion(question) {
        if (question.type === 'checkbox' && Array.isArray(question.choices)) {
            // For some reason when there's a choice of checkboxes, they aren't formatted properly
            // Not sure where the issue is
            question.choices = question.choices.map(item => {
                if (typeof (item) === 'string') {
                    return { checked: false, name: item, value: item };
                }
                else {
                    return item;
                }
            });
        }
    }
    promptSingle(question) {
        let questions = [question];
        return this.prompt(questions).then(answers => {
            if (answers) {
                return answers[question.name] || false;
            }
            return;
        });
    }
    prompt(questions) {
        let answers = {};
        // Collapse multiple questions into a set of prompt steps
        let promptResult = questions.reduce((promise, question) => {
            this.fixQuestion(question);
            return promise.then(() => {
                return factory_1.default.createPrompt(question);
            }).then(prompt => {
                // Original Code: uses jQuery patterns. Keeping for reference
                // if (!question.when || question.when(answers) === true) {
                //     return prompt.render().then(result => {
                //         answers[question.name] = question.filter ? question.filter(result) : result;
                //     });
                // }
                if (!question.shouldPrompt || question.shouldPrompt(answers) === true) {
                    return prompt.render().then(result => {
                        answers[question.name] = result;
                        if (question.onAnswered) {
                            question.onAnswered(result);
                        }
                        return answers;
                    });
                }
                return answers;
            });
        }, Promise.resolve());
        return promptResult.catch(err => {
            if (err instanceof EscapeException_1.EscapeException || err instanceof TypeError) {
                return undefined;
            }
            vscode_1.window.showErrorMessage(err.message);
            return undefined;
        });
    }
    // Helper to make it possible to prompt using callback pattern. Generally Promise is a preferred flow
    promptCallback(questions, callback) {
        // Collapse multiple questions into a set of prompt steps
        this.prompt(questions).then(answers => {
            if (callback && answers) {
                callback(answers);
            }
        });
    }
}
exports.default = CodeAdapter;

//# sourceMappingURL=adapter.js.map
