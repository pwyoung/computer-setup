(function() {
  var CLOSERS, CompositeDisposable, EmacsCursor, KillRing, Mark, OPENERS, Utils;

  KillRing = require('./kill-ring');

  Mark = require('./mark');

  Utils = require('./utils');

  CompositeDisposable = require('atom').CompositeDisposable;

  OPENERS = {
    '(': ')',
    '[': ']',
    '{': '}',
    '\'': '\'',
    '"': '"',
    '`': '`'
  };

  CLOSERS = {
    ')': '(',
    ']': '[',
    '}': '{',
    '\'': '\'',
    '"': '"',
    '`': '`'
  };

  module.exports = EmacsCursor = (function() {
    EmacsCursor["for"] = function(emacsEditor, cursor) {
      return cursor._atomicEmacs != null ? cursor._atomicEmacs : cursor._atomicEmacs = new EmacsCursor(emacsEditor, cursor);
    };

    function EmacsCursor(emacsEditor1, cursor1) {
      this.emacsEditor = emacsEditor1;
      this.cursor = cursor1;
      this.editor = this.cursor.editor;
      this._mark = null;
      this._localKillRing = null;
      this._yankMarker = null;
      this._disposable = this.cursor.onDidDestroy((function(_this) {
        return function() {
          return _this.destroy();
        };
      })(this));
    }

    EmacsCursor.prototype.mark = function() {
      return this._mark != null ? this._mark : this._mark = new Mark(this.cursor);
    };

    EmacsCursor.prototype.killRing = function() {
      if (this.editor.hasMultipleCursors()) {
        return this.getLocalKillRing();
      } else {
        return KillRing.global;
      }
    };

    EmacsCursor.prototype.getLocalKillRing = function() {
      return this._localKillRing != null ? this._localKillRing : this._localKillRing = KillRing.global.fork();
    };

    EmacsCursor.prototype.clearLocalKillRing = function() {
      return this._localKillRing = null;
    };

    EmacsCursor.prototype.destroy = function() {
      var ref, ref1;
      this.clearLocalKillRing();
      this._disposable.dispose();
      this._disposable = null;
      if ((ref = this._yankMarker) != null) {
        ref.destroy();
      }
      if ((ref1 = this._mark) != null) {
        ref1.destroy();
      }
      return delete this.cursor._atomicEmacs;
    };

    EmacsCursor.prototype.locateBackward = function(regExp) {
      return this.emacsEditor.locateBackwardFrom(this.cursor.getBufferPosition(), regExp);
    };

    EmacsCursor.prototype.locateForward = function(regExp) {
      return this.emacsEditor.locateForwardFrom(this.cursor.getBufferPosition(), regExp);
    };

    EmacsCursor.prototype.locateWordCharacterBackward = function() {
      return this.locateBackward(this._getWordCharacterRegExp());
    };

    EmacsCursor.prototype.locateWordCharacterForward = function() {
      return this.locateForward(this._getWordCharacterRegExp());
    };

    EmacsCursor.prototype.locateNonWordCharacterBackward = function() {
      return this.locateBackward(this._getNonWordCharacterRegExp());
    };

    EmacsCursor.prototype.locateNonWordCharacterForward = function() {
      return this.locateForward(this._getNonWordCharacterRegExp());
    };

    EmacsCursor.prototype.goToMatchStartBackward = function(regExp) {
      var ref;
      return this._goTo((ref = this.locateBackward(regExp)) != null ? ref.start : void 0);
    };

    EmacsCursor.prototype.goToMatchStartForward = function(regExp) {
      var ref;
      return this._goTo((ref = this.locateForward(regExp)) != null ? ref.start : void 0);
    };

    EmacsCursor.prototype.goToMatchEndBackward = function(regExp) {
      var ref;
      return this._goTo((ref = this.locateBackward(regExp)) != null ? ref.end : void 0);
    };

    EmacsCursor.prototype.goToMatchEndForward = function(regExp) {
      var ref;
      return this._goTo((ref = this.locateForward(regExp)) != null ? ref.end : void 0);
    };

    EmacsCursor.prototype.skipCharactersBackward = function(characters) {
      var regexp;
      regexp = new RegExp("[^" + (Utils.escapeForRegExp(characters)) + "]");
      return this.skipBackwardUntil(regexp);
    };

    EmacsCursor.prototype.skipCharactersForward = function(characters) {
      var regexp;
      regexp = new RegExp("[^" + (Utils.escapeForRegExp(characters)) + "]");
      return this.skipForwardUntil(regexp);
    };

    EmacsCursor.prototype.skipWordCharactersBackward = function() {
      return this.skipBackwardUntil(this._getNonWordCharacterRegExp());
    };

    EmacsCursor.prototype.skipWordCharactersForward = function() {
      return this.skipForwardUntil(this._getNonWordCharacterRegExp());
    };

    EmacsCursor.prototype.skipNonWordCharactersBackward = function() {
      return this.skipBackwardUntil(this._getWordCharacterRegExp());
    };

    EmacsCursor.prototype.skipNonWordCharactersForward = function() {
      return this.skipForwardUntil(this._getWordCharacterRegExp());
    };

    EmacsCursor.prototype.skipBackwardUntil = function(regexp) {
      if (!this.goToMatchEndBackward(regexp)) {
        return this._goTo(Utils.BOB);
      }
    };

    EmacsCursor.prototype.skipForwardUntil = function(regexp) {
      if (!this.goToMatchStartForward(regexp)) {
        return this._goTo(this.editor.getEofBufferPosition());
      }
    };

    EmacsCursor.prototype.insertAfter = function(text) {
      var position;
      position = this.cursor.getBufferPosition();
      this.editor.setTextInBufferRange([position, position], "\n");
      return this.cursor.setBufferPosition(position);
    };

    EmacsCursor.prototype.horizontalSpaceRange = function() {
      var end, start;
      this.skipCharactersBackward(' \t');
      start = this.cursor.getBufferPosition();
      this.skipCharactersForward(' \t');
      end = this.cursor.getBufferPosition();
      return [start, end];
    };

    EmacsCursor.prototype.deleteBlankLines = function() {
      var blankLineRe, e, eof, point, s;
      eof = this.editor.getEofBufferPosition();
      blankLineRe = /^[ \t]*$/;
      point = this.cursor.getBufferPosition();
      s = e = point.row;
      while (blankLineRe.test(this.cursor.editor.lineTextForBufferRow(e)) && e <= eof.row) {
        e += 1;
      }
      while (s > 0 && blankLineRe.test(this.cursor.editor.lineTextForBufferRow(s - 1))) {
        s -= 1;
      }
      if (s === e) {
        e += 1;
        while (blankLineRe.test(this.cursor.editor.lineTextForBufferRow(e)) && e <= eof.row) {
          e += 1;
        }
        return this.cursor.editor.setTextInBufferRange([[s + 1, 0], [e, 0]], '');
      } else if (e === s + 1) {
        this.cursor.editor.setTextInBufferRange([[s, 0], [e, 0]], '');
        return this.cursor.setBufferPosition([s, 0]);
      } else {
        this.cursor.editor.setTextInBufferRange([[s, 0], [e, 0]], '\n');
        return this.cursor.setBufferPosition([s, 0]);
      }
    };

    EmacsCursor.prototype.transformWord = function(transformer) {
      var end, range, start, text;
      this.skipNonWordCharactersForward();
      start = this.cursor.getBufferPosition();
      this.skipWordCharactersForward();
      end = this.cursor.getBufferPosition();
      range = [start, end];
      text = this.editor.getTextInBufferRange(range);
      return this.editor.setTextInBufferRange(range, transformer(text));
    };

    EmacsCursor.prototype.backwardKillWord = function(method) {
      return this._killUnit(method, (function(_this) {
        return function() {
          var end, start;
          end = _this.cursor.getBufferPosition();
          _this.skipNonWordCharactersBackward();
          _this.skipWordCharactersBackward();
          start = _this.cursor.getBufferPosition();
          return [start, end];
        };
      })(this));
    };

    EmacsCursor.prototype.killWord = function(method) {
      return this._killUnit(method, (function(_this) {
        return function() {
          var end, start;
          start = _this.cursor.getBufferPosition();
          _this.skipNonWordCharactersForward();
          _this.skipWordCharactersForward();
          end = _this.cursor.getBufferPosition();
          return [start, end];
        };
      })(this));
    };

    EmacsCursor.prototype.killLine = function(method) {
      return this._killUnit(method, (function(_this) {
        return function() {
          var end, line, start;
          start = _this.cursor.getBufferPosition();
          line = _this.editor.lineTextForBufferRow(start.row);
          if (start.column === 0 && atom.config.get("atomic-emacs.killWholeLine")) {
            end = [start.row + 1, 0];
          } else {
            if (/^\s*$/.test(line.slice(start.column))) {
              end = [start.row + 1, 0];
            } else {
              end = [start.row, line.length];
            }
          }
          return [start, end];
        };
      })(this));
    };

    EmacsCursor.prototype.killRegion = function(method) {
      return this._killUnit(method, (function(_this) {
        return function() {
          var position;
          position = _this.cursor.selection.getBufferRange();
          return [position, position];
        };
      })(this));
    };

    EmacsCursor.prototype._killUnit = function(method, findRange) {
      var killRing, range, text;
      if (method == null) {
        method = 'push';
      }
      if ((this.cursor.selection != null) && !this.cursor.selection.isEmpty()) {
        range = this.cursor.selection.getBufferRange();
        this.cursor.selection.clear();
      } else {
        range = findRange();
      }
      text = this.editor.getTextInBufferRange(range);
      this.editor.setTextInBufferRange(range, '');
      killRing = this.killRing();
      killRing[method](text);
      return killRing.getCurrentEntry();
    };

    EmacsCursor.prototype.yank = function() {
      var killRing, newRange, position, range;
      killRing = this.killRing();
      if (killRing.isEmpty()) {
        return;
      }
      if (this.cursor.selection) {
        range = this.cursor.selection.getBufferRange();
        this.cursor.selection.clear();
      } else {
        position = this.cursor.getBufferPosition();
        range = [position, position];
      }
      newRange = this.editor.setTextInBufferRange(range, killRing.getCurrentEntry());
      this.cursor.setBufferPosition(newRange.end);
      if (this._yankMarker == null) {
        this._yankMarker = this.editor.markBufferPosition(this.cursor.getBufferPosition());
      }
      return this._yankMarker.setBufferRange(newRange);
    };

    EmacsCursor.prototype.rotateYank = function(n) {
      var entry, range;
      if (this._yankMarker === null) {
        return;
      }
      entry = this.killRing().rotate(n);
      if (entry !== null) {
        range = this.editor.setTextInBufferRange(this._yankMarker.getBufferRange(), entry);
        return this._yankMarker.setBufferRange(range);
      }
    };

    EmacsCursor.prototype.yankComplete = function() {
      var ref;
      if ((ref = this._yankMarker) != null) {
        ref.destroy();
      }
      return this._yankMarker = null;
    };

    EmacsCursor.prototype.nextCharacter = function() {
      return this.emacsEditor.characterAfter(this.cursor.getBufferPosition());
    };

    EmacsCursor.prototype.skipSexpForward = function() {
      var point, target;
      point = this.cursor.getBufferPosition();
      target = this._sexpForwardFrom(point);
      return this.cursor.setBufferPosition(target);
    };

    EmacsCursor.prototype.skipSexpBackward = function() {
      var point, target;
      point = this.cursor.getBufferPosition();
      target = this._sexpBackwardFrom(point);
      return this.cursor.setBufferPosition(target);
    };

    EmacsCursor.prototype.skipListForward = function() {
      var point, target;
      point = this.cursor.getBufferPosition();
      target = this._listForwardFrom(point);
      if (target) {
        return this.cursor.setBufferPosition(target);
      }
    };

    EmacsCursor.prototype.skipListBackward = function() {
      var point, target;
      point = this.cursor.getBufferPosition();
      target = this._listBackwardFrom(point);
      if (target) {
        return this.cursor.setBufferPosition(target);
      }
    };

    EmacsCursor.prototype.markSexp = function() {
      var mark, newTail, range;
      range = this.cursor.getMarker().getBufferRange();
      newTail = this._sexpForwardFrom(range.end);
      mark = this.mark().set(newTail);
      if (!mark.isActive()) {
        return mark.activate();
      }
    };

    EmacsCursor.prototype.transposeChars = function() {
      var column, line, pair, pairRange, previousLine, ref, row;
      ref = this.cursor.getBufferPosition(), row = ref.row, column = ref.column;
      if (row === 0 && column === 0) {
        return;
      }
      line = this.editor.lineTextForBufferRow(row);
      if (column === 0) {
        previousLine = this.editor.lineTextForBufferRow(row - 1);
        pairRange = [[row - 1, previousLine.length], [row, 1]];
      } else if (column === line.length) {
        pairRange = [[row, column - 2], [row, column]];
      } else {
        pairRange = [[row, column - 1], [row, column + 1]];
      }
      pair = this.editor.getTextInBufferRange(pairRange);
      return this.editor.setTextInBufferRange(pairRange, (pair[1] || '') + pair[0]);
    };

    EmacsCursor.prototype.transposeWords = function() {
      var word1Range, word2Range;
      this.skipNonWordCharactersBackward();
      word1Range = this._wordRange();
      this.skipWordCharactersForward();
      this.skipNonWordCharactersForward();
      if (this.editor.getEofBufferPosition().isEqual(this.cursor.getBufferPosition())) {
        return this.skipNonWordCharactersBackward();
      } else {
        word2Range = this._wordRange();
        return this._transposeRanges(word1Range, word2Range);
      }
    };

    EmacsCursor.prototype.transposeSexps = function() {
      var end1, end2, start1, start2;
      this.skipSexpBackward();
      start1 = this.cursor.getBufferPosition();
      this.skipSexpForward();
      end1 = this.cursor.getBufferPosition();
      this.skipSexpForward();
      end2 = this.cursor.getBufferPosition();
      this.skipSexpBackward();
      start2 = this.cursor.getBufferPosition();
      return this._transposeRanges([start1, end1], [start2, end2]);
    };

    EmacsCursor.prototype.transposeLines = function() {
      var lineRange, row, text;
      row = this.cursor.getBufferRow();
      if (row === 0) {
        this._endLineIfNecessary();
        this.cursor.moveDown();
        row += 1;
      }
      this._endLineIfNecessary();
      lineRange = [[row, 0], [row + 1, 0]];
      text = this.editor.getTextInBufferRange(lineRange);
      this.editor.setTextInBufferRange(lineRange, '');
      return this.editor.setTextInBufferRange([[row - 1, 0], [row - 1, 0]], text);
    };

    EmacsCursor.prototype._wordRange = function() {
      var range, wordEnd, wordStart;
      this.skipWordCharactersBackward();
      range = this.locateNonWordCharacterBackward();
      wordStart = range ? range.end : [0, 0];
      range = this.locateNonWordCharacterForward();
      wordEnd = range ? range.start : this.editor.getEofBufferPosition();
      return [wordStart, wordEnd];
    };

    EmacsCursor.prototype._endLineIfNecessary = function() {
      var length, row;
      row = this.cursor.getBufferPosition().row;
      if (row === this.editor.getLineCount() - 1) {
        length = this.cursor.getCurrentBufferLine().length;
        return this.editor.setTextInBufferRange([[row, length], [row, length]], "\n");
      }
    };

    EmacsCursor.prototype._transposeRanges = function(range1, range2) {
      var text1, text2;
      text1 = this.editor.getTextInBufferRange(range1);
      text2 = this.editor.getTextInBufferRange(range2);
      this.editor.setTextInBufferRange(range2, text1);
      this.editor.setTextInBufferRange(range1, text2);
      return this.cursor.setBufferPosition(range2[1]);
    };

    EmacsCursor.prototype._sexpForwardFrom = function(point) {
      var character, eob, eof, quotes, re, ref, ref1, result, stack;
      eob = this.editor.getEofBufferPosition();
      point = ((ref = this.emacsEditor.locateForwardFrom(point, /[\w()[\]{}'"]/i)) != null ? ref.start : void 0) || eob;
      character = this.emacsEditor.characterAfter(point);
      if (OPENERS.hasOwnProperty(character) || CLOSERS.hasOwnProperty(character)) {
        result = null;
        stack = [];
        quotes = 0;
        eof = this.editor.getEofBufferPosition();
        re = /[^()[\]{}"'`\\]+|\\.|[()[\]{}"'`]/g;
        this.editor.scanInBufferRange(re, [point, eof], (function(_this) {
          return function(hit) {
            var closer;
            if (hit.matchText === stack[stack.length - 1]) {
              stack.pop();
              if (stack.length === 0) {
                result = hit.range.end;
                return hit.stop();
              } else if (/^["'`]$/.test(hit.matchText)) {
                return quotes -= 1;
              }
            } else if ((closer = OPENERS[hit.matchText])) {
              if (!(/^["'`]$/.test(closer) && quotes > 0)) {
                stack.push(closer);
                if (/^["'`]$/.test(closer)) {
                  return quotes += 1;
                }
              }
            } else if (CLOSERS[hit.matchText]) {
              if (stack.length === 0) {
                return hit.stop();
              }
            }
          };
        })(this));
        return result || point;
      } else {
        return ((ref1 = this.emacsEditor.locateForwardFrom(point, /[\W\n]/i)) != null ? ref1.start : void 0) || eob;
      }
    };

    EmacsCursor.prototype._sexpBackwardFrom = function(point) {
      var character, quotes, re, ref, ref1, result, stack;
      point = ((ref = this.emacsEditor.locateBackwardFrom(point, /[\w()[\]{}'"]/i)) != null ? ref.end : void 0) || Utils.BOB;
      character = this.emacsEditor.characterBefore(point);
      if (OPENERS.hasOwnProperty(character) || CLOSERS.hasOwnProperty(character)) {
        result = null;
        stack = [];
        quotes = 0;
        re = /[^()[\]{}"'`\\]+|\\.|[()[\]{}"'`]/g;
        this.editor.backwardsScanInBufferRange(re, [Utils.BOB, point], (function(_this) {
          return function(hit) {
            var opener;
            if (hit.matchText === stack[stack.length - 1]) {
              stack.pop();
              if (stack.length === 0) {
                result = hit.range.start;
                return hit.stop();
              } else if (/^["'`]$/.test(hit.matchText)) {
                return quotes -= 1;
              }
            } else if ((opener = CLOSERS[hit.matchText])) {
              if (!(/^["'`]$/.test(opener) && quotes > 0)) {
                stack.push(opener);
                if (/^["'`]$/.test(opener)) {
                  return quotes += 1;
                }
              }
            } else if (OPENERS[hit.matchText]) {
              if (stack.length === 0) {
                return hit.stop();
              }
            }
          };
        })(this));
        return result || point;
      } else {
        return ((ref1 = this.emacsEditor.locateBackwardFrom(point, /[\W\n]/i)) != null ? ref1.end : void 0) || Utils.BOB;
      }
    };

    EmacsCursor.prototype._listForwardFrom = function(point) {
      var end, eob, match;
      eob = this.editor.getEofBufferPosition();
      if (!(match = this.emacsEditor.locateForwardFrom(point, /[()[\]{}]/i))) {
        return null;
      }
      end = this._sexpForwardFrom(match.start);
      if (end.isEqual(match.start)) {
        return null;
      } else {
        return end;
      }
    };

    EmacsCursor.prototype._listBackwardFrom = function(point) {
      var match, start;
      if (!(match = this.emacsEditor.locateBackwardFrom(point, /[()[\]{}]/i))) {
        return null;
      }
      start = this._sexpBackwardFrom(match.end);
      if (start.isEqual(match.end)) {
        return null;
      } else {
        return start;
      }
    };

    EmacsCursor.prototype._getWordCharacterRegExp = function() {
      var nonWordCharacters;
      nonWordCharacters = atom.config.get('editor.nonWordCharacters');
      return new RegExp('[^\\s' + Utils.escapeForRegExp(nonWordCharacters) + ']');
    };

    EmacsCursor.prototype._getNonWordCharacterRegExp = function() {
      var nonWordCharacters;
      nonWordCharacters = atom.config.get('editor.nonWordCharacters');
      return new RegExp('[\\s' + Utils.escapeForRegExp(nonWordCharacters) + ']');
    };

    EmacsCursor.prototype._goTo = function(point) {
      if (point) {
        this.cursor.setBufferPosition(point);
        return true;
      } else {
        return false;
      }
    };

    return EmacsCursor;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2F0b21pYy1lbWFjcy9saWIvZW1hY3MtY3Vyc29yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsUUFBQSxHQUFXLE9BQUEsQ0FBUSxhQUFSOztFQUNYLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFDUCxLQUFBLEdBQVEsT0FBQSxDQUFRLFNBQVI7O0VBQ1Asc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUV4QixPQUFBLEdBQVU7SUFBQyxHQUFBLEVBQUssR0FBTjtJQUFXLEdBQUEsRUFBSyxHQUFoQjtJQUFxQixHQUFBLEVBQUssR0FBMUI7SUFBK0IsSUFBQSxFQUFNLElBQXJDO0lBQTJDLEdBQUEsRUFBSyxHQUFoRDtJQUFxRCxHQUFBLEVBQUssR0FBMUQ7OztFQUNWLE9BQUEsR0FBVTtJQUFDLEdBQUEsRUFBSyxHQUFOO0lBQVcsR0FBQSxFQUFLLEdBQWhCO0lBQXFCLEdBQUEsRUFBSyxHQUExQjtJQUErQixJQUFBLEVBQU0sSUFBckM7SUFBMkMsR0FBQSxFQUFLLEdBQWhEO0lBQXFELEdBQUEsRUFBSyxHQUExRDs7O0VBRVYsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNKLFdBQUMsRUFBQSxHQUFBLEVBQUQsR0FBTSxTQUFDLFdBQUQsRUFBYyxNQUFkOzJDQUNKLE1BQU0sQ0FBQyxlQUFQLE1BQU0sQ0FBQyxlQUFnQixJQUFJLFdBQUosQ0FBZ0IsV0FBaEIsRUFBNkIsTUFBN0I7SUFEbkI7O0lBR08scUJBQUMsWUFBRCxFQUFlLE9BQWY7TUFBQyxJQUFDLENBQUEsY0FBRDtNQUFjLElBQUMsQ0FBQSxTQUFEO01BQzFCLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBQyxDQUFBLE1BQU0sQ0FBQztNQUNsQixJQUFDLENBQUEsS0FBRCxHQUFTO01BQ1QsSUFBQyxDQUFBLGNBQUQsR0FBa0I7TUFDbEIsSUFBQyxD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QXNCLGlCQUF0QixDQUFULEdBQW9ELEdBQS9EO0lBRjBCOzswQkFJNUIsS0FBQSxHQUFPLFNBQUMsS0FBRDtNQUNMLElBQUcsS0FBSDtRQUNFLElBQUMsQ0FBQSxNQUFNLENBQUMsaUJBQVIsQ0FBMEIsS0FBMUI7ZUFDQSxLQUZGO09BQUEsTUFBQTtlQUlFLE1BSkY7O0lBREs7Ozs7O0FBemRUIiwic291cmNlc0NvbnRlbnQiOlsiS2lsbFJpbmcgPSByZXF1aXJlICcuL2tpbGwtcmluZydcbk1hcmsgPSByZXF1aXJlICcuL21hcmsnXG5VdGlscyA9IHJlcXVpcmUgJy4vdXRpbHMnXG57Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuXG5PUEVORVJTID0geycoJzogJyknLCAnWyc6ICddJywgJ3snOiAnfScsICdcXCcnOiAnXFwnJywgJ1wiJzogJ1wiJywgJ2AnOiAnYCd9XG5DTE9TRVJTID0geycpJzogJygnLCAnXSc6ICdbJywgJ30nOiAneycsICdcXCcnOiAnXFwnJywgJ1wiJzogJ1wiJywgJ2AnOiAnYCd9XG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEVtYWNzQ3Vyc29yXG4gIEBmb3I6IChlbWFjc0VkaXRvciwgY3Vyc29yKSAtPlxuICAgIGN1cnNvci5fYXRvbWljRW1hY3MgPz0gbmV3IEVtYWNzQ3Vyc29yKGVtYWNzRWRpdG9yLCBjdXJzb3IpXG5cbiAgY29uc3RydWN0b3I6IChAZW1hY3NFZGl0b3IsIEBjdXJzb3IpIC0+XG4gICAgQGVkaXRvciA9IEBjdXJzb3IuZWRpdG9yXG4gICAgQF9tYXJrID0gbnVsbFxuICAgIEBfbG9jYWxLaWxsUmluZyA9IG51bGxcbiAgICBAX3lhbmtNYXJrZXIgPSBudWxsXG4gICAgQF9kaXNwb3NhYmxlID0gQGN1cnNvci5vbkRpZERlc3Ryb3kgPT4gQGRlc3Ryb3koKVxuXG4gIG1hcms6IC0+XG4gICAgQF9tYXJrID89IG5ldyBNYXJrKEBjdXJzb3IpXG5cbiAga2lsbFJpbmc6IC0+XG4gICAgaWYgQGVkaXRvci5oYXNNdWx0aXBsZUN1cnNvcnMoKVxuICAgICAgQGdldExvY2FsS2lsbFJpbmcoKVxuICAgIGVsc2VcbiAgICAgIEtpbGxSaW5nLmdsb2JhbFxuXG4gIGdldExvY2FsS2lsbFJpbmc6IC0+XG4gICAgQF9sb2NhbEtpbGxSaW5nID89IEtpbGxSaW5nLmdsb2JhbC5mb3JrKClcblxuICBjbGVhckxvY2FsS2lsbFJpbmc6IC0+XG4gICAgQF9sb2NhbEtpbGxSaW5nID0gbnVsbFxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQGNsZWFyTG9jYWxLaWxsUmluZygpXG4gICAgQF9kaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgIEBfZGlzcG9zYWJsZSA9IG51bGxcbiAgICBAX3lhbmtNYXJrZXI/LmRlc3Ryb3koKVxuICAgIEBfbWFyaz8uZGVzdHJveSgpXG4gICAgZGVsZXRlIEBjdXJzb3IuX2F0b21pY0VtYWNzXG5cbiAgIyBMb29rIGZvciB0aGUgcHJldmlvdXMgb2NjdXJyZW5jZSBvZiB0aGUgZ2l2ZW4gcmVnZXhwLlxuICAjXG4gICMgUmV0dXJuIGEgUmFuZ2UgaWYgZm91bmQsIG51bGwgb3RoZXJ3aXNlLiBUaGlzIGRvZXMgbm90IG1vdmUgdGhlIGN1cnNvci5cbiAgbG9jYXRlQmFja3dhcmQ6IChyZWdFeHApIC0+XG4gICAgQGVtYWNzRWRpdG9yLmxvY2F0ZUJhY2t3YXJkRnJvbShAY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCksIHJlZ0V4cClcblxuICAjIExvb2sgZm9yIHRoZSBuZXh0IG9jY3VycmVuY2Ugb2YgdGhlIGdpdmVuIHJlZ2V4cC5cbiAgI1xuICAjIFJldHVybiBhIFJhbmdlIGlmIGZvdW5kLCBudWxsIG90aGVyd2lzZS4gVGhpcyBkb2VzIG5vdCBtb3ZlIHRoZSBjdXJzb3IuXG4gIGxvY2F0ZUZvcndhcmQ6IChyZWdFeHApIC0+XG4gICAgQGVtYWNzRWRpdG9yLmxvY2F0ZUZvcndhcmRGcm9tKEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSwgcmVnRXhwKVxuXG4gICMgTG9vayBmb3IgdGhlIHByZXZpb3VzIHdvcmQgY2hhcmFjdGVyLlxuICAjXG4gICMgUmV0dXJuIGEgUmFuZ2UgaWYgZm91bmQsIG51bGwgb3RoZXJ3aXNlLiBUaGlzIGRvZXMgbm90IG1vdmUgdGhlIGN1cnNvci5cbiAgbG9jYXRlV29yZENoYXJhY3RlckJhY2t3YXJkOiAtPlxuICAgIEBsb2NhdGVCYWNrd2FyZCBAX2dldFdvcmRDaGFyYWN0ZXJSZWdFeHAoKVxuXG4gICMgTG9vayBmb3IgdGhlIG5leHQgd29yZCBjaGFyYWN0ZXIuXG4gICNcbiAgIyBSZXR1cm4gYSBSYW5nZSBpZiBmb3VuZCwgbnVsbCBvdGhlcndpc2UuIFRoaXMgZG9lcyBub3QgbW92ZSB0aGUgY3Vyc29yLlxuICBsb2NhdGVXb3JkQ2hhcmFjdGVyRm9yd2FyZDogLT5cbiAgICBAbG9jYXRlRm9yd2FyZCBAX2dldFdvcmRDaGFyYWN0ZXJSZWdFeHAoKVxuXG4gICMgTG9vayBmb3IgdGhlIHByZXZpb3VzIG5vbndvcmQgY2hhcmFjdGVyLlxuICAjXG4gICMgUmV0dXJuIGEgUmFuZ2UgaWYgZm91bmQsIG51bGwgb3RoZXJ3aXNlLiBUaGlzIGRvZXMgbm90IG1vdmUgdGhlIGN1cnNvci5cbiAgbG9jYXRlTm9uV29yZENoYXJhY3RlckJhY2t3YXJkOiAtPlxuICAgIEBsb2NhdGVCYWNrd2FyZCBAX2dldE5vbldvcmRDaGFyYWN0ZXJSZWdFeHAoKVxuXG4gICMgTG9vayBmb3IgdGhlIG5leHQgbm9ud29yZCBjaGFyYWN0ZXIuXG4gICNcbiAgIyBSZXR1cm4gYSBSYW5nZSBpZiBmb3VuZCwgbnVsbCBvdGhlcndpc2UuIFRoaXMgZG9lcyBub3QgbW92ZSB0aGUgY3Vyc29yLlxuICBsb2NhdGVOb25Xb3JkQ2hhcmFjdGVyRm9yd2FyZDogLT5cbiAgICBAbG9jYXRlRm9yd2FyZCBAX2dldE5vbldvcmRDaGFyYWN0ZXJSZWdFeHAoKVxuXG4gICMgTW92ZSB0byB0aGUgc3RhcnQgb2YgdGhlIHByZXZpb3VzIG9jY3VycmVuY2Ugb2YgdGhlIGdpdmVuIHJlZ2V4cC5cbiAgI1xuICAjIFJldHVybiB0cnVlIGlmIGZvdW5kLCBmYWxzZSBvdGhlcndpc2UuXG4gIGdvVG9NYXRjaFN0YXJ0QmFja3dhcmQ6IChyZWdFeHApIC0+XG4gICAgQF9nb1RvIEBsb2NhdGVCYWNrd2FyZChyZWdFeHApPy5zdGFydFxuXG4gICMgTW92ZSB0byB0aGUgc3RhcnQgb2YgdGhlIG5leHQgb2NjdXJyZW5jZSBvZiB0aGUgZ2l2ZW4gcmVnZXhwLlxuICAjXG4gICMgUmV0dXJuIHRydWUgaWYgZm91bmQsIGZhbHNlIG90aGVyd2lzZS5cbiAgZ29Ub01hdGNoU3RhcnRGb3J3YXJkOiAocmVnRXhwKSAtPlxuICAgIEBfZ29UbyBAbG9jYXRlRm9yd2FyZChyZWdFeHApPy5zdGFydFxuXG4gICMgTW92ZSB0byB0aGUgZW5kIG9mIHRoZSBwcmV2aW91cyBvY2N1cnJlbmNlIG9mIHRoZSBnaXZlbiByZWdleHAuXG4gICNcbiAgIyBSZXR1cm4gdHJ1ZSBpZiBmb3VuZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICBnb1RvTWF0Y2hFbmRCYWNrd2FyZDogKHJlZ0V4cCkgLT5cbiAgICBAX2dvVG8gQGxvY2F0ZUJhY2t3YXJkKHJlZ0V4cCk/LmVuZFxuXG4gICMgTW92ZSB0byB0aGUgZW5kIG9mIHRoZSBuZXh0IG9jY3VycmVuY2Ugb2YgdGhlIGdpdmVuIHJlZ2V4cC5cbiAgI1xuICAjIFJldHVybiB0cnVlIGlmIGZvdW5kLCBmYWxzZSBvdGhlcndpc2UuXG4gIGdvVG9NYXRjaEVuZEZvcndhcmQ6IChyZWdFeHApIC0+XG4gICAgQF9nb1RvIEBsb2NhdGVGb3J3YXJkKHJlZ0V4cCk/LmVuZFxuXG4gICMgU2tpcCBiYWNrd2FyZHMgb3ZlciB0aGUgZ2l2ZW4gY2hhcmFjdGVycy5cbiAgI1xuICAjIElmIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlciBpcyByZWFjaGVkLCByZW1haW4gdGhlcmUuXG4gIHNraXBDaGFyYWN0ZXJzQmFja3dhcmQ6IChjaGFyYWN0ZXJzKSAtPlxuICAgIHJlZ2V4cCA9IG5ldyBSZWdFeHAoXCJbXiN7VXRpbHMuZXNjYXBlRm9yUmVnRXhwKGNoYXJhY3RlcnMpfV1cIilcbiAgICBAc2tpcEJhY2t3YXJkVW50aWwocmVnZXhwKVxuXG4gICMgU2tpcCBmb3J3YXJkcyBvdmVyIHRoZSBnaXZlbiBjaGFyYWN0ZXJzLlxuICAjXG4gICMgSWYgdGhlIGVuZCBvZiB0aGUgYnVmZmVyIGlzIHJlYWNoZWQsIHJlbWFpbiB0aGVyZS5cbiAgc2tpcENoYXJhY3RlcnNGb3J3YXJkOiAoY2hhcmFjdGVycykgLT5cbiAgICByZWdleHAgPSBuZXcgUmVnRXhwKFwiW14je1V0aWxzLmVzY2FwZUZvclJlZ0V4cChjaGFyYWN0ZXJzKX1dXCIpXG4gICAgQHNraXBGb3J3YXJkVW50aWwocmVnZXhwKVxuXG4gICMgU2tpcCBiYWNrd2FyZHMgb3ZlciBhbnkgd29yZCBjaGFyYWN0ZXJzLlxuICAjXG4gICMgSWYgdGhlIGJlZ2lubmluZyBvZiB0aGUgYnVmZmVyIGlzIHJlYWNoZWQsIHJlbWFpbiB0aGVyZS5cbiAgc2tpcFdvcmRDaGFyYWN0ZXJzQmFja3dhcmQ6IC0+XG4gICAgQHNraXBCYWNrd2FyZFVudGlsKEBfZ2V0Tm9uV29yZENoYXJhY3RlclJlZ0V4cCgpKVxuXG4gICMgU2tpcCBmb3J3YXJkcyBvdmVyIGFueSB3b3JkIGNoYXJhY3RlcnMuXG4gICNcbiAgIyBJZiB0aGUgZW5kIG9mIHRoZSBidWZmZXIgaXMgcmVhY2hlZCwgcmVtYWluIHRoZXJlLlxuICBza2lwV29yZENoYXJhY3RlcnNGb3J3YXJkOiAtPlxuICAgIEBza2lwRm9yd2FyZFVudGlsKEBfZ2V0Tm9uV29yZENoYXJhY3RlclJlZ0V4cCgpKVxuXG4gICMgU2tpcCBiYWNrd2FyZHMgb3ZlciBhbnkgbm9uLXdvcmQgY2hhcmFjdGVycy5cbiAgI1xuICAjIElmIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGJ1ZmZlciBpcyByZWFjaGVkLCByZW1haW4gdGhlcmUuXG4gIHNraXBOb25Xb3JkQ2hhcmFjdGVyc0JhY2t3YXJkOiAtPlxuICAgIEBza2lwQmFja3dhcmRVbnRpbChAX2dldFdvcmRDaGFyYWN0ZXJSZWdFeHAoKSlcblxuICAjIFNraXAgZm9yd2FyZHMgb3ZlciBhbnkgbm9uLXdvcmQgY2hhcmFjdGVycy5cbiAgI1xuICAjIElmIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlciBpcyByZWFjaGVkLCByZW1haW4gdGhlcmUuXG4gIHNraXBOb25Xb3JkQ2hhcmFjdGVyc0ZvcndhcmQ6IC0+XG4gICAgQHNraXBGb3J3YXJkVW50aWwoQF9nZXRXb3JkQ2hhcmFjdGVyUmVnRXhwKCkpXG5cbiAgIyBTa2lwIG92ZXIgY2hhcmFjdGVycyB1bnRpbCB0aGUgcHJldmlvdXMgb2NjdXJyZW5jZSBvZiB0aGUgZ2l2ZW4gcmVnZXhwLlxuICAjXG4gICMgSWYgdGhlIGJlZ2lubmluZyBvZiB0aGUgYnVmZmVyIGlzIHJlYWNoZWQsIHJlbWFpbiB0aGVyZS5cbiAgc2tpcEJhY2t3YXJkVW50aWw6IChyZWdleHApIC0+XG4gICAgaWYgbm90IEBnb1RvTWF0Y2hFbmRCYWNrd2FyZChyZWdleHApXG4gICAgICBAX2dvVG8gVXRpbHMuQk9CXG5cbiAgIyBTa2lwIG92ZXIgY2hhcmFjdGVycyB1bnRpbCB0aGUgbmV4dCBvY2N1cnJlbmNlIG9mIHRoZSBnaXZlbiByZWdleHAuXG4gICNcbiAgIyBJZiB0aGUgZW5kIG9mIHRoZSBidWZmZXIgaXMgcmVhY2hlZCwgcmVtYWluIHRoZXJlLlxuICBza2lwRm9yd2FyZFVudGlsOiAocmVnZXhwKSAtPlxuICAgIGlmIG5vdCBAZ29Ub01hdGNoU3RhcnRGb3J3YXJkKHJlZ2V4cClcbiAgICAgIEBfZ29UbyBAZWRpdG9yLmdldEVvZkJ1ZmZlclBvc2l0aW9uKClcblxuICAjIEluc2VydCB0aGUgZ2l2ZW4gdGV4dCBhZnRlciB0aGlzIGN1cnNvci5cbiAgaW5zZXJ0QWZ0ZXI6ICh0ZXh0KSAtPlxuICAgIHBvc2l0aW9uID0gQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShbcG9zaXRpb24sIHBvc2l0aW9uXSwgXCJcXG5cIilcbiAgICBAY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvc2l0aW9uKVxuXG4gIGhvcml6b250YWxTcGFjZVJhbmdlOiAtPlxuICAgIEBza2lwQ2hhcmFjdGVyc0JhY2t3YXJkKCcgXFx0JylcbiAgICBzdGFydCA9IEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIEBza2lwQ2hhcmFjdGVyc0ZvcndhcmQoJyBcXHQnKVxuICAgIGVuZCA9IEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIFtzdGFydCwgZW5kXVxuXG4gIGRlbGV0ZUJsYW5rTGluZXM6IC0+XG4gICAgZW9mID0gQGVkaXRvci5nZXRFb2ZCdWZmZXJQb3NpdGlvbigpXG4gICAgYmxhbmtMaW5lUmUgPSAvXlsgXFx0XSokL1xuXG4gICAgcG9pbnQgPSBAY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBzID0gZSA9IHBvaW50LnJvd1xuICAgIHdoaWxlIGJsYW5rTGluZVJlLnRlc3QoQGN1cnNvci5lZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3coZSkpIGFuZCBlIDw9IGVvZi5yb3dcbiAgICAgIGUgKz0gMVxuICAgIHdoaWxlIHMgPiAwIGFuZCBibGFua0xpbmVSZS50ZXN0KEBjdXJzb3IuZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KHMgLSAxKSlcbiAgICAgIHMgLT0gMVxuXG4gICAgaWYgcyA9PSBlXG4gICAgICAjIE5vIGJsYW5rczogZGVsZXRlIGJsYW5rcyBhaGVhZC5cbiAgICAgIGUgKz0gMVxuICAgICAgd2hpbGUgYmxhbmtMaW5lUmUudGVzdChAY3Vyc29yLmVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhlKSkgYW5kIGUgPD0gZW9mLnJvd1xuICAgICAgICBlICs9IDFcbiAgICAgIEBjdXJzb3IuZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKFtbcyArIDEsIDBdLCBbZSwgMF1dLCAnJylcbiAgICBlbHNlIGlmIGUgPT0gcyArIDFcbiAgICAgICMgT25lIGJsYW5rOiBkZWxldGUgaXQuXG4gICAgICBAY3Vyc29yLmVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShbW3MsIDBdLCBbZSwgMF1dLCAnJylcbiAgICAgIEBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oW3MsIDBdKVxuICAgIGVsc2VcbiAgICAgICMgTXVsdGlwbGUgYmxhbmtzOiBkZWxldGUgYWxsIGJ1dCBvbmUuXG4gICAgICBAY3Vyc29yLmVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShbW3MsIDBdLCBbZSwgMF1dLCAnXFxuJylcbiAgICAgIEBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oW3MsIDBdKVxuXG4gIHRyYW5zZm9ybVdvcmQ6ICh0cmFuc2Zvcm1lcikgLT5cbiAgICBAc2tpcE5vbldvcmRDaGFyYWN0ZXJzRm9yd2FyZCgpXG4gICAgc3RhcnQgPSBAY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBAc2tpcFdvcmRDaGFyYWN0ZXJzRm9yd2FyZCgpXG4gICAgZW5kID0gQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgcmFuZ2UgPSBbc3RhcnQsIGVuZF1cbiAgICB0ZXh0ID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSlcbiAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlLCB0cmFuc2Zvcm1lcih0ZXh0KSlcblxuICBiYWNrd2FyZEtpbGxXb3JkOiAobWV0aG9kKSAtPlxuICAgIEBfa2lsbFVuaXQgbWV0aG9kLCA9PlxuICAgICAgZW5kID0gQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICBAc2tpcE5vbldvcmRDaGFyYWN0ZXJzQmFja3dhcmQoKVxuICAgICAgQHNraXBXb3JkQ2hhcmFjdGVyc0JhY2t3YXJkKClcbiAgICAgIHN0YXJ0ID0gQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICBbc3RhcnQsIGVuZF1cblxuICBraWxsV29yZDogKG1ldGhvZCkgLT5cbiAgICBAX2tpbGxVbml0IG1ldGhvZCwgPT5cbiAgICAgIHN0YXJ0ID0gQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICBAc2tpcE5vbldvcmRDaGFyYWN0ZXJzRm9yd2FyZCgpXG4gICAgICBAc2tpcFdvcmRDaGFyYWN0ZXJzRm9yd2FyZCgpXG4gICAgICBlbmQgPSBAY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIFtzdGFydCwgZW5kXVxuXG4gIGtpbGxMaW5lOiAobWV0aG9kKSAtPlxuICAgIEBfa2lsbFVuaXQgbWV0aG9kLCA9PlxuICAgICAgc3RhcnQgPSBAY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIGxpbmUgPSBAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KHN0YXJ0LnJvdylcbiAgICAgIGlmIHN0YXJ0LmNvbHVtbiA9PSAwIGFuZCBhdG9tLmNvbmZpZy5nZXQoXCJhdG9taWMtZW1hY3Mua2lsbFdob2xlTGluZVwiKVxuICAgICAgICAgIGVuZCA9IFtzdGFydC5yb3cgKyAxLCAwXVxuICAgICAgZWxzZVxuICAgICAgICBpZiAvXlxccyokLy50ZXN0KGxpbmUuc2xpY2Uoc3RhcnQuY29sdW1uKSlcbiAgICAgICAgICBlbmQgPSBbc3RhcnQucm93ICsgMSwgMF1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIGVuZCA9IFtzdGFydC5yb3csIGxpbmUubGVuZ3RoXVxuICAgICAgW3N0YXJ0LCBlbmRdXG5cbiAga2lsbFJlZ2lvbjogKG1ldGhvZCkgLT5cbiAgICBAX2tpbGxVbml0IG1ldGhvZCwgPT5cbiAgICAgIHBvc2l0aW9uID0gQGN1cnNvci5zZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgW3Bvc2l0aW9uLCBwb3NpdGlvbl1cblxuICBfa2lsbFVuaXQ6IChtZXRob2Q9J3B1c2gnLCBmaW5kUmFuZ2UpIC0+XG4gICAgaWYgQGN1cnNvci5zZWxlY3Rpb24/IGFuZCBub3QgQGN1cnNvci5zZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICByYW5nZSA9IEBjdXJzb3Iuc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgIEBjdXJzb3Iuc2VsZWN0aW9uLmNsZWFyKClcbiAgICBlbHNlXG4gICAgICByYW5nZSA9IGZpbmRSYW5nZSgpXG5cbiAgICB0ZXh0ID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSlcbiAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlLCAnJylcbiAgICBraWxsUmluZyA9IEBraWxsUmluZygpXG4gICAga2lsbFJpbmdbbWV0aG9kXSh0ZXh0KVxuICAgIGtpbGxSaW5nLmdldEN1cnJlbnRFbnRyeSgpXG5cbiAgeWFuazogLT5cbiAgICBraWxsUmluZyA9IEBraWxsUmluZygpXG4gICAgcmV0dXJuIGlmIGtpbGxSaW5nLmlzRW1wdHkoKVxuICAgIGlmIEBjdXJzb3Iuc2VsZWN0aW9uXG4gICAgICByYW5nZSA9IEBjdXJzb3Iuc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgIEBjdXJzb3Iuc2VsZWN0aW9uLmNsZWFyKClcbiAgICBlbHNlXG4gICAgICBwb3NpdGlvbiA9IEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgcmFuZ2UgPSBbcG9zaXRpb24sIHBvc2l0aW9uXVxuICAgIG5ld1JhbmdlID0gQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSwga2lsbFJpbmcuZ2V0Q3VycmVudEVudHJ5KCkpXG4gICAgQGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihuZXdSYW5nZS5lbmQpXG4gICAgQF95YW5rTWFya2VyID89IEBlZGl0b3IubWFya0J1ZmZlclBvc2l0aW9uKEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICBAX3lhbmtNYXJrZXIuc2V0QnVmZmVyUmFuZ2UobmV3UmFuZ2UpXG5cbiAgcm90YXRlWWFuazogKG4pIC0+XG4gICAgcmV0dXJuIGlmIEBfeWFua01hcmtlciA9PSBudWxsXG4gICAgZW50cnkgPSBAa2lsbFJpbmcoKS5yb3RhdGUobilcbiAgICB1bmxlc3MgZW50cnkgaXMgbnVsbFxuICAgICAgcmFuZ2UgPSBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKEBfeWFua01hcmtlci5nZXRCdWZmZXJSYW5nZSgpLCBlbnRyeSlcbiAgICAgIEBfeWFua01hcmtlci5zZXRCdWZmZXJSYW5nZShyYW5nZSlcblxuICB5YW5rQ29tcGxldGU6IC0+XG4gICAgQF95YW5rTWFya2VyPy5kZXN0cm95KClcbiAgICBAX3lhbmtNYXJrZXIgPSBudWxsXG5cbiAgbmV4dENoYXJhY3RlcjogLT5cbiAgICBAZW1hY3NFZGl0b3IuY2hhcmFjdGVyQWZ0ZXIoQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuXG4gICMgU2tpcCB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IG9yIG5leHQgc3ltYm9saWMgZXhwcmVzc2lvbi5cbiAgc2tpcFNleHBGb3J3YXJkOiAtPlxuICAgIHBvaW50ID0gQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgdGFyZ2V0ID0gQF9zZXhwRm9yd2FyZEZyb20ocG9pbnQpXG4gICAgQGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbih0YXJnZXQpXG5cbiAgIyBTa2lwIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGN1cnJlbnQgb3IgcHJldmlvdXMgc3ltYm9saWMgZXhwcmVzc2lvbi5cbiAgc2tpcFNleHBCYWNrd2FyZDogLT5cbiAgICBwb2ludCA9IEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIHRhcmdldCA9IEBfc2V4cEJhY2t3YXJkRnJvbShwb2ludClcbiAgICBAY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHRhcmdldClcblxuICAjIFNraXAgdG8gdGhlIGVuZCBvZiB0aGUgY3VycmVudCBvciBuZXh0IGxpc3QuXG4gIHNraXBMaXN0Rm9yd2FyZDogLT5cbiAgICBwb2ludCA9IEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIHRhcmdldCA9IEBfbGlzdEZvcndhcmRGcm9tKHBvaW50KVxuICAgIEBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24odGFyZ2V0KSBpZiB0YXJnZXRcblxuICAjIFNraXAgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgY3VycmVudCBvciBwcmV2aW91cyBsaXN0LlxuICBza2lwTGlzdEJhY2t3YXJkOiAtPlxuICAgIHBvaW50ID0gQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgdGFyZ2V0ID0gQF9saXN0QmFja3dhcmRGcm9tKHBvaW50KVxuICAgIEBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24odGFyZ2V0KSBpZiB0YXJnZXRcblxuICAjIEFkZCB0aGUgbmV4dCBzZXhwIHRvIHRoZSBjdXJzb3IncyBzZWxlY3Rpb24uIEFjdGl2YXRlIGlmIG5lY2Vzc2FyeS5cbiAgbWFya1NleHA6IC0+XG4gICAgcmFuZ2UgPSBAY3Vyc29yLmdldE1hcmtlcigpLmdldEJ1ZmZlclJhbmdlKClcbiAgICBuZXdUYWlsID0gQF9zZXhwRm9yd2FyZEZyb20ocmFuZ2UuZW5kKVxuICAgIG1hcmsgPSBAbWFyaygpLnNldChuZXdUYWlsKVxuICAgIG1hcmsuYWN0aXZhdGUoKSB1bmxlc3MgbWFyay5pc0FjdGl2ZSgpXG5cbiAgIyBUcmFuc3Bvc2UgdGhlIHR3byBjaGFyYWN0ZXJzIGFyb3VuZCB0aGUgY3Vyc29yLiBBdCB0aGUgYmVnaW5uaW5nIG9mIGEgbGluZSxcbiAgIyB0cmFuc3Bvc2UgdGhlIG5ld2xpbmUgd2l0aCB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIHRoZSBsaW5lLiBBdCB0aGUgZW5kIG9mIGFcbiAgIyBsaW5lLCB0cmFuc3Bvc2UgdGhlIGxhc3QgdHdvIGNoYXJhY3RlcnMuIEF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGJ1ZmZlciwgZG9cbiAgIyBub3RoaW5nLiBXZWlyZCwgYnV0IHRoYXQncyBFbWFjcyFcbiAgdHJhbnNwb3NlQ2hhcnM6IC0+XG4gICAge3JvdywgY29sdW1ufSA9IEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIHJldHVybiBpZiByb3cgPT0gMCBhbmQgY29sdW1uID09IDBcblxuICAgIGxpbmUgPSBAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KHJvdylcbiAgICBpZiBjb2x1bW4gPT0gMFxuICAgICAgcHJldmlvdXNMaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cgLSAxKVxuICAgICAgcGFpclJhbmdlID0gW1tyb3cgLSAxLCBwcmV2aW91c0xpbmUubGVuZ3RoXSwgW3JvdywgMV1dXG4gICAgZWxzZSBpZiBjb2x1bW4gPT0gbGluZS5sZW5ndGhcbiAgICAgIHBhaXJSYW5nZSA9IFtbcm93LCBjb2x1bW4gLSAyXSwgW3JvdywgY29sdW1uXV1cbiAgICBlbHNlXG4gICAgICBwYWlyUmFuZ2UgPSBbW3JvdywgY29sdW1uIC0gMV0sIFtyb3csIGNvbHVtbiArIDFdXVxuICAgIHBhaXIgPSBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHBhaXJSYW5nZSlcbiAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKHBhaXJSYW5nZSwgKHBhaXJbMV0gb3IgJycpICsgcGFpclswXSlcblxuICAjIFRyYW5zcG9zZSB0aGUgd29yZCBhdCB0aGUgY3Vyc29yIHdpdGggdGhlIG5leHQgb25lLiBNb3ZlIHRvIHRoZSBlbmQgb2YgdGhlXG4gICMgbmV4dCB3b3JkLlxuICB0cmFuc3Bvc2VXb3JkczogLT5cbiAgICBAc2tpcE5vbldvcmRDaGFyYWN0ZXJzQmFja3dhcmQoKVxuXG4gICAgd29yZDFSYW5nZSA9IEBfd29yZFJhbmdlKClcbiAgICBAc2tpcFdvcmRDaGFyYWN0ZXJzRm9yd2FyZCgpXG4gICAgQHNraXBOb25Xb3JkQ2hhcmFjdGVyc0ZvcndhcmQoKVxuICAgIGlmIEBlZGl0b3IuZ2V0RW9mQnVmZmVyUG9zaXRpb24oKS5pc0VxdWFsKEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICAgICMgTm8gc2Vjb25kIHdvcmQgLSBqdXN0IGdvIGJhY2suXG4gICAgICBAc2tpcE5vbldvcmRDaGFyYWN0ZXJzQmFja3dhcmQoKVxuICAgIGVsc2VcbiAgICAgIHdvcmQyUmFuZ2UgPSBAX3dvcmRSYW5nZSgpXG4gICAgICBAX3RyYW5zcG9zZVJhbmdlcyh3b3JkMVJhbmdlLCB3b3JkMlJhbmdlKVxuXG4gICMgVHJhbnNwb3NlIHRoZSBzZXhwIGF0IHRoZSBjdXJzb3Igd2l0aCB0aGUgbmV4dCBvbmUuIE1vdmUgdG8gdGhlIGVuZCBvZiB0aGVcbiAgIyBuZXh0IHNleHAuXG4gIHRyYW5zcG9zZVNleHBzOiAtPlxuICAgIEBza2lwU2V4cEJhY2t3YXJkKClcbiAgICBzdGFydDEgPSBAY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBAc2tpcFNleHBGb3J3YXJkKClcbiAgICBlbmQxID0gQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICBAc2tpcFNleHBGb3J3YXJkKClcbiAgICBlbmQyID0gQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgQHNraXBTZXhwQmFja3dhcmQoKVxuICAgIHN0YXJ0MiA9IEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuXG4gICAgQF90cmFuc3Bvc2VSYW5nZXMoW3N0YXJ0MSwgZW5kMV0sIFtzdGFydDIsIGVuZDJdKVxuXG4gICMgVHJhbnNwb3NlIHRoZSBsaW5lIGF0IHRoZSBjdXJzb3Igd2l0aCB0aGUgb25lIGFib3ZlIGl0LiBNb3ZlIHRvIHRoZVxuICAjIGJlZ2lubmluZyBvZiB0aGUgbmV4dCBsaW5lLlxuICB0cmFuc3Bvc2VMaW5lczogLT5cbiAgICByb3cgPSBAY3Vyc29yLmdldEJ1ZmZlclJvdygpXG4gICAgaWYgcm93ID09IDBcbiAgICAgIEBfZW5kTGluZUlmTmVjZXNzYXJ5KClcbiAgICAgIEBjdXJzb3IubW92ZURvd24oKVxuICAgICAgcm93ICs9IDFcbiAgICBAX2VuZExpbmVJZk5lY2Vzc2FyeSgpXG5cbiAgICBsaW5lUmFuZ2UgPSBbW3JvdywgMF0sIFtyb3cgKyAxLCAwXV1cbiAgICB0ZXh0ID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShsaW5lUmFuZ2UpXG4gICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShsaW5lUmFuZ2UsICcnKVxuICAgIEBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UoW1tyb3cgLSAxLCAwXSwgW3JvdyAtIDEsIDBdXSwgdGV4dClcblxuICBfd29yZFJhbmdlOiAtPlxuICAgIEBza2lwV29yZENoYXJhY3RlcnNCYWNrd2FyZCgpXG4gICAgcmFuZ2UgPSBAbG9jYXRlTm9uV29yZENoYXJhY3RlckJhY2t3YXJkKClcbiAgICB3b3JkU3RhcnQgPSBpZiByYW5nZSB0aGVuIHJhbmdlLmVuZCBlbHNlIFswLCAwXVxuICAgIHJhbmdlID0gQGxvY2F0ZU5vbldvcmRDaGFyYWN0ZXJGb3J3YXJkKClcbiAgICB3b3JkRW5kID0gaWYgcmFuZ2UgdGhlbiByYW5nZS5zdGFydCBlbHNlIEBlZGl0b3IuZ2V0RW9mQnVmZmVyUG9zaXRpb24oKVxuICAgIFt3b3JkU3RhcnQsIHdvcmRFbmRdXG5cbiAgX2VuZExpbmVJZk5lY2Vzc2FyeTogLT5cbiAgICByb3cgPSBAY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkucm93XG4gICAgaWYgcm93ID09IEBlZGl0b3IuZ2V0TGluZUNvdW50KCkgLSAxXG4gICAgICBsZW5ndGggPSBAY3Vyc29yLmdldEN1cnJlbnRCdWZmZXJMaW5lKCkubGVuZ3RoXG4gICAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKFtbcm93LCBsZW5ndGhdLCBbcm93LCBsZW5ndGhdXSwgXCJcXG5cIilcblxuICBfdHJhbnNwb3NlUmFuZ2VzOiAocmFuZ2UxLCByYW5nZTIpIC0+XG4gICAgdGV4dDEgPSBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlMSlcbiAgICB0ZXh0MiA9IEBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UyKVxuXG4gICAgIyBVcGRhdGUgcmFuZ2UyIGZpcnN0IHNvIGl0IGRvZXNuJ3QgY2hhbmdlIHJhbmdlMS5cbiAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlMiwgdGV4dDEpXG4gICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZTEsIHRleHQyKVxuICAgIEBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocmFuZ2UyWzFdKVxuXG4gIF9zZXhwRm9yd2FyZEZyb206IChwb2ludCkgLT5cbiAgICBlb2IgPSBAZWRpdG9yLmdldEVvZkJ1ZmZlclBvc2l0aW9uKClcbiAgICBwb2ludCA9IEBlbWFjc0VkaXRvci5sb2NhdGVGb3J3YXJkRnJvbShwb2ludCwgL1tcXHcoKVtcXF17fSdcIl0vaSk/LnN0YXJ0IG9yIGVvYlxuICAgIGNoYXJhY3RlciA9IEBlbWFjc0VkaXRvci5jaGFyYWN0ZXJBZnRlcihwb2ludClcbiAgICBpZiBPUEVORVJTLmhhc093blByb3BlcnR5KGNoYXJhY3Rlcikgb3IgQ0xPU0VSUy5oYXNPd25Qcm9wZXJ0eShjaGFyYWN0ZXIpXG4gICAgICByZXN1bHQgPSBudWxsXG4gICAgICBzdGFjayA9IFtdXG4gICAgICBxdW90ZXMgPSAwXG4gICAgICBlb2YgPSBAZWRpdG9yLmdldEVvZkJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIHJlID0gL1teKClbXFxde31cIidgXFxcXF0rfFxcXFwufFsoKVtcXF17fVwiJ2BdL2dcbiAgICAgIEBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UgcmUsIFtwb2ludCwgZW9mXSwgKGhpdCkgPT5cbiAgICAgICAgaWYgaGl0Lm1hdGNoVGV4dCA9PSBzdGFja1tzdGFjay5sZW5ndGggLSAxXVxuICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgaWYgc3RhY2subGVuZ3RoID09IDBcbiAgICAgICAgICAgIHJlc3VsdCA9IGhpdC5yYW5nZS5lbmRcbiAgICAgICAgICAgIGhpdC5zdG9wKClcbiAgICAgICAgICBlbHNlIGlmIC9eW1wiJ2BdJC8udGVzdChoaXQubWF0Y2hUZXh0KVxuICAgICAgICAgICAgcXVvdGVzIC09IDFcbiAgICAgICAgZWxzZSBpZiAoY2xvc2VyID0gT1BFTkVSU1toaXQubWF0Y2hUZXh0XSlcbiAgICAgICAgICB1bmxlc3MgL15bXCInYF0kLy50ZXN0KGNsb3NlcikgYW5kIHF1b3RlcyA+IDBcbiAgICAgICAgICAgIHN0YWNrLnB1c2goY2xvc2VyKVxuICAgICAgICAgICAgcXVvdGVzICs9IDEgaWYgL15bXCInYF0kLy50ZXN0KGNsb3NlcilcbiAgICAgICAgZWxzZSBpZiBDTE9TRVJTW2hpdC5tYXRjaFRleHRdXG4gICAgICAgICAgaWYgc3RhY2subGVuZ3RoID09IDBcbiAgICAgICAgICAgIGhpdC5zdG9wKClcbiAgICAgIHJlc3VsdCBvciBwb2ludFxuICAgIGVsc2VcbiAgICAgIEBlbWFjc0VkaXRvci5sb2NhdGVGb3J3YXJkRnJvbShwb2ludCwgL1tcXFdcXG5dL2kpPy5zdGFydCBvciBlb2JcblxuICBfc2V4cEJhY2t3YXJkRnJvbTogKHBvaW50KSAtPlxuICAgIHBvaW50ID0gQGVtYWNzRWRpdG9yLmxvY2F0ZUJhY2t3YXJkRnJvbShwb2ludCwgL1tcXHcoKVtcXF17fSdcIl0vaSk/LmVuZCBvciBVdGlscy5CT0JcbiAgICBjaGFyYWN0ZXIgPSBAZW1hY3NFZGl0b3IuY2hhcmFjdGVyQmVmb3JlKHBvaW50KVxuICAgIGlmIE9QRU5FUlMuaGFzT3duUHJvcGVydHkoY2hhcmFjdGVyKSBvciBDTE9TRVJTLmhhc093blByb3BlcnR5KGNoYXJhY3RlcilcbiAgICAgIHJlc3VsdCA9IG51bGxcbiAgICAgIHN0YWNrID0gW11cbiAgICAgIHF1b3RlcyA9IDBcbiAgICAgIHJlID0gL1teKClbXFxde31cIidgXFxcXF0rfFxcXFwufFsoKVtcXF17fVwiJ2BdL2dcbiAgICAgIEBlZGl0b3IuYmFja3dhcmRzU2NhbkluQnVmZmVyUmFuZ2UgcmUsIFtVdGlscy5CT0IsIHBvaW50XSwgKGhpdCkgPT5cbiAgICAgICAgaWYgaGl0Lm1hdGNoVGV4dCA9PSBzdGFja1tzdGFjay5sZW5ndGggLSAxXVxuICAgICAgICAgIHN0YWNrLnBvcCgpXG4gICAgICAgICAgaWYgc3RhY2subGVuZ3RoID09IDBcbiAgICAgICAgICAgIHJlc3VsdCA9IGhpdC5yYW5nZS5zdGFydFxuICAgICAgICAgICAgaGl0LnN0b3AoKVxuICAgICAgICAgIGVsc2UgaWYgL15bXCInYF0kLy50ZXN0KGhpdC5tYXRjaFRleHQpXG4gICAgICAgICAgICBxdW90ZXMgLT0gMVxuICAgICAgICBlbHNlIGlmIChvcGVuZXIgPSBDTE9TRVJTW2hpdC5tYXRjaFRleHRdKVxuICAgICAgICAgIHVubGVzcyAvXltcIidgXSQvLnRlc3Qob3BlbmVyKSBhbmQgcXVvdGVzID4gMFxuICAgICAgICAgICAgc3RhY2sucHVzaChvcGVuZXIpXG4gICAgICAgICAgICBxdW90ZXMgKz0gMSBpZiAvXltcIidgXSQvLnRlc3Qob3BlbmVyKVxuICAgICAgICBlbHNlIGlmIE9QRU5FUlNbaGl0Lm1hdGNoVGV4dF1cbiAgICAgICAgICBpZiBzdGFjay5sZW5ndGggPT0gMFxuICAgICAgICAgICAgaGl0LnN0b3AoKVxuICAgICAgcmVzdWx0IG9yIHBvaW50XG4gICAgZWxzZVxuICAgICAgQGVtYWNzRWRpdG9yLmxvY2F0ZUJhY2t3YXJkRnJvbShwb2ludCwgL1tcXFdcXG5dL2kpPy5lbmQgb3IgVXRpbHMuQk9CXG5cbiAgX2xpc3RGb3J3YXJkRnJvbTogKHBvaW50KSAtPlxuICAgIGVvYiA9IEBlZGl0b3IuZ2V0RW9mQnVmZmVyUG9zaXRpb24oKVxuICAgIGlmICEobWF0Y2ggPSBAZW1hY3NFZGl0b3IubG9jYXRlRm9yd2FyZEZyb20ocG9pbnQsIC9bKClbXFxde31dL2kpKVxuICAgICAgcmV0dXJuIG51bGxcbiAgICBlbmQgPSB0aGlzLl9zZXhwRm9yd2FyZEZyb20obWF0Y2guc3RhcnQpXG4gICAgaWYgZW5kLmlzRXF1YWwobWF0Y2guc3RhcnQpIHRoZW4gbnVsbCBlbHNlIGVuZFxuXG4gIF9saXN0QmFja3dhcmRGcm9tOiAocG9pbnQpIC0+XG4gICAgaWYgIShtYXRjaCA9IEBlbWFjc0VkaXRvci5sb2NhdGVCYWNrd2FyZEZyb20ocG9pbnQsIC9bKClbXFxde31dL2kpKVxuICAgICAgcmV0dXJuIG51bGxcbiAgICBzdGFydCA9IHRoaXMuX3NleHBCYWNrd2FyZEZyb20obWF0Y2guZW5kKVxuICAgIGlmIHN0YXJ0LmlzRXF1YWwobWF0Y2guZW5kKSB0aGVuIG51bGwgZWxzZSBzdGFydFxuXG4gIF9nZXRXb3JkQ2hhcmFjdGVyUmVnRXhwOiAtPlxuICAgIG5vbldvcmRDaGFyYWN0ZXJzID0gYXRvbS5jb25maWcuZ2V0KCdlZGl0b3Iubm9uV29yZENoYXJhY3RlcnMnKVxuICAgIG5ldyBSZWdFeHAoJ1teXFxcXHMnICsgVXRpbHMuZXNjYXBlRm9yUmVnRXhwKG5vbldvcmRDaGFyYWN0ZXJzKSArICddJylcblxuICBfZ2V0Tm9uV29yZENoYXJhY3RlclJlZ0V4cDogLT5cbiAgICBub25Xb3JkQ2hhcmFjdGVycyA9IGF0b20uY29uZmlnLmdldCgnZWRpdG9yLm5vbldvcmRDaGFyYWN0ZXJzJylcbiAgICBuZXcgUmVnRXhwKCdbXFxcXHMnICsgVXRpbHMuZXNjYXBlRm9yUmVnRXhwKG5vbldvcmRDaGFyYWN0ZXJzKSArICddJylcblxuICBfZ29UbzogKHBvaW50KSAtPlxuICAgIGlmIHBvaW50XG4gICAgICBAY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuICAgICAgdHJ1ZVxuICAgIGVsc2VcbiAgICAgIGZhbHNlXG4iXX0=
