(function() {
  var CompositeDisposable, CursorTools, Disposable, Emacs, Mark, _, appendCopy, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('underscore-plus');

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Disposable = ref.Disposable;

  Mark = require('./mark');

  CursorTools = require('./cursor-tools');

  appendCopy = require('./selection').appendCopy;

  module.exports = Emacs = (function() {
    var KILL_COMMAND;

    KILL_COMMAND = 'emacs-plus:kill-region';

    Emacs.prototype.destroyed = false;

    function Emacs(editor, globalEmacsState) {
      this.editor = editor;
      this.globalEmacsState = globalEmacsState;
      this.transposeWords = bind(this.transposeWords, this);
      this.transposeLines = bind(this.transposeLines, this);
      this.setMark = bind(this.setMark, this);
      this.recenterTopBottom = bind(this.recenterTopBottom, this);
      this.openLine = bind(this.openLine, this);
      this.killWord = bind(this.killWord, this);
      this.killLine = bind(this.killLine, this);
      this.killWholeLine = bind(this.killWholeLine, this);
      this.killRegion = bind(this.killRegion, this);
      this.justOneSpace = bind(this.justOneSpace, this);
      this.exchangePointAndMark = bind(this.exchangePointAndMark, this);
      this.deleteIndentation = bind(this.deleteIndentation, this);
      this.deleteHorizontalSpace = bind(this.deleteHorizontalSpace, this);
      this.deactivateCursors = bind(this.deactivateCursors, this);
      this.copy = bind(this.copy, this);
      this.capitalizeWord = bind(this.capitalizeWord, this);
      this.backwardKillWord = bind(this.backwardKillWord, this);
      this.appendNextKill = bind(this.appendNextKill, this);
      this.destroy = bind(this.destroy, this);
      this.editorElement = atom.views.getView(this.editor);
      this.mark = Mark["for"](this.editor);
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(this.addClass());
      this.subscriptions.add(this.editor.onDidDestroy(this.destroy));
      this.subscriptions.add(this.editor.onDidInsertText((function(_this) {
        return function() {
          return _this.globalEmacsState.logCommand({
            type: 'editor:didInsertText'
          });
        };
      })(this)));
      this.registerCommands();
    }

    Emacs.prototype.destroy = function() {
      var ref1;
      if (this.destroyed) {
        return;
      }
      this.destroyed = true;
      this.subscriptions.dispose();
      this.subscriptions = null;
      if ((ref1 = this.mark) != null) {
        ref1.destroy();
      }
      this.mark = null;
      this.editor = null;
      return this.editorElement = null;
    };

    Emacs.prototype.registerCommands = function() {
      return this.subscriptions.add(atom.commands.add(this.editorElement, {
        'emacs-plus:append-next-kill': this.appendNextKill,
        'emacs-plus:backward-kill-word': this.backwardKillWord,
        'emacs-plus:capitalize-word': this.capitalizeWord,
        'emacs-plus:copy': this.copy,
        'emacs-plus:delete-horizontal-space': this.deleteHorizontalSpace,
        'emacs-plus:delete-indentation': this.deleteIndentation,
        'emacs-plus:exchange-point-and-mark': this.exchangePointAndMark,
        'emacs-plus:just-one-space': this.justOneSpace,
        'emacs-plus:kill-line': this.killLine,
        'emacs-plus:kill-region': this.killRegion,
        'emacs-plus:kill-whole-line': this.killWholeLine,
        'emacs-plus:kill-word': this.killWord,
        'emacs-plus:open-line': this.openLine,
        'emacs-plus:recenter-top-bottom': this.recenterTopBottom,
        'emacs-plus:set-mark': this.setMark,
        'emacs-plus:transpose-lines': this.transposeLines,
        'emacs-plus:transpose-words': this.transposeWords,
        'emacs-plus:close-other-panes': this.closeOtherPanes,
        'core:cancel': this.deactivateCursors
      }));
    };

    Emacs.prototype.addClass = function() {
      var className;
      className = 'emacs-plus';
      this.editorElement.classList.add(className);
      return new Disposable((function(_this) {
        return function() {
          if (_this.editor.isAlive()) {
            return _this.editorElement.classList.remove(className);
          }
        };
      })(this));
    };

    Emacs.prototype.appendNextKill = function() {
      this.globalEmacsState.thisCommand = KILL_COMMAND;
      return atom.notifications.addInfo('If a next command is a kill, it will append');
    };

    Emacs.prototype.backwardKillWord = function() {
      var maintainClipboard;
      this.globalEmacsState.thisCommand = KILL_COMMAND;
      maintainClipboard = false;
      return this.killSelectedText(function(selection) {
        if (selection.isEmpty()) {
          selection.selectToBeginningOfWord();
        }
        if (!selection.isEmpty()) {
          selection.cut(maintainClipboard);
        }
        return maintainClipboard = true;
      }, true);
    };

    Emacs.prototype.capitalizeWord = function() {
      return this.editor.replaceSelectedText({
        selectWordIfEmpty: true
      }, function(text) {
        return _.capitalize(text);
      });
    };

    Emacs.prototype.copy = function() {
      this.editor.copySelectedText();
      return this.deactivateCursors();
    };

    Emacs.prototype.deactivateCursors = function() {
      return this.mark.deactivate();
    };

    Emacs.prototype.deleteHorizontalSpace = function() {
      var cursor, i, len, range, ref1, results, tools;
      ref1 = this.editor.getCursors();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        cursor = ref1[i];
        tools = new CursorTools(cursor);
        range = tools.horizontalSpaceRange();
        results.push(this.editor.setTextInBufferRange(range, ''));
      }
      return results;
    };

    Emacs.prototype.deleteIndentation = function() {
      return this.editor.transact((function(_this) {
        return function() {
          _this.editor.moveUp();
          return _this.editor.joinLines();
        };
      })(this));
    };

    Emacs.prototype.closeOtherPanes = function() {
      var activePane, i, len, pane, ref1, results;
      activePane = atom.workspace.getActivePane();
      if (!activePane) {
        return;
      }
      ref1 = atom.workspace.getPanes();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        pane = ref1[i];
        if (pane !== activePane) {
          results.push(pane.close());
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Emacs.prototype.exchangePointAndMark = function() {
      return this.mark.exchange();
    };

    Emacs.prototype.justOneSpace = function() {
      var cursor, i, len, range, ref1, results, tools;
      ref1 = this.editor.getCursors();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        cursor = ref1[i];
        tools = new CursorTools(cursor);
        range = tools.horizontalSpaceRange();
        results.push(this.editor.setTextInBufferRange(range, ' '));
      }
      return results;
    };

    Emacs.prototype.killRegion = function() {
      var maintainClipboard;
      this.globalEmacsState.thisCommand = KILL_COMMAND;
      maintainClipboard = false;
      return this.killSelectedText(function(selection) {
        if (!selection.isEmpty()) {
          selection.cut(maintainClipboard, false);
        }
        return maintainClipboard = true;
      });
    };

    Emacs.prototype.killWholeLine = function() {
      var maintainClipboard;
      this.globalEmacsState.thisCommand = KILL_COMMAND;
      maintainClipboard = false;
      return this.killSelectedText(function(selection) {
        selection.clear();
        selection.selectLine();
        selection.cut(maintainClipboard, true);
        return maintainClipboard = true;
      });
    };

    Emacs.prototype.killLine = function(event) {
      var maintainClipboard;
      this.globalEmacsState.thisCommand = KILL_COMMAND;
      maintainClipboard = false;
      return this.killSelectedText(function(selection) {
        if (selection.isEmpty()) {
          selection.selectToEndOfLine();
        }
        if (selection.isEmpty()) {
          selection.selectRight();
        }
        selection.cut(maintainClipboard, false);
        return maintainClipboard = true;
      });
    };

    Emacs.prototype.killWord = function() {
      var maintainClipboard;
      this.globalEmacsState.thisCommand = KILL_COMMAND;
      maintainClipboard = false;
      return this.killSelectedText(function(selection) {
        if (selection.isEmpty()) {
          selection.selectToEndOfWord();
        }
        if (!selection.isEmpty()) {
          selection.cut(maintainClipboard);
        }
        return maintainClipboard = true;
      });
    };

    Emacs.prototype.openLine = function() {
      this.editor.insertNewline();
      return this.editor.moveUp();
    };

    Emacs.prototype.recenterTopBottom = function() {
      var c, maxOffset, maxRow, minOffset, minRow;
      minRow = Math.min.apply(Math, (function() {
        var i, len, ref1, results;
        ref1 = this.editor.getCursors();
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
          c = ref1[i];
          results.push(c.getBufferRow());
        }
        return results;
      }).call(this));
      maxRow = Math.max.apply(Math, (function() {
        var i, len, ref1, results;
        ref1 = this.editor.getCursors();
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
          c = ref1[i];
          results.push(c.getBufferRow());
        }
        return results;
      }).call(this));
      minOffset = this.editorElement.pixelPositionForBufferPosition([minRow, 0]);
      maxOffset = this.editorElement.pixelPositionForBufferPosition([maxRow, 0]);
      return this.editorElement.setScrollTop((minOffset.top + maxOffset.top - this.editorElement.getHeight()) / 2);
    };

    Emacs.prototype.setMark = function() {
      return this.mark.activate();
    };

    Emacs.prototype.transposeLines = function() {
      var cursor, row;
      cursor = this.editor.getLastCursor();
      row = cursor.getBufferRow();
      return this.editor.transact((function(_this) {
        return function() {
          var text, tools;
          tools = new CursorTools(cursor);
          if (row === 0) {
            tools.endLineIfNecessary();
            cursor.moveDown();
            row += 1;
          }
          tools.endLineIfNecessary();
          text = _this.editor.getTextInBufferRange([[row, 0], [row + 1, 0]]);
          _this.editor.deleteLine(row);
          return _this.editor.setTextInBufferRange([[row - 1, 0], [row - 1, 0]], text);
        };
      })(this));
    };

    Emacs.prototype.transposeWords = function() {
      return this.editor.transact((function(_this) {
        return function() {
          var cursor, cursorTools, i, len, ref1, results, word1, word1Pos, word2, word2Pos;
          ref1 = _this.editor.getCursors();
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            cursor = ref1[i];
            cursorTools = new CursorTools(cursor);
            cursorTools.skipNonWordCharactersBackward();
            word1 = cursorTools.extractWord();
            word1Pos = cursor.getBufferPosition();
            cursorTools.skipNonWordCharactersForward();
            if (_this.editor.getEofBufferPosition().isEqual(cursor.getBufferPosition())) {
              _this.editor.setTextInBufferRange([word1Pos, word1Pos], word1);
              cursorTools.skipNonWordCharactersBackward();
            } else {
              word2 = cursorTools.extractWord();
              word2Pos = cursor.getBufferPosition();
              _this.editor.setTextInBufferRange([word2Pos, word2Pos], word1);
              _this.editor.setTextInBufferRange([word1Pos, word1Pos], word2);
            }
            results.push(cursor.setBufferPosition(cursor.getBufferPosition()));
          }
          return results;
        };
      })(this));
    };

    Emacs.prototype.killSelectedText = function(fn, reversed) {
      var copyMethods, i, j, len, len1, originalCopy, ref1, ref2, selection;
      if (reversed == null) {
        reversed = false;
      }
      if (this.globalEmacsState.lastCommand !== KILL_COMMAND) {
        return this.editor.mutateSelectedText(fn);
      }
      copyMethods = new WeakMap;
      ref1 = this.editor.getSelections();
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        copyMethods.set(selection, selection.copy);
        selection.copy = appendCopy.bind(selection, reversed);
      }
      this.editor.mutateSelectedText(fn);
      ref2 = this.editor.getSelections();
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        selection = ref2[j];
        originalCopy = copyMethods.get(selection);
        if (originalCopy) {
          selection.copy = originalCopy;
        }
      }
    };

    return Emacs;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2VtYWNzLXBsdXMvbGliL2VtYWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNkVBQUE7SUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLE1BQW9DLE9BQUEsQ0FBUSxNQUFSLENBQXBDLEVBQUMsNkNBQUQsRUFBc0I7O0VBQ3RCLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFDUCxXQUFBLEdBQWMsT0FBQSxDQUFRLGdCQUFSOztFQUNiLGFBQWMsT0FBQSxDQUFRLGFBQVI7O0VBRWYsTUFBTSxDQUFDLE9BQVAsR0FDTTtBQUNKLFFBQUE7O0lBQUEsWUFBQSxHQUFlOztvQkFFZixTQUFBLEdBQVc7O0lBRUUsZUFBQyxNQUFELEVBQVUsZ0JBQVY7TUFBQyxJQUFDLENBQUEsU0FBRDtNQUFTLElBQUMsQ0FBQSxtQkFBRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7TUFDckIsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFYLENBQW1CLElBQUMsQ0FBQSxNQUFwQjtNQUNqQixJQUFDLENBQUEsSUFBRCxHQUFRLElBQUksRUFBQyxHQUFELEVBQUosQ0FBUyxJQUFDLENBQUEsTUFBVjtNQUNSLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7TUFDckIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBbkI7TUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFSLENBQXFCLElBQUMsQ0FBQSxPQUF0QixDQUFuQjtNQUdBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsTUFBTSxDQUFDLGVBQVIsQ0FBeUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFB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QW1ELEtBQW5ELEVBUkY7O3lCQVNBLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixNQUFNLENBQUMsaUJBQVAsQ0FBQSxDQUF6QjtBQWhCRjs7UUFEZTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakI7SUFEYzs7b0JBcUJoQixnQkFBQSxHQUFrQixTQUFDLEVBQUQsRUFBSyxRQUFMO0FBQ2hCLFVBQUE7O1FBRHFCLFdBQVc7O01BQ2hDLElBQUcsSUFBQyxDQUFBLGdCQUFnQixDQUFDLFdBQWxCLEtBQW1DLFlBQXRDO0FBQ0UsZUFBTyxJQUFDLENBQUEsTUFBTSxDQUFDLGtCQUFSLENBQTJCLEVBQTNCLEVBRFQ7O01BR0EsV0FBQSxHQUFjLElBQUk7QUFDbEI7QUFBQSxXQUFBLHNDQUFBOztRQUNFLFdBQVcsQ0FBQyxHQUFaLENBQWdCLFNBQWhCLEVBQTJCLFNBQVMsQ0FBQyxJQUFyQztRQUNBLFNBQVMsQ0FBQyxJQUFWLEdBQWlCLFVBQVUsQ0FBQyxJQUFYLENBQWdCLFNBQWhCLEVBQTJCLFFBQTNCO0FBRm5CO01BSUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxrQkFBUixDQUEyQixFQUEzQjtBQUVBO0FBQUEsV0FBQSx3Q0FBQTs7UUFDRSxZQUFBLEdBQWUsV0FBVyxDQUFDLEdBQVosQ0FBZ0IsU0FBaEI7UUFDZixJQUFpQyxZQUFqQztVQUFBLFNBQVMsQ0FBQyxJQUFWLEdBQWlCLGFBQWpCOztBQUZGO0lBWGdCOzs7OztBQXZNcEIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbk1hcmsgPSByZXF1aXJlICcuL21hcmsnXG5DdXJzb3JUb29scyA9IHJlcXVpcmUgJy4vY3Vyc29yLXRvb2xzJ1xue2FwcGVuZENvcHl9ID0gcmVxdWlyZSAnLi9zZWxlY3Rpb24nXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEVtYWNzXG4gIEtJTExfQ09NTUFORCA9ICdlbWFjcy1wbHVzOmtpbGwtcmVnaW9uJ1xuXG4gIGRlc3Ryb3llZDogZmFsc2VcblxuICBjb25zdHJ1Y3RvcjogKEBlZGl0b3IsIEBnbG9iYWxFbWFjc1N0YXRlKSAtPlxuICAgIEBlZGl0b3JFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KEBlZGl0b3IpXG4gICAgQG1hcmsgPSBNYXJrLmZvcihAZWRpdG9yKVxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQoQGFkZENsYXNzKCkpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkKEBlZGl0b3Iub25EaWREZXN0cm95KEBkZXN0cm95KSlcblxuICAgICMgbmVlZCBmb3Iga2lsbC1yZWdpb25cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQoQGVkaXRvci5vbkRpZEluc2VydFRleHQoID0+XG4gICAgICBAZ2xvYmFsRW1hY3NTdGF0ZS5sb2dDb21tYW5kKHR5cGU6ICdlZGl0b3I6ZGlkSW5zZXJ0VGV4dCcpXG4gICAgKSlcblxuICAgIEByZWdpc3RlckNvbW1hbmRzKClcblxuICBkZXN0cm95OiA9PlxuICAgIHJldHVybiBpZiBAZGVzdHJveWVkXG4gICAgQGRlc3Ryb3llZCA9IHRydWVcbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG51bGxcbiAgICBAbWFyaz8uZGVzdHJveSgpXG4gICAgQG1hcmsgPSBudWxsXG4gICAgQGVkaXRvciA9IG51bGxcbiAgICBAZWRpdG9yRWxlbWVudCA9IG51bGxcblxuICByZWdpc3RlckNvbW1hbmRzOiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCBAZWRpdG9yRWxlbWVudCxcbiAgICAgICdlbWFjcy1wbHVzOmFwcGVuZC1uZXh0LWtpbGwnOiBAYXBwZW5kTmV4dEtpbGxcbiAgICAgICdlbWFjcy1wbHVzOmJhY2t3YXJkLWtpbGwtd29yZCc6IEBiYWNrd2FyZEtpbGxXb3JkXG4gICAgICAnZW1hY3MtcGx1czpjYXBpdGFsaXplLXdvcmQnOiBAY2FwaXRhbGl6ZVdvcmRcbiAgICAgICdlbWFjcy1wbHVzOmNvcHknOiBAY29weVxuICAgICAgJ2VtYWNzLXBsdXM6ZGVsZXRlLWhvcml6b250YWwtc3BhY2UnOiBAZGVsZXRlSG9yaXpvbnRhbFNwYWNlXG4gICAgICAnZW1hY3MtcGx1czpkZWxldGUtaW5kZW50YXRpb24nOiBAZGVsZXRlSW5kZW50YXRpb25cbiAgICAgICdlbWFjcy1wbHVzOmV4Y2hhbmdlLXBvaW50LWFuZC1tYXJrJzogQGV4Y2hhbmdlUG9pbnRBbmRNYXJrXG4gICAgICAnZW1hY3MtcGx1czpqdXN0LW9uZS1zcGFjZSc6IEBqdXN0T25lU3BhY2VcbiAgICAgICdlbWFjcy1wbHVzOmtpbGwtbGluZSc6IEBraWxsTGluZVxuICAgICAgJ2VtYWNzLXBsdXM6a2lsbC1yZWdpb24nOiBAa2lsbFJlZ2lvblxuICAgICAgJ2VtYWNzLXBsdXM6a2lsbC13aG9sZS1saW5lJzogQGtpbGxXaG9sZUxpbmVcbiAgICAgICdlbWFjcy1wbHVzOmtpbGwtd29yZCc6IEBraWxsV29yZFxuICAgICAgJ2VtYWNzLXBsdXM6b3Blbi1saW5lJzogQG9wZW5MaW5lXG4gICAgICAnZW1hY3MtcGx1czpyZWNlbnRlci10b3AtYm90dG9tJzogQHJlY2VudGVyVG9wQm90dG9tXG4gICAgICAnZW1hY3MtcGx1czpzZXQtbWFyayc6IEBzZXRNYXJrXG4gICAgICAnZW1hY3MtcGx1czp0cmFuc3Bvc2UtbGluZXMnOiBAdHJhbnNwb3NlTGluZXNcbiAgICAgICdlbWFjcy1wbHVzOnRyYW5zcG9zZS13b3Jkcyc6IEB0cmFuc3Bvc2VXb3Jkc1xuICAgICAgJ2VtYWNzLXBsdXM6Y2xvc2Utb3RoZXItcGFuZXMnOiBAY2xvc2VPdGhlclBhbmVzXG4gICAgICAnY29yZTpjYW5jZWwnOiBAZGVhY3RpdmF0ZUN1cnNvcnNcblxuICBhZGRDbGFzczogLT5cbiAgICBjbGFzc05hbWUgPSAnZW1hY3MtcGx1cydcbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSlcbiAgICBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpIGlmIEBlZGl0b3IuaXNBbGl2ZSgpXG5cbiAgYXBwZW5kTmV4dEtpbGw6ID0+XG4gICAgQGdsb2JhbEVtYWNzU3RhdGUudGhpc0NvbW1hbmQgPSBLSUxMX0NPTU1BTkRcbiAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbygnSWYgYSBuZXh0IGNvbW1hbmQgaXMgYSBraWxsLCBpdCB3aWxsIGFwcGVuZCcpXG5cbiAgYmFja3dhcmRLaWxsV29yZDogPT5cbiAgICBAZ2xvYmFsRW1hY3NTdGF0ZS50aGlzQ29tbWFuZCA9IEtJTExfQ09NTUFORFxuICAgIG1haW50YWluQ2xpcGJvYXJkID0gZmFsc2VcbiAgICBAa2lsbFNlbGVjdGVkVGV4dCgoc2VsZWN0aW9uKSAtPlxuICAgICAgc2VsZWN0aW9uLnNlbGVjdFRvQmVnaW5uaW5nT2ZXb3JkKCkgaWYgc2VsZWN0aW9uLmlzRW1wdHkoKVxuICAgICAgc2VsZWN0aW9uLmN1dChtYWludGFpbkNsaXBib2FyZCkgdW5sZXNzIHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgIG1haW50YWluQ2xpcGJvYXJkID0gdHJ1ZVxuICAgICwgdHJ1ZSlcblxuICBjYXBpdGFsaXplV29yZDogPT5cbiAgICBAZWRpdG9yLnJlcGxhY2VTZWxlY3RlZFRleHQgc2VsZWN0V29yZElmRW1wdHk6IHRydWUsICh0ZXh0KSAtPlxuICAgICAgXy5jYXBpdGFsaXplKHRleHQpXG5cbiAgY29weTogPT5cbiAgICBAZWRpdG9yLmNvcHlTZWxlY3RlZFRleHQoKVxuICAgIEBkZWFjdGl2YXRlQ3Vyc29ycygpXG5cbiAgZGVhY3RpdmF0ZUN1cnNvcnM6ID0+XG4gICAgQG1hcmsuZGVhY3RpdmF0ZSgpXG5cbiAgZGVsZXRlSG9yaXpvbnRhbFNwYWNlOiA9PlxuICAgIGZvciBjdXJzb3IgaW4gQGVkaXRvci5nZXRDdXJzb3JzKClcbiAgICAgIHRvb2xzID0gbmV3IEN1cnNvclRvb2xzKGN1cnNvcilcbiAgICAgIHJhbmdlID0gdG9vbHMuaG9yaXpvbnRhbFNwYWNlUmFuZ2UoKVxuICAgICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSwgJycpXG5cbiAgZGVsZXRlSW5kZW50YXRpb246ID0+XG4gICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgQGVkaXRvci5tb3ZlVXAoKVxuICAgICAgQGVkaXRvci5qb2luTGluZXMoKVxuXG4gIGNsb3NlT3RoZXJQYW5lczogLT5cbiAgICBhY3RpdmVQYW5lID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpXG4gICAgcmV0dXJuIHVubGVzcyBhY3RpdmVQYW5lXG4gICAgZm9yIHBhbmUgaW4gYXRvbS53b3Jrc3BhY2UuZ2V0UGFuZXMoKVxuICAgICAgcGFuZS5jbG9zZSgpIGlmIHBhbmUgaXNudCBhY3RpdmVQYW5lXG5cbiAgZXhjaGFuZ2VQb2ludEFuZE1hcms6ID0+XG4gICAgQG1hcmsuZXhjaGFuZ2UoKVxuXG4gIGp1c3RPbmVTcGFjZTogPT5cbiAgICBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgICB0b29scyA9IG5ldyBDdXJzb3JUb29scyhjdXJzb3IpXG4gICAgICByYW5nZSA9IHRvb2xzLmhvcml6b250YWxTcGFjZVJhbmdlKClcbiAgICAgIEBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UsICcgJylcblxuICBraWxsUmVnaW9uOiA9PlxuICAgIEBnbG9iYWxFbWFjc1N0YXRlLnRoaXNDb21tYW5kID0gS0lMTF9DT01NQU5EXG4gICAgbWFpbnRhaW5DbGlwYm9hcmQgPSBmYWxzZVxuICAgIEBraWxsU2VsZWN0ZWRUZXh0IChzZWxlY3Rpb24pIC0+XG4gICAgICBzZWxlY3Rpb24uY3V0KG1haW50YWluQ2xpcGJvYXJkLCBmYWxzZSkgdW5sZXNzIHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgIG1haW50YWluQ2xpcGJvYXJkID0gdHJ1ZVxuXG4gIGtpbGxXaG9sZUxpbmU6ID0+XG4gICAgQGdsb2JhbEVtYWNzU3RhdGUudGhpc0NvbW1hbmQgPSBLSUxMX0NPTU1BTkRcbiAgICBtYWludGFpbkNsaXBib2FyZCA9IGZhbHNlXG4gICAgQGtpbGxTZWxlY3RlZFRleHQgKHNlbGVjdGlvbikgLT5cbiAgICAgIHNlbGVjdGlvbi5jbGVhcigpXG4gICAgICBzZWxlY3Rpb24uc2VsZWN0TGluZSgpXG4gICAgICBzZWxlY3Rpb24uY3V0KG1haW50YWluQ2xpcGJvYXJkLCB0cnVlKVxuICAgICAgbWFpbnRhaW5DbGlwYm9hcmQgPSB0cnVlXG5cbiAga2lsbExpbmU6IChldmVudCkgPT5cbiAgICBAZ2xvYmFsRW1hY3NTdGF0ZS50aGlzQ29tbWFuZCA9IEtJTExfQ09NTUFORFxuICAgIG1haW50YWluQ2xpcGJvYXJkID0gZmFsc2VcbiAgICBAa2lsbFNlbGVjdGVkVGV4dCAoc2VsZWN0aW9uKSAtPlxuICAgICAgc2VsZWN0aW9uLnNlbGVjdFRvRW5kT2ZMaW5lKCkgaWYgc2VsZWN0aW9uLmlzRW1wdHkoKVxuICAgICAgaWYgc2VsZWN0aW9uLmlzRW1wdHkoKVxuICAgICAgICBzZWxlY3Rpb24uc2VsZWN0UmlnaHQoKVxuICAgICAgc2VsZWN0aW9uLmN1dChtYWludGFpbkNsaXBib2FyZCwgZmFsc2UpXG4gICAgICBtYWludGFpbkNsaXBib2FyZCA9IHRydWVcblxuICBraWxsV29yZDogPT5cbiAgICBAZ2xvYmFsRW1hY3NTdGF0ZS50aGlzQ29tbWFuZCA9IEtJTExfQ09NTUFORFxuICAgIG1haW50YWluQ2xpcGJvYXJkID0gZmFsc2VcbiAgICBAa2lsbFNlbGVjdGVkVGV4dCAoc2VsZWN0aW9uKSAtPlxuICAgICAgc2VsZWN0aW9uLnNlbGVjdFRvRW5kT2ZXb3JkKCkgaWYgc2VsZWN0aW9uLmlzRW1wdHkoKVxuICAgICAgc2VsZWN0aW9uLmN1dChtYWludGFpbkNsaXBib2FyZCkgdW5sZXNzIHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgIG1haW50YWluQ2xpcGJvYXJkID0gdHJ1ZVxuXG4gIG9wZW5MaW5lOiA9PlxuICAgIEBlZGl0b3IuaW5zZXJ0TmV3bGluZSgpXG4gICAgQGVkaXRvci5tb3ZlVXAoKVxuXG4gIHJlY2VudGVyVG9wQm90dG9tOiA9PlxuICAgIG1pblJvdyA9IE1hdGgubWluKChjLmdldEJ1ZmZlclJvdygpIGZvciBjIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpKS4uLilcbiAgICBtYXhSb3cgPSBNYXRoLm1heCgoYy5nZXRCdWZmZXJSb3coKSBmb3IgYyBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKSkuLi4pXG4gICAgbWluT2Zmc2V0ID0gQGVkaXRvckVsZW1lbnQucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKFttaW5Sb3csIDBdKVxuICAgIG1heE9mZnNldCA9IEBlZGl0b3JFbGVtZW50LnBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbihbbWF4Um93LCAwXSlcbiAgICBAZWRpdG9yRWxlbWVudC5zZXRTY3JvbGxUb3AoKG1pbk9mZnNldC50b3AgKyBtYXhPZmZzZXQudG9wIC0gQGVkaXRvckVsZW1lbnQuZ2V0SGVpZ2h0KCkpLzIpXG5cbiAgc2V0TWFyazogPT5cbiAgICBAbWFyay5hY3RpdmF0ZSgpXG5cbiAgdHJhbnNwb3NlTGluZXM6ID0+XG4gICAgY3Vyc29yID0gQGVkaXRvci5nZXRMYXN0Q3Vyc29yKClcbiAgICByb3cgPSBjdXJzb3IuZ2V0QnVmZmVyUm93KClcblxuICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIHRvb2xzID0gbmV3IEN1cnNvclRvb2xzKGN1cnNvcilcbiAgICAgIGlmIHJvdyA9PSAwXG4gICAgICAgIHRvb2xzLmVuZExpbmVJZk5lY2Vzc2FyeSgpXG4gICAgICAgIGN1cnNvci5tb3ZlRG93bigpXG4gICAgICAgIHJvdyArPSAxXG4gICAgICB0b29scy5lbmRMaW5lSWZOZWNlc3NhcnkoKVxuXG4gICAgICB0ZXh0ID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbW3JvdywgMF0sIFtyb3cgKyAxLCAwXV0pXG4gICAgICBAZWRpdG9yLmRlbGV0ZUxpbmUocm93KVxuICAgICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShbW3JvdyAtIDEsIDBdLCBbcm93IC0gMSwgMF1dLCB0ZXh0KVxuXG4gIHRyYW5zcG9zZVdvcmRzOiA9PlxuICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIGZvciBjdXJzb3IgaW4gQGVkaXRvci5nZXRDdXJzb3JzKClcbiAgICAgICAgY3Vyc29yVG9vbHMgPSBuZXcgQ3Vyc29yVG9vbHMoY3Vyc29yKVxuICAgICAgICBjdXJzb3JUb29scy5za2lwTm9uV29yZENoYXJhY3RlcnNCYWNrd2FyZCgpXG5cbiAgICAgICAgd29yZDEgPSBjdXJzb3JUb29scy5leHRyYWN0V29yZCgpXG4gICAgICAgIHdvcmQxUG9zID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgICAgY3Vyc29yVG9vbHMuc2tpcE5vbldvcmRDaGFyYWN0ZXJzRm9yd2FyZCgpXG4gICAgICAgIGlmIEBlZGl0b3IuZ2V0RW9mQnVmZmVyUG9zaXRpb24oKS5pc0VxdWFsKGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuICAgICAgICAgICMgTm8gc2Vjb25kIHdvcmQgLSBwdXQgdGhlIGZpcnN0IHdvcmQgYmFjay5cbiAgICAgICAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKFt3b3JkMVBvcywgd29yZDFQb3NdLCB3b3JkMSlcbiAgICAgICAgICBjdXJzb3JUb29scy5za2lwTm9uV29yZENoYXJhY3RlcnNCYWNrd2FyZCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB3b3JkMiA9IGN1cnNvclRvb2xzLmV4dHJhY3RXb3JkKClcbiAgICAgICAgICB3b3JkMlBvcyA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICAgICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShbd29yZDJQb3MsIHdvcmQyUG9zXSwgd29yZDEpXG4gICAgICAgICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShbd29yZDFQb3MsIHdvcmQxUG9zXSwgd29yZDIpXG4gICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcblxuICAjIHByaXZhdGVcbiAga2lsbFNlbGVjdGVkVGV4dDogKGZuLCByZXZlcnNlZCA9IGZhbHNlKSAtPlxuICAgIGlmIEBnbG9iYWxFbWFjc1N0YXRlLmxhc3RDb21tYW5kIGlzbnQgS0lMTF9DT01NQU5EXG4gICAgICByZXR1cm4gQGVkaXRvci5tdXRhdGVTZWxlY3RlZFRleHQoZm4pXG5cbiAgICBjb3B5TWV0aG9kcyA9IG5ldyBXZWFrTWFwXG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgY29weU1ldGhvZHMuc2V0KHNlbGVjdGlvbiwgc2VsZWN0aW9uLmNvcHkpXG4gICAgICBzZWxlY3Rpb24uY29weSA9IGFwcGVuZENvcHkuYmluZChzZWxlY3Rpb24sIHJldmVyc2VkKVxuXG4gICAgQGVkaXRvci5tdXRhdGVTZWxlY3RlZFRleHQoZm4pXG5cbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICBvcmlnaW5hbENvcHkgPSBjb3B5TWV0aG9kcy5nZXQoc2VsZWN0aW9uKVxuICAgICAgc2VsZWN0aW9uLmNvcHkgPSBvcmlnaW5hbENvcHkgaWYgb3JpZ2luYWxDb3B5XG5cbiAgICByZXR1cm5cbiJdfQ==
