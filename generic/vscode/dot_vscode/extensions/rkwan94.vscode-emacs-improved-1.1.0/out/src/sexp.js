"use strict";
// What is an s-expression?
//   S-expressions were popularised by Lisp and
//   represent a recursive data structure.
Object.defineProperty(exports, "__esModule", { value: true });
//   In the usual parenthesized syntax of Lisp,
//   an s-expression is classically defined as:
//     1. an atom, or
//     2. an expression of the form (x y) where x and y are s-expressions.
var Expression;
(function (Expression) {
    Expression[Expression["SExpression"] = 0] = "SExpression";
    Expression[Expression["Atom"] = 1] = "Atom";
})(Expression = exports.Expression || (exports.Expression = {}));
function turnToSexp(text) {
    const start = new RegExp(/[\{\(\[\<]/);
    const end = new RegExp(/[\}\)\]\>]/);
    const isString = new RegExp(/[\"\']/);
    const isWhitespace = new RegExp(/\s+/);
    const sexp = [[]];
    let word = "";
    let inStr = false;
    for (const char of text) {
        if (start.test(char) && !inStr) {
            sexp.push([]);
        }
        else if ((end.test(char) || isWhitespace.test(char)) && !inStr) {
            const last = sexp.length - 1;
            if (word.length > 0) {
                sexp[last].push(word);
                word = "";
            }
            if (end.test(char)) {
                const temp = sexp.pop();
                sexp[last - 1].push(temp);
            }
        }
        else if (isString.test(char)) {
            inStr = !inStr;
        }
        else {
            word = word.concat(char);
        }
    }
    return sexp[0];
}
exports.turnToSexp = turnToSexp;
function isSexp(text) {
    const regex = new RegExp('^[\[\{\(\"\']');
    return regex.test(text);
}
function isAtom(text) {
    return !this.isSexp(text);
}
function sExpressionOrAtom(text) {
    return isSexp(text) ? Expression.SExpression : Expression.Atom;
}
exports.sExpressionOrAtom = sExpressionOrAtom;
//# sourceMappingURL=sexp.js.map