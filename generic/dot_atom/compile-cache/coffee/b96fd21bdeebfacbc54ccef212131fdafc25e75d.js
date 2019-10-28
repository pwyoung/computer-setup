(function() {
  var Completer, Point, Range, Stage, State, Utils, endOfWordPositionFrom, escapeForRegExp, getNonSymbolCharacterRegExp, ref;

  ref = require('atom'), Point = ref.Point, Range = ref.Range;

  State = require('./state');

  Utils = require('./utils');

  escapeForRegExp = function(string) {
    return string.replace(/[\/\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  getNonSymbolCharacterRegExp = function() {
    var nonWordCharacters;
    nonWordCharacters = atom.config.get('editor.nonWordCharacters');
    if (nonWordCharacters.includes('-')) {
      nonWordCharacters = nonWordCharacters.replace('-', '') + '-';
    }
    nonWordCharacters = nonWordCharacters.replace('_', '');
    return new RegExp('[\\s' + escapeForRegExp(nonWordCharacters) + ']');
  };

  endOfWordPositionFrom = function(editor, point) {
    var eob, result;
    eob = editor.getBuffer().getEndPosition();
    result = null;
    editor.scanInBufferRange(getNonSymbolCharacterRegExp(), [point, eob], function(hit) {
      return result = hit;
    });
    if (result != null) {
      return result.range.start;
    } else {
      return eob;
    }
  };

  Stage = (function() {
    function Stage(regExp1, editor1, range1, searchBackward, getNextStage) {
      this.regExp = regExp1;
      this.editor = editor1;
      this.range = range1;
      this.searchBackward = searchBackward;
      this.getNextStage = getNextStage;
    }

    Stage.prototype.scan = function() {
      var result;
      result = null;
      if (this.searchBackward) {
        this.editor.backwardsScanInBufferRange(this.regExp, this.range, (function(_this) {
          return function(hit) {
            var endOfWordPosition;
            endOfWordPosition = endOfWordPositionFrom(_this.editor, hit.range.end);
            result = _this.editor.getTextInBufferRange([hit.range.start, endOfWordPosition]);
            _this.range = new Range(_this.range.start, hit.range.start);
            return hit.stop();
          };
        })(this));
      } else {
        this.editor.scanInBufferRange(this.regExp, this.range, (function(_this) {
          return function(hit) {
            var endOfWordPosition;
            endOfWordPosition = endOfWordPositionFrom(_this.editor, hit.range.end);
            result = _this.editor.getTextInBufferRange([hit.range.start, endOfWordPosition]);
            _this.range = new Range(hit.range.end, _this.range.end);
            return hit.stop();
          };
        })(this));
      }
      if (result != null) {
        return [this, result];
      } else {
        return [typeof this.getNextStage === "function" ? this.getNextStage() : void 0, null];
      }
    };

    return Stage;

  })();

  module.exports = Completer = (function() {
    function Completer(emacsEditor, emacsCursor) {
      var backwardRange, currentWord, eob, forwardRange, otherEditors, point, prefixEnd, prefixStart, ref1, ref2, ref3, ref4, regExp, thisEditor;
      this.emacsEditor = emacsEditor;
      this.emacsCursor = emacsCursor;
      eob = this.emacsEditor.editor.getBuffer().getEndPosition();
      prefixStart = (ref1 = (ref2 = this.emacsCursor.locateBackward(getNonSymbolCharacterRegExp())) != null ? ref2.end : void 0) != null ? ref1 : Utils.BOB;
      prefixEnd = (ref3 = (ref4 = this.emacsCursor.locateForward(getNonSymbolCharacterRegExp())) != null ? ref4.start : void 0) != null ? ref3 : eob;
      point = this.emacsCursor.cursor.getBufferPosition();
      this._completions = [];
      this.currentIndex = null;
      if (prefixStart.isEqual(point)) {
        this._scanningDone = true;
        return;
      }
      this._marker = this.emacsEditor.editor.markBufferRange([prefixStart, point]);
      this.prefix = this.emacsEditor.editor.getTextInBufferRange([prefixStart, point]);
      backwardRange = new Range(Utils.BOB, prefixStart);
      forwardRange = new Range(prefixEnd, eob);
      regExp = new RegExp("\\b" + (escapeForRegExp(this.prefix)));
      thisEditor = this.emacsEditor.editor;
      otherEditors = atom.workspace.getTextEditors().filter(function(editor) {
        return editor !== thisEditor;
      });
      this._stage = new Stage(regExp, thisEditor, backwardRange, true, (function(_this) {
        return function() {
          var nextEditorStage;
          nextEditorStage = function(index) {
            var editor, range;
            if (index < otherEditors.length - 1) {
              editor = otherEditors[index];
              range = new Range(Utils.BOB, editor.getBuffer().getEndPosition());
              return function() {
                return new Stage(regExp, editor, range, false, nextEditorStage(index + 1));
              };
            } else {
              return null;
            }
          };
          return new Stage(regExp, thisEditor, forwardRange, false, nextEditorStage(0));
        };
      })(this));
      this.disposable = thisEditor.onDidChange((function(_this) {
        return function() {
          if (!State.isDuringCommand) {
            return _this.emacsEditor.dabbrevDone();
          }
        };
      })(this));
      currentWord = this.emacsEditor.editor.getTextInBufferRange([prefixStart, endOfWordPositionFrom(this.emacsEditor.editor, point)]);
      this._seen = new Set([currentWord]);
      this._scanningDone = false;
      this._loadNextCompletion();
      if (this._completions.length > 0) {
        this.select(0);
      }
    }

    Completer.prototype.select = function(index) {
      this.currentIndex = index;
      return this.emacsEditor.editor.setTextInBufferRange(this._marker.getBufferRange(), this._completions[index]);
    };

    Completer.prototype.next = function() {
      if (this.currentIndex === null) {
        return;
      }
      if (this.currentIndex === this._completions.length - 1) {
        this._loadNextCompletion();
      }
      return this.select((this.currentIndex + 1) % this._completions.length);
    };

    Completer.prototype.previous = function() {
      if (this.currentIndex === null) {
        return;
      }
      if (this.currentIndex === 0) {
        if (this._scanningDone && this._completions.length > 0) {
          return this.select(this._completions.length - 1);
        }
      } else {
        return this.select(this.currentIndex - 1);
      }
    };

    Completer.prototype._loadNextCompletion = function() {
      var completion, ref1;
      if (this._scanningDone) {
        return null;
      }
      while (this._stage != null) {
        ref1 = this._stage.scan(), this._stage = ref1[0], completion = ref1[1];
        if ((completion != null) && !this._seen.has(completion)) {
          this._completions.push(completion);
          this._seen.add(completion);
          return null;
        }
      }
      this._scanningDone = true;
      return null;
    };

    Completer.prototype.destroy = function() {
      var ref1;
      return (ref1 = this.disposable) != null ? ref1.dispose() : void 0;
    };

    return Completer;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2F0b21pYy1lbWFjcy9saWIvY29tcGxldGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBaUIsT0FBQSxDQUFRLE1BQVIsQ0FBakIsRUFBQyxpQkFBRCxFQUFROztFQUNSLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7RUFDUixLQUFBLEdBQVEsT0FBQSxDQUFRLFNBQVI7O0VBR1IsZUFBQSxHQUFrQixTQUFDLE1BQUQ7V0FDaEIsTUFBTSxDQUFDLE9BQVAsQ0FBZSx1QkFBZixFQUF3QyxNQUF4QztFQURnQjs7RUFHbEIsMkJBQUEsR0FBOEIsU0FBQTtBQUM1QixRQUFBO0lBQUEsaUJBQUEsR0FBb0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLDBCQUFoQjtJQUNwQixJQUFHLGlCQUFpQixDQUFDLFFBQWxCLENBQTJCLEdBQTNCLENBQUg7TUFDRSxpQkFBQSxHQUFvQixpQkFBaUIsQ0FBQyxPQUFsQixDQUEwQixHQUExQixFQUErQixFQUEvQixDQUFBLEdBQXFDLElBRDNEOztJQUVBLGlCQUFBLEdBQW9CLGlCQUFpQixDQUFDLE9BQWxCLENBQTBCLEdBQTFCLEVBQStCLEVBQS9CO1dBQ3BCLElBQUksTUFBSixDQUFXLE1BQUEsR0FBUyxlQUFBLENBQWdCLGlCQUFoQixDQUFULEdBQThDLEdBQXpEO0VBTDRCOztFQU85QixxQkFBQSxHQUF3QixTQUFDLE1BQUQsRUFBUyxLQUFUO0FBQ3RCLFFBQUE7SUFBQSxHQUFBLEdBQU0sTUFBTSxDQUFDLFNBQVAsQ0FBQSxDQUFrQixDQUFDLGNBQW5CLENBQUE7SUFDTixNQUFBLEdBQVM7SUFDVCxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsMkJBQUEsQ0FBQSxDQUF6QixFQUF3RCxDQUFDLEtBQUQsRUFBUSxHQUFSLENBQXhELEVBQXNFLFNBQUMsR0FBRDth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ZCxDQUFtQixVQUFuQjtVQUNBLElBQUMsQ0FBQSxLQUFLLENBQUMsR0FBUCxDQUFXLFVBQVg7QUFDQSxpQkFBTyxLQUhUOztNQUZGO01BTUEsSUFBQyxDQUFBLGFBQUQsR0FBaUI7YUFDakI7SUFYbUI7O3dCQWFyQixPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7b0RBQVcsQ0FBRSxPQUFiLENBQUE7SUFETzs7Ozs7QUE1SVgiLCJzb3VyY2VzQ29udGVudCI6WyJ7UG9pbnQsIFJhbmdlfSA9IHJlcXVpcmUgJ2F0b20nXG5TdGF0ZSA9IHJlcXVpcmUgJy4vc3RhdGUnXG5VdGlscyA9IHJlcXVpcmUgJy4vdXRpbHMnXG5cbiMgVGFrZW4gZnJvbSB0aGUgYnVpbHQtaW4gZmluZC1hbmQtcmVwbGFjZSBwYWNrYWdlIChlc2NhcGVSZWdFeHApLlxuZXNjYXBlRm9yUmVnRXhwID0gKHN0cmluZykgLT5cbiAgc3RyaW5nLnJlcGxhY2UoL1tcXC9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJylcblxuZ2V0Tm9uU3ltYm9sQ2hhcmFjdGVyUmVnRXhwID0gLT5cbiAgbm9uV29yZENoYXJhY3RlcnMgPSBhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci5ub25Xb3JkQ2hhcmFjdGVycycpXG4gIGlmIG5vbldvcmRDaGFyYWN0ZXJzLmluY2x1ZGVzKCctJylcbiAgICBub25Xb3JkQ2hhcmFjdGVycyA9IG5vbldvcmRDaGFyYWN0ZXJzLnJlcGxhY2UoJy0nLCAnJykgKyAnLSdcbiAgbm9uV29yZENoYXJhY3RlcnMgPSBub25Xb3JkQ2hhcmFjdGVycy5yZXBsYWNlKCdfJywgJycpXG4gIG5ldyBSZWdFeHAoJ1tcXFxccycgKyBlc2NhcGVGb3JSZWdFeHAobm9uV29yZENoYXJhY3RlcnMpICsgJ10nKVxuXG5lbmRPZldvcmRQb3NpdGlvbkZyb20gPSAoZWRpdG9yLCBwb2ludCkgLT5cbiAgZW9iID0gZWRpdG9yLmdldEJ1ZmZlcigpLmdldEVuZFBvc2l0aW9uKClcbiAgcmVzdWx0ID0gbnVsbFxuICBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UgZ2V0Tm9uU3ltYm9sQ2hhcmFjdGVyUmVnRXhwKCksIFtwb2ludCwgZW9iXSwgKGhpdCkgLT5cbiAgICByZXN1bHQgPSBoaXRcbiAgaWYgcmVzdWx0PyB0aGVuIHJlc3VsdC5yYW5nZS5zdGFydCBlbHNlIGVvYlxuXG4jIEEgc3RhZ2Ugb2YgdGhlIHNlYXJjaCBmb3IgY29tcGxldGlvbnMuXG4jXG4jIFRoaXMgcmVwcmVzZW50cyBhIHNpbmdsZSBwYXNzIHRocm91Z2ggYSByZWdpb24gb2YgdGV4dCwgcG9zc2libHkgYmFja3dhcmRzLlxuIyBUaGUgc2VhcmNoIGZvciBjb21wbGV0aW9ucyBjb25zaXN0cyBvZiBhIG51bWJlciBvZiBzdGFnZXM6XG5jbGFzcyBTdGFnZVxuICBjb25zdHJ1Y3RvcjogKEByZWdFeHAsIEBlZGl0b3IsIEByYW5nZSwgQHNlYXJjaEJhY2t3YXJkLCBAZ2V0TmV4dFN0YWdlKSAtPlxuXG4gIHNjYW46IC0+XG4gICAgcmVzdWx0ID0gbnVsbFxuICAgIGlmIEBzZWFyY2hCYWNrd2FyZFxuICAgICAgQGVkaXRvci5iYWNrd2FyZHNTY2FuSW5CdWZmZXJSYW5nZShAcmVnRXhwLCBAcmFuZ2UsIChoaXQpID0+XG4gICAgICAgIGVuZE9mV29yZFBvc2l0aW9uID0gZW5kT2ZXb3JkUG9zaXRpb25Gcm9tKEBlZGl0b3IsIGhpdC5yYW5nZS5lbmQpXG4gICAgICAgIHJlc3VsdCA9IEBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoW2hpdC5yYW5nZS5zdGFydCwgZW5kT2ZXb3JkUG9zaXRpb25dKVxuICAgICAgICBAcmFuZ2UgPSBuZXcgUmFuZ2UoQHJhbmdlLnN0YXJ0LCBoaXQucmFuZ2Uuc3RhcnQpXG4gICAgICAgIGhpdC5zdG9wKClcbiAgICAgIClcbiAgICBlbHNlXG4gICAgICBAZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlKEByZWdFeHAsIEByYW5nZSwgKGhpdCkgPT5cbiAgICAgICAgZW5kT2ZXb3JkUG9zaXRpb24gPSBlbmRPZldvcmRQb3NpdGlvbkZyb20oQGVkaXRvciwgaGl0LnJhbmdlLmVuZClcbiAgICAgICAgcmVzdWx0ID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbaGl0LnJhbmdlLnN0YXJ0LCBlbmRPZldvcmRQb3NpdGlvbl0pXG4gICAgICAgIEByYW5nZSA9IG5ldyBSYW5nZShoaXQucmFuZ2UuZW5kLCBAcmFuZ2UuZW5kKVxuICAgICAgICBoaXQuc3RvcCgpXG4gICAgICApXG5cbiAgICBpZiByZXN1bHQ/XG4gICAgICBbQCwgcmVzdWx0XVxuICAgIGVsc2VcbiAgICAgIFtAZ2V0TmV4dFN0YWdlPygpLCBudWxsXVxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBDb21wbGV0ZXJcbiAgY29uc3RydWN0b3I6IChAZW1hY3NFZGl0b3IsIEBlbWFjc0N1cnNvcikgLT5cbiAgICBlb2IgPSBAZW1hY3NFZGl0b3IuZWRpdG9yLmdldEJ1ZmZlcigpLmdldEVuZFBvc2l0aW9uKClcbiAgICBwcmVmaXhTdGFydCA9IEBlbWFjc0N1cnNvci5sb2NhdGVCYWNrd2FyZChnZXROb25TeW1ib2xDaGFyYWN0ZXJSZWdFeHAoKSk/LmVuZCA/IFV0aWxzLkJPQlxuICAgIHByZWZpeEVuZCA9IEBlbWFjc0N1cnNvci5sb2NhdGVGb3J3YXJkKGdldE5vblN5bWJvbENoYXJhY3RlclJlZ0V4cCgpKT8uc3RhcnQgPyBlb2JcbiAgICBwb2ludCA9IEBlbWFjc0N1cnNvci5jdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuXG4gICAgQF9jb21wbGV0aW9ucyA9IFtdXG4gICAgQGN1cnJlbnRJbmRleCA9IG51bGxcblxuICAgIGlmIHByZWZpeFN0YXJ0LmlzRXF1YWwocG9pbnQpXG4gICAgICBAX3NjYW5uaW5nRG9uZSA9IHRydWVcbiAgICAgIHJldHVyblxuXG4gICAgQF9tYXJrZXIgPSBAZW1hY3NFZGl0b3IuZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShbcHJlZml4U3RhcnQsIHBvaW50XSlcbiAgICBAcHJlZml4ID0gQGVtYWNzRWRpdG9yLmVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbcHJlZml4U3RhcnQsIHBvaW50XSlcblxuICAgIGJhY2t3YXJkUmFuZ2UgPSBuZXcgUmFuZ2UoVXRpbHMuQk9CLCBwcmVmaXhTdGFydClcbiAgICBmb3J3YXJkUmFuZ2UgPSBuZXcgUmFuZ2UocHJlZml4RW5kLCBlb2IpXG5cbiAgICByZWdFeHAgPSBuZXcgUmVnRXhwKFwiXFxcXGIje2VzY2FwZUZvclJlZ0V4cChAcHJlZml4KX1cIilcbiAgICB0aGlzRWRpdG9yID0gQGVtYWNzRWRpdG9yLmVkaXRvclxuICAgIG90aGVyRWRpdG9ycyA9IGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCkuZmlsdGVyIChlZGl0b3IpIC0+XG4gICAgICBlZGl0b3IgaXNudCB0aGlzRWRpdG9yXG5cbiAgICAjIFN0YWdlczpcbiAgICAjICAqIDEgYmFja3dhcmQgc2VhcmNoLCBmcm9tIHBvaW50IHRvIHRoZSBiZWdpbm5pbmcgb2YgYnVmZmVyXG4gICAgIyAgKiAxIGZvcndhcmQgc2VhcmNoLCBmcm9tIHBvaW50IHRvIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICAgICMgICogTiBmb3J3YXJkIHNlYXJjaGVzLCBvZiB3aG9sZSBidWZmZXJzLCBmb3IgZWFjaCBvdGhlciBvcGVuIGZpbGVcbiAgICBAX3N0YWdlID0gbmV3IFN0YWdlIHJlZ0V4cCwgdGhpc0VkaXRvciwgYmFja3dhcmRSYW5nZSwgdHJ1ZSwgPT5cbiAgICAgIG5leHRFZGl0b3JTdGFnZSA9IChpbmRleCkgPT5cbiAgICAgICAgaWYgaW5kZXggPCBvdGhlckVkaXRvcnMubGVuZ3RoIC0gMVxuICAgICAgICAgIGVkaXRvciA9IG90aGVyRWRpdG9yc1tpbmRleF1cbiAgICAgICAgICByYW5nZSA9IG5ldyBSYW5nZShVdGlscy5CT0IsIGVkaXRvci5nZXRCdWZmZXIoKS5nZXRFbmRQb3NpdGlvbigpKVxuICAgICAgICAgID0+IG5ldyBTdGFnZShyZWdFeHAsIGVkaXRvciwgcmFuZ2UsIGZhbHNlLCBuZXh0RWRpdG9yU3RhZ2UoaW5kZXggKyAxKSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG51bGxcbiAgICAgIG5ldyBTdGFnZSByZWdFeHAsIHRoaXNFZGl0b3IsIGZvcndhcmRSYW5nZSwgZmFsc2UsIG5leHRFZGl0b3JTdGFnZSgwKVxuXG4gICAgIyBcIm5hdGl2ZSFcIiBjb21tYW5kcyBkb24ndCBmaXJzdCBvbntEaWQsV2lsbH1EaXNwYXRjaCwgc28gd2UgbmVlZCB0byBsaXN0ZW5cbiAgICAjIHRvIGVkaXRvciBjaGFuZ2VzIHRoYXQgb2NjdXIgb3V0c2lkZSBhIGNvbW1hbmQuXG4gICAgQGRpc3Bvc2FibGUgPSB0aGlzRWRpdG9yLm9uRGlkQ2hhbmdlID0+XG4gICAgICBpZiBub3QgU3RhdGUuaXNEdXJpbmdDb21tYW5kXG4gICAgICAgIEBlbWFjc0VkaXRvci5kYWJicmV2RG9uZSgpXG5cbiAgICBjdXJyZW50V29yZCA9IEBlbWFjc0VkaXRvci5lZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoW3ByZWZpeFN0YXJ0LCBlbmRPZldvcmRQb3NpdGlvbkZyb20oQGVtYWNzRWRpdG9yLmVkaXRvciwgcG9pbnQpXSlcbiAgICBAX3NlZW4gPSBuZXcgU2V0KFtjdXJyZW50V29yZF0pXG4gICAgQF9zY2FubmluZ0RvbmUgPSBmYWxzZVxuICAgIEBfbG9hZE5leHRDb21wbGV0aW9uKClcbiAgICBpZiBAX2NvbXBsZXRpb25zLmxlbmd0aCA+IDBcbiAgICAgIEBzZWxlY3QoMClcblxuICBzZWxlY3Q6IChpbmRleCkgLT5cbiAgICBAY3VycmVudEluZGV4ID0gaW5kZXhcbiAgICBAZW1hY3NFZGl0b3IuZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKEBfbWFya2VyLmdldEJ1ZmZlclJhbmdlKCksIEBfY29tcGxldGlvbnNbaW5kZXhdKVxuXG4gIG5leHQ6IC0+XG4gICAgIyBCYWlsIGlmIHRoZXJlIGFyZSBubyBjb21wbGV0aW9ucy5cbiAgICByZXR1cm4gaWYgQGN1cnJlbnRJbmRleCBpcyBudWxsXG5cbiAgICBpZiBAY3VycmVudEluZGV4ID09IEBfY29tcGxldGlvbnMubGVuZ3RoIC0gMVxuICAgICAgQF9sb2FkTmV4dENvbXBsZXRpb24oKVxuICAgIEBzZWxlY3QoKEBjdXJyZW50SW5kZXggKyAxKSAlIEBfY29tcGxldGlvbnMubGVuZ3RoKVxuXG4gIHByZXZpb3VzOiAtPlxuICAgICMgQmFpbCBpZiB0aGVyZSBhcmUgbm8gY29tcGxldGlvbnMuXG4gICAgcmV0dXJuIGlmIEBjdXJyZW50SW5kZXggaXMgbnVsbFxuXG4gICAgaWYgQGN1cnJlbnRJbmRleCA9PSAwXG4gICAgICAjIElmIHdlJ3ZlIGJlZW4gdG8gdGhlIGVuZCBhbmQgd3JhcHBlZCBhcm91bmQsIGFsbG93IGdvaW5nIGJhY2suXG4gICAgICBpZiBAX3NjYW5uaW5nRG9uZSBhbmQgQF9jb21wbGV0aW9ucy5sZW5ndGggPiAwXG4gICAgICAgIEBzZWxlY3QoQF9jb21wbGV0aW9ucy5sZW5ndGggLSAxKVxuICAgIGVsc2VcbiAgICAgIEBzZWxlY3QoQGN1cnJlbnRJbmRleCAtIDEpXG5cbiAgX2xvYWROZXh0Q29tcGxldGlvbjogLT5cbiAgICBpZiBAX3NjYW5uaW5nRG9uZVxuICAgICAgcmV0dXJuIG51bGxcblxuICAgIHdoaWxlIEBfc3RhZ2U/XG4gICAgICBbQF9zdGFnZSwgY29tcGxldGlvbl0gPSBAX3N0YWdlLnNjYW4oKVxuICAgICAgaWYgY29tcGxldGlvbj8gYW5kIG5vdCBAX3NlZW4uaGFzKGNvbXBsZXRpb24pXG4gICAgICAgIEBfY29tcGxldGlvbnMucHVzaChjb21wbGV0aW9uKVxuICAgICAgICBAX3NlZW4uYWRkKGNvbXBsZXRpb24pXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgQF9zY2FubmluZ0RvbmUgPSB0cnVlXG4gICAgbnVsbFxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQGRpc3Bvc2FibGU/LmRpc3Bvc2UoKVxuIl19
