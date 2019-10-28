(function() {
  var Completer, CompositeDisposable, EmacsCursor, EmacsEditor, KillRing, Mark, Point, State, Utils, ref,
    slice = [].slice;

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Point = ref.Point;

  Completer = require('./completer');

  EmacsCursor = require('./emacs-cursor');

  KillRing = require('./kill-ring');

  Mark = require('./mark');

  State = require('./state');

  Utils = require('./utils');

  module.exports = EmacsEditor = (function() {
    var capitalize, downcase, upcase;

    EmacsEditor["for"] = function(editor) {
      return editor._atomicEmacs != null ? editor._atomicEmacs : editor._atomicEmacs = new EmacsEditor(editor);
    };

    function EmacsEditor(editor1) {
      this.editor = editor1;
      this.disposable = new CompositeDisposable;
      this.disposable.add(this.editor.onDidRemoveCursor((function(_this) {
        return function() {
          var cursors;
          cursors = _this.editor.getCursors();
          if (cursors.length === 1) {
            return _this.getEmacsCursorFor(cursors[0]).clearLocalKillRing();
          }
        };
      })(this)));
      this.disposable.add(this.editor.onDidDestroy((function(_this) {
        return function() {
          return _this.destroy();
        };
      })(this)));
    }

    EmacsEditor.prototype.destroy = function() {
      var cursor, i, len, ref1;
      ref1 = this.getEmacsCursors();
      for (i = 0, len = ref1.length; i < len; i++) {
        cursor = ref1[i];
        cursor.destroy();
      }
      return this.disposable.dispose();
    };

    EmacsEditor.prototype.getEmacsCursorFor = function(cursor) {
      return EmacsCursor["for"](this, cursor);
    };

    EmacsEditor.prototype.getEmacsCursors = function() {
      var c, i, len, ref1, results;
      ref1 = this.editor.getCursors();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        c = ref1[i];
        results.push(this.getEmacsCursorFor(c));
      }
      return results;
    };

    EmacsEditor.prototype.moveEmacsCursors = function(callback) {
      return this.editor.moveCursors((function(_this) {
        return function(cursor) {
          if (cursor.destroyed === true) {
            return;
          }
          return callback(_this.getEmacsCursorFor(cursor), cursor);
        };
      })(this));
    };

    EmacsEditor.prototype.saveCursors = function() {
      return this.getEmacsCursors().map(function(emacsCursor) {
        return {
          head: emacsCursor.cursor.marker.getHeadBufferPosition(),
          tail: emacsCursor.cursor.marker.getTailBufferPosition() || emacsCursor.cursor.marker.getHeadBufferPosition(),
          markActive: emacsCursor.mark().isActive() || (emacsCursor.cursor.selection && !emacsCursor.cursor.selection.isEmpty())
        };
      });
    };

    EmacsEditor.prototype.restoreCursors = function(selections) {
      var cursors;
      cursors = this.editor.getCursors();
      return selections.forEach((function(_this) {
        return function(info, index) {
          var cursor, emacsCursor, point;
          point = info.markActive ? info.tail : info.head;
          if (index >= cursors.length) {
            cursor = _this.editor.addCursorAtBufferPosition(point);
          } else {
            cursor = cursors[index];
            cursor.setBufferPosition(point);
          }
          emacsCursor = _this.getEmacsCursorFor(cursor);
          if (info.markActive) {
            emacsCursor.mark().set().activate();
            return emacsCursor._goTo(info.head);
          }
        };
      })(this));
    };

    EmacsEditor.prototype.positionAfter = function(point) {
      var lineLength;
      lineLength = this.editor.lineTextForBufferRow(point.row).length;
      if (point.column === lineLength) {
        if (point.row === this.editor.getLastBufferRow()) {
          return null;
        } else {
          return new Point(point.row + 1, 0);
        }
      } else {
        return point.translate([0, 1]);
      }
    };

    EmacsEditor.prototype.positionBefore = function(point) {
      var column;
      if (point.column === 0) {
        if (point.row === 0) {
          return null;
        } else {
          column = this.editor.lineTextForBufferRow(point.row - 1).length;
          return new Point(point.row - 1, column);
        }
      } else {
        return point.translate([0, -1]);
      }
    };

    EmacsEditor.prototype.characterAfter = function(point) {
      var p;
      p = this.positionAfter(point);
      if (p) {
        return this.editor.getTextInBufferRange([point, p]);
      } else {
        return null;
      }
    };

    EmacsEditor.prototype.characterBefore = function(point) {
      var p;
      p = this.positionBefore(point);
      if (p) {
        return this.editor.getTextInBufferRange([p, point]);
      } else {
        return null;
      }
    };

    EmacsEditor.prototype.locateBackwardFrom = function(point, regExp) {
      var result;
      result = null;
      this.editor.backwardsScanInBufferRange(regExp, [Utils.BOB, point], function(hit) {
        return result = hit.range;
      });
      return result;
    };

    EmacsEditor.prototype.locateForwardFrom = function(point, regExp) {
      var eof, result;
      result = null;
      eof = this.editor.getEofBufferPosition();
      this.editor.scanInBufferRange(regExp, [point, eof], function(hit) {
        return result = hit.range;
      });
      return result;
    };


    /*
    Section: Navigation
     */

    EmacsEditor.prototype.backwardChar = function() {
      return this.editor.moveCursors(function(cursor) {
        return cursor.moveLeft();
      });
    };

    EmacsEditor.prototype.forwardChar = function() {
      return this.editor.moveCursors(function(cursor) {
        return cursor.moveRight();
      });
    };

    EmacsEditor.prototype.backwardWord = function() {
      return this.moveEmacsCursors(function(emacsCursor) {
        emacsCursor.skipNonWordCharactersBackward();
        return emacsCursor.skipWordCharactersBackward();
      });
    };

    EmacsEditor.prototype.forwardWord = function() {
      return this.moveEmacsCursors(function(emacsCursor) {
        emacsCursor.skipNonWordCharactersForward();
        return emacsCursor.skipWordCharactersForward();
      });
    };

    EmacsEditor.prototype.backwardSexp = function() {
      return this.moveEmacsCursors(function(emacsCursor) {
        return emacsCursor.skipSexpBackward();
      });
    };

    EmacsEditor.prototype.forwardSexp = function() {
      return this.moveEmacsCursors(function(emacsCursor) {
        return emacsCursor.skipSexpForward();
      });
    };

    EmacsEditor.prototype.backwardList = function() {
      return this.moveEmacsCursors(function(emacsCursor) {
        return emacsCursor.skipListBackward();
      });
    };

    EmacsEditor.prototype.forwardList = function() {
      return this.moveEmacsCursors(function(emacsCursor) {
        return emacsCursor.skipListForward();
      });
    };

    EmacsEditor.prototype.previousLine = function() {
      return this.editor.moveCursors(function(cursor) {
        return cursor.moveUp();
      });
    };

    EmacsEditor.prototype.nextLine = function() {
      return this.editor.moveCursors(function(cursor) {
        return cursor.moveDown();
      });
    };

    EmacsEditor.prototype.backwardParagraph = function() {
      return this.moveEmacsCursors(function(emacsCursor, cursor) {
        var position;
        position = cursor.getBufferPosition();
        if (position.row !== 0) {
          cursor.setBufferPosition([position.row - 1, 0]);
        }
        return emacsCursor.goToMatchStartBackward(/^\s*$/) || cursor.moveToTop();
      });
    };

    EmacsEditor.prototype.forwardParagraph = function() {
      var lastRow;
      lastRow = this.editor.getLastBufferRow();
      return this.moveEmacsCursors(function(emacsCursor, cursor) {
        var position;
        position = cursor.getBufferPosition();
        if (position.row !== lastRow) {
          cursor.setBufferPosition([position.row + 1, 0]);
        }
        return emacsCursor.goToMatchStartForward(/^\s*$/) || cursor.moveToBottom();
      });
    };

    EmacsEditor.prototype.backToIndentation = function() {
      return this.editor.moveCursors((function(_this) {
        return function(cursor) {
          var line, position, targetColumn;
          position = cursor.getBufferPosition();
          line = _this.editor.lineTextForBufferRow(position.row);
          targetColumn = line.search(/\S/);
          if (targetColumn === -1) {
            targetColumn = line.length;
          }
          if (position.column !== targetColumn) {
            return cursor.setBufferPosition([position.row, targetColumn]);
          }
        };
      })(this));
    };


    /*
    Section: Killing & Yanking
     */

    EmacsEditor.prototype.backwardKillWord = function() {
      var kills, method;
      this._pullFromClipboard();
      method = State.killing ? 'prepend' : 'push';
      kills = [];
      this.editor.transact((function(_this) {
        return function() {
          return _this.moveEmacsCursors(function(emacsCursor, cursor) {
            var kill;
            kill = emacsCursor.backwardKillWord(method);
            return kills.push(kill);
          });
        };
      })(this));
      this._updateGlobalKillRing(method, kills);
      return State.killed();
    };

    EmacsEditor.prototype.killWord = function() {
      var kills, method;
      this._pullFromClipboard();
      method = State.killing ? 'append' : 'push';
      kills = [];
      this.editor.transact((function(_this) {
        return function() {
          return _this.moveEmacsCursors(function(emacsCursor) {
            var kill;
            kill = emacsCursor.killWord(method);
            return kills.push(kill);
          });
        };
      })(this));
      this._updateGlobalKillRing(method, kills);
      return State.killed();
    };

    EmacsEditor.prototype.killLine = function() {
      var kills, method;
      this._pullFromClipboard();
      method = State.killing ? 'append' : 'push';
      kills = [];
      this.editor.transact((function(_this) {
        return function() {
          return _this.moveEmacsCursors(function(emacsCursor) {
            var kill;
            kill = emacsCursor.killLine(method);
            return kills.push(kill);
          });
        };
      })(this));
      this._updateGlobalKillRing(method, kills);
      return State.killed();
    };

    EmacsEditor.prototype.killRegion = function() {
      var kills, method;
      this._pullFromClipboard();
      method = State.killing ? 'append' : 'push';
      kills = [];
      this.editor.transact((function(_this) {
        return function() {
          return _this.moveEmacsCursors(function(emacsCursor) {
            var kill;
            kill = emacsCursor.killRegion(method);
            return kills.push(kill);
          });
        };
      })(this));
      this._updateGlobalKillRing(method, kills);
      return State.killed();
    };

    EmacsEditor.prototype.copyRegionAsKill = function() {
      var kills, method;
      this._pullFromClipboard();
      method = State.killing ? 'append' : 'push';
      kills = [];
      this.editor.transact((function(_this) {
        return function() {
          var emacsCursor, i, len, ref1, results, selection, text;
          ref1 = _this.editor.getSelections();
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            selection = ref1[i];
            emacsCursor = _this.getEmacsCursorFor(selection.cursor);
            text = selection.getText();
            emacsCursor.killRing()[method](text);
            emacsCursor.killRing().getCurrentEntry();
            emacsCursor.mark().deactivate();
            results.push(kills.push(text));
          }
          return results;
        };
      })(this));
      return this._updateGlobalKillRing(method, kills);
    };

    EmacsEditor.prototype.yank = function() {
      this._pullFromClipboard();
      this.editor.transact((function(_this) {
        return function() {
          var emacsCursor, i, len, ref1, results;
          ref1 = _this.getEmacsCursors();
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            emacsCursor = ref1[i];
            results.push(emacsCursor.yank());
          }
          return results;
        };
      })(this));
      return State.yanked();
    };

    EmacsEditor.prototype.yankPop = function() {
      if (!State.yanking) {
        return;
      }
      this._pullFromClipboard();
      this.editor.transact((function(_this) {
        return function() {
          var emacsCursor, i, len, ref1, results;
          ref1 = _this.getEmacsCursors();
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            emacsCursor = ref1[i];
            results.push(emacsCursor.rotateYank(-1));
          }
          return results;
        };
      })(this));
      return State.yanked();
    };

    EmacsEditor.prototype.yankShift = function() {
      if (!State.yanking) {
        return;
      }
      this._pullFromClipboard();
      this.editor.transact((function(_this) {
        return function() {
          var emacsCursor, i, len, ref1, results;
          ref1 = _this.getEmacsCursors();
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            emacsCursor = ref1[i];
            results.push(emacsCursor.rotateYank(1));
          }
          return results;
        };
      })(this));
      return State.yanked();
    };

    EmacsEditor.prototype._pushToClipboard = function() {
      if (atom.config.get("atomic-emacs.killToClipboard")) {
        return KillRing.pushToClipboard();
      }
    };

    EmacsEditor.prototype._pullFromClipboard = function() {
      var c, killRings;
      if (atom.config.get("atomic-emacs.yankFromClipboard")) {
        killRings = (function() {
          var i, len, ref1, results;
          ref1 = this.getEmacsCursors();
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            c = ref1[i];
            results.push(c.killRing());
          }
          return results;
        }).call(this);
        return KillRing.pullFromClipboard(killRings);
      }
    };

    EmacsEditor.prototype._updateGlobalKillRing = function(method, kills) {
      if (kills.length > 1) {
        if (method !== 'push') {
          method = 'replace';
        }
        KillRing.global[method](kills.join('\n') + '\n');
      }
      return this._pushToClipboard();
    };


    /*
    Section: Editing
     */

    EmacsEditor.prototype.deleteHorizontalSpace = function() {
      return this.editor.transact((function(_this) {
        return function() {
          return _this.moveEmacsCursors(function(emacsCursor) {
            var range;
            range = emacsCursor.horizontalSpaceRange();
            return _this.editor.setTextInBufferRange(range, '');
          });
        };
      })(this));
    };

    EmacsEditor.prototype.deleteIndentation = function() {
      if (!this.editor) {
        return;
      }
      return this.editor.transact((function(_this) {
        return function() {
          _this.editor.moveUp();
          return _this.editor.joinLines();
        };
      })(this));
    };

    EmacsEditor.prototype.openLine = function() {
      return this.editor.transact((function(_this) {
        return function() {
          var emacsCursor, i, len, ref1, results;
          ref1 = _this.getEmacsCursors();
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            emacsCursor = ref1[i];
            results.push(emacsCursor.insertAfter("\n"));
          }
          return results;
        };
      })(this));
    };

    EmacsEditor.prototype.justOneSpace = function() {
      return this.editor.transact((function(_this) {
        return function() {
          var emacsCursor, i, len, range, ref1, results;
          ref1 = _this.getEmacsCursors();
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            emacsCursor = ref1[i];
            range = emacsCursor.horizontalSpaceRange();
            results.push(_this.editor.setTextInBufferRange(range, ' '));
          }
          return results;
        };
      })(this));
    };

    EmacsEditor.prototype.deleteBlankLines = function() {
      return this.editor.transact((function(_this) {
        return function() {
          var emacsCursor, i, len, ref1, results;
          ref1 = _this.getEmacsCursors();
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            emacsCursor = ref1[i];
            results.push(emacsCursor.deleteBlankLines());
          }
          return results;
        };
      })(this));
    };

    EmacsEditor.prototype.transposeChars = function() {
      return this.editor.transact((function(_this) {
        return function() {
          return _this.moveEmacsCursors(function(emacsCursor) {
            return emacsCursor.transposeChars();
          });
        };
      })(this));
    };

    EmacsEditor.prototype.transposeWords = function() {
      return this.editor.transact((function(_this) {
        return function() {
          return _this.moveEmacsCursors(function(emacsCursor) {
            return emacsCursor.transposeWords();
          });
        };
      })(this));
    };

    EmacsEditor.prototype.transposeLines = function() {
      return this.editor.transact((function(_this) {
        return function() {
          return _this.moveEmacsCursors(function(emacsCursor) {
            return emacsCursor.transposeLines();
          });
        };
      })(this));
    };

    EmacsEditor.prototype.transposeSexps = function() {
      return this.editor.transact((function(_this) {
        return function() {
          return _this.moveEmacsCursors(function(emacsCursor) {
            return emacsCursor.transposeSexps();
          });
        };
      })(this));
    };

    downcase = function(s) {
      return s.toLowerCase();
    };

    upcase = function(s) {
      return s.toUpperCase();
    };

    capitalize = function(s) {
      return s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase();
    };

    EmacsEditor.prototype.downcaseWordOrRegion = function() {
      return this._transformWordOrRegion(downcase);
    };

    EmacsEditor.prototype.upcaseWordOrRegion = function() {
      return this._transformWordOrRegion(upcase);
    };

    EmacsEditor.prototype.capitalizeWordOrRegion = function() {
      return this._transformWordOrRegion(capitalize, {
        wordAtATime: true
      });
    };

    EmacsEditor.prototype._transformWordOrRegion = function(transformWord, arg) {
      var wordAtATime;
      wordAtATime = (arg != null ? arg : {}).wordAtATime;
      return this.editor.transact((function(_this) {
        return function() {
          var cursor, i, len, ref1;
          if (_this.editor.getSelections().filter(function(s) {
            return !s.isEmpty();
          }).length > 0) {
            return _this.editor.mutateSelectedText(function(selection) {
              var range;
              range = selection.getBufferRange();
              if (wordAtATime) {
                return _this.editor.scanInBufferRange(/\w+/g, range, function(hit) {
                  return hit.replace(transformWord(hit.matchText));
                });
              } else {
                return _this.editor.setTextInBufferRange(range, transformWord(selection.getText()));
              }
            });
          } else {
            ref1 = _this.editor.getCursors();
            for (i = 0, len = ref1.length; i < len; i++) {
              cursor = ref1[i];
              cursor.emitter.__track = true;
            }
            return _this.moveEmacsCursors(function(emacsCursor) {
              return emacsCursor.transformWord(transformWord);
            });
          }
        };
      })(this));
    };

    EmacsEditor.prototype.dabbrevExpand = function() {
      if (this.completers != null) {
        this.completers.forEach(function(completer) {
          return completer.next();
        });
      } else {
        this.editor.transact((function(_this) {
          return function() {
            _this.completers = [];
            return _this.moveEmacsCursors(function(emacsCursor) {
              var completer;
              completer = new Completer(_this, emacsCursor);
              return _this.completers.push(completer);
            });
          };
        })(this));
      }
      return State.dabbrevState = {
        emacsEditor: this
      };
    };

    EmacsEditor.prototype.dabbrevPrevious = function() {
      if (this.completers != null) {
        return this.completers.forEach(function(completer) {
          return completer.previous();
        });
      }
    };

    EmacsEditor.prototype.dabbrevDone = function() {
      var ref1;
      if ((ref1 = this.completers) != null) {
        ref1.forEach(function(completer) {
          return completer.destroy();
        });
      }
      return this.completers = null;
    };


    /*
    Section: Marking & Selecting
     */

    EmacsEditor.prototype.setMark = function() {
      var emacsCursor, i, len, ref1, results;
      ref1 = this.getEmacsCursors();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        emacsCursor = ref1[i];
        results.push(emacsCursor.mark().set().activate());
      }
      return results;
    };

    EmacsEditor.prototype.markSexp = function() {
      return this.moveEmacsCursors(function(emacsCursor) {
        return emacsCursor.markSexp();
      });
    };

    EmacsEditor.prototype.markWholeBuffer = function() {
      var c, emacsCursor, first, i, len, ref1, rest;
      ref1 = this.editor.getCursors(), first = ref1[0], rest = 2 <= ref1.length ? slice.call(ref1, 1) : [];
      for (i = 0, len = rest.length; i < len; i++) {
        c = rest[i];
        c.destroy();
      }
      emacsCursor = this.getEmacsCursorFor(first);
      first.moveToBottom();
      emacsCursor.mark().set().activate();
      return first.moveToTop();
    };

    EmacsEditor.prototype.exchangePointAndMark = function() {
      return this.moveEmacsCursors(function(emacsCursor) {
        return emacsCursor.mark().exchange();
      });
    };


    /*
    Section: UI
     */

    EmacsEditor.prototype.recenterTopBottom = function() {
      var c, maxOffset, maxRow, minOffset, minRow, view;
      if (!this.editor) {
        return;
      }
      view = atom.views.getView(this.editor);
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
      minOffset = view.pixelPositionForBufferPosition([minRow, 0]);
      maxOffset = view.pixelPositionForBufferPosition([maxRow, 0]);
      switch (State.recenters) {
        case 0:
          view.setScrollTop((minOffset.top + maxOffset.top - view.getHeight()) / 2);
          break;
        case 1:
          view.setScrollTop(minOffset.top - 2 * this.editor.getLineHeightInPixels());
          break;
        case 2:
          view.setScrollTop(maxOffset.top + 3 * this.editor.getLineHeightInPixels() - view.getHeight());
      }
      return State.recentered();
    };

    EmacsEditor.prototype.scrollUp = function() {
      var currentRow, firstRow, lastRow, rowCount, visibleRowRange;
      if ((visibleRowRange = this.editor.getVisibleRowRange())) {
        if (!visibleRowRange.every((function(_this) {
          return function(e) {
            return !Number.isNaN(e);
          };
        })(this))) {
          return;
        }
        firstRow = visibleRowRange[0], lastRow = visibleRowRange[1];
        currentRow = this.editor.cursors[0].getBufferRow();
        rowCount = (lastRow - firstRow) - 2;
        return this.editor.moveDown(rowCount);
      }
    };

    EmacsEditor.prototype.scrollDown = function() {
      var currentRow, firstRow, lastRow, rowCount, visibleRowRange;
      if ((visibleRowRange = this.editor.getVisibleRowRange())) {
        if (!visibleRowRange.every((function(_this) {
          return function(e) {
            return !Number.isNaN(e);
          };
        })(this))) {
          return;
        }
        firstRow = visibleRowRange[0], lastRow = visibleRowRange[1];
        currentRow = this.editor.cursors[0].getBufferRow();
        rowCount = (lastRow - firstRow) - 2;
        return this.editor.moveUp(rowCount);
      }
    };


    /*
    Section: Other
     */

    EmacsEditor.prototype.keyboardQuit = function() {
      var emacsCursor, i, len, ref1, results;
      ref1 = this.getEmacsCursors();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        emacsCursor = ref1[i];
        results.push(emacsCursor.mark().deactivate());
      }
      return results;
    };

    return EmacsEditor;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2F0b21pYy1lbWFjcy9saWIvZW1hY3MtZWRpdG9yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsa0dBQUE7SUFBQTs7RUFBQSxNQUErQixPQUFBLENBQVEsTUFBUixDQUEvQixFQUFDLDZDQUFELEVBQXNCOztFQUN0QixTQUFBLEdBQVksT0FBQSxDQUFRLGFBQVI7O0VBQ1osV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDZCxRQUFBLEdBQVcsT0FBQSxDQUFRLGFBQVI7O0VBQ1gsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNQLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7RUFDUixLQUFBLEdBQVEsT0FBQSxDQUFRLFNBQVI7O0VBRVIsTUFBTSxDQUFDLE9BQVAsR0FDTTtBQUNKLFFBQUE7O0lBQUEsV0FBQyxFQUFBLEdBQUEsRUFBRCxHQUFNLFNBQUMsTUFBRDsyQ0FDSixNQUFNLENBQUMsZUFBUCxNQUFNLENBQUMsZUFBZ0IsSUFBSSxXQUFKLENBQWdCLE1BQWhCO0lBRG5COztJQUdPLHFCQUFDLE9BQUQ7TUFBQyxJQUFDLENBQUEsU0FBRDtNQUNaLElBQUMsQ0FBQSxVQUFELEdBQWMsSUFBSTtNQUNsQixJQUFDLENBQUEsVUFBVSxDQUFDLEdBQVosQ0FBZ0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxpQkFBUixDQUEwQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFDeEMsY0FBQTtVQUFBLE9BQUEsR0FBVSxLQUFDLENBQUEsTUFBTSxDQUFDLFVBQVIsQ0FBQTtVQUNWLElBQUcsT0FBTyxDQUFDLE1BQVIsS0FBa0IsQ0FBckI7bUJBQ0UsS0FBQyxDQUFBLGlCQUFELENBQW1CLE9BQVEsQ0FBQSxDQUFBLENBQTNCLENBQThCLENBQUMsa0JBQS9CLENBQUEsRUFERjs7UUFGd0M7TUFBQSxDQUFBLENBQUEs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Q0FBQSxDQUFBLENBQUEsSUFBQSxDQUF0QixDQUFkO0FBQUEsaUJBQUE7O1FBRUMsNkJBQUQsRUFBVztRQUNYLFVBQUEsR0FBYSxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQVEsQ0FBQSxDQUFBLENBQUUsQ0FBQyxZQUFuQixDQUFBO1FBQ2IsUUFBQSxHQUFXLENBQUMsT0FBQSxHQUFVLFFBQVgsQ0FBQSxHQUF1QjtlQUNsQyxJQUFDLENBQUEsTUFBTSxDQUFDLFFBQVIsQ0FBaUIsUUFBakIsRUFQRjs7SUFEUTs7MEJBVVYsVUFBQSxHQUFZLFNBQUE7QUFDVixVQUFBO01BQUEsSUFBRyxDQUFDLGVBQUEsR0FBa0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxrQkFBUixDQUFBLENBQW5CLENBQUg7UUFFRSxJQUFBLENBQWMsZUFBZSxDQUFDLEtBQWhCLENBQXNCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsQ0FBRDttQkFBTyxDQUFDLE1BQU0sQ0FBQyxLQUFQLENBQWEsQ0FBYjtVQUFSO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF0QixDQUFkO0FBQUEsaUJBQUE7O1FBRUMsNkJBQUQsRUFBVTtRQUNWLFVBQUEsR0FBYSxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQVEsQ0FBQSxDQUFBLENBQUUsQ0FBQyxZQUFuQixDQUFBO1FBQ2IsUUFBQSxHQUFXLENBQUMsT0FBQSxHQUFVLFFBQVgsQ0FBQSxHQUF1QjtlQUNsQyxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQVIsQ0FBZSxRQUFmLEVBUEY7O0lBRFU7OztBQVVaOzs7OzBCQUlBLFlBQUEsR0FBYyxTQUFBO0FBQ1osVUFBQTtBQUFBO0FBQUE7V0FBQSxzQ0FBQTs7cUJBQ0UsV0FBVyxDQUFDLElBQVosQ0FBQSxDQUFrQixDQUFDLFVBQW5CLENBQUE7QUFERjs7SUFEWTs7Ozs7QUE1Y2hCIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGUsIFBvaW50fSA9IHJlcXVpcmUgJ2F0b20nXG5Db21wbGV0ZXIgPSByZXF1aXJlICcuL2NvbXBsZXRlcidcbkVtYWNzQ3Vyc29yID0gcmVxdWlyZSAnLi9lbWFjcy1jdXJzb3InXG5LaWxsUmluZyA9IHJlcXVpcmUgJy4va2lsbC1yaW5nJ1xuTWFyayA9IHJlcXVpcmUgJy4vbWFyaydcblN0YXRlID0gcmVxdWlyZSAnLi9zdGF0ZSdcblV0aWxzID0gcmVxdWlyZSAnLi91dGlscydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgRW1hY3NFZGl0b3JcbiAgQGZvcjogKGVkaXRvcikgLT5cbiAgICBlZGl0b3IuX2F0b21pY0VtYWNzID89IG5ldyBFbWFjc0VkaXRvcihlZGl0b3IpXG5cbiAgY29uc3RydWN0b3I6IChAZWRpdG9yKSAtPlxuICAgIEBkaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAZGlzcG9zYWJsZS5hZGQgQGVkaXRvci5vbkRpZFJlbW92ZUN1cnNvciA9PlxuICAgICAgY3Vyc29ycyA9IEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgICBpZiBjdXJzb3JzLmxlbmd0aCA9PSAxXG4gICAgICAgIEBnZXRFbWFjc0N1cnNvckZvcihjdXJzb3JzWzBdKS5jbGVhckxvY2FsS2lsbFJpbmcoKVxuICAgIEBkaXNwb3NhYmxlLmFkZCBAZWRpdG9yLm9uRGlkRGVzdHJveSA9PlxuICAgICAgQGRlc3Ryb3koKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgIyBOZWl0aGVyIGN1cnNvci5kaWQtZGVzdHJveSBub3IgVGV4dEVkaXRvci5kaWQtcmVtb3ZlLWN1cnNvciBzZWVtcyB0byBmaXJlXG4gICAgIyB3aGVuIHRoZSBlZGl0b3IgaXMgZGVzdHJveWVkLiAoQXRvbSBidWc/KSBTbyB3ZSBkZXN0cm95IEVtYWNzQ3Vyc29ycyBoZXJlLlxuICAgIGZvciBjdXJzb3IgaW4gQGdldEVtYWNzQ3Vyc29ycygpXG4gICAgICBjdXJzb3IuZGVzdHJveSgpXG4gICAgQGRpc3Bvc2FibGUuZGlzcG9zZSgpXG5cbiAgZ2V0RW1hY3NDdXJzb3JGb3I6IChjdXJzb3IpIC0+XG4gICAgRW1hY3NDdXJzb3IuZm9yKHRoaXMsIGN1cnNvcilcblxuICBnZXRFbWFjc0N1cnNvcnM6ICgpIC0+XG4gICAgQGdldEVtYWNzQ3Vyc29yRm9yKGMpIGZvciBjIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG5cbiAgbW92ZUVtYWNzQ3Vyc29yczogKGNhbGxiYWNrKSAtPlxuICAgIEBlZGl0b3IubW92ZUN1cnNvcnMgKGN1cnNvcikgPT5cbiAgICAgICMgQXRvbSBidWc6IGlmIG1vdmluZyBvbmUgY3Vyc29yIGRlc3Ryb3lzIGFub3RoZXIsIHRoZSBkZXN0cm95ZWQgb25lJ3NcbiAgICAgICMgZW1pdHRlciBpcyBkaXNwb3NlZCwgYnV0IGN1cnNvci5pc0Rlc3Ryb3llZCgpIGlzIHN0aWxsIGZhbHNlLiBIb3dldmVyXG4gICAgICAjIGN1cnNvci5kZXN0cm95ZWQgPT0gdHJ1ZS4gVGV4dEVkaXRvci5tb3ZlQ3Vyc29ycyBwcm9iYWJseSBzaG91bGRuJ3QgZXZlblxuICAgICAgIyB5aWVsZCBpdCBpbiB0aGlzIGNhc2UuXG4gICAgICByZXR1cm4gaWYgY3Vyc29yLmRlc3Ryb3llZCA9PSB0cnVlXG4gICAgICBjYWxsYmFjayhAZ2V0RW1hY3NDdXJzb3JGb3IoY3Vyc29yKSwgY3Vyc29yKVxuXG4gIHNhdmVDdXJzb3JzOiAtPlxuICAgIEBnZXRFbWFjc0N1cnNvcnMoKS5tYXAgKGVtYWNzQ3Vyc29yKSAtPlxuICAgICAgaGVhZDogZW1hY3NDdXJzb3IuY3Vyc29yLm1hcmtlci5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuICAgICAgdGFpbDogZW1hY3NDdXJzb3IuY3Vyc29yLm1hcmtlci5nZXRUYWlsQnVmZmVyUG9zaXRpb24oKSBvclxuICAgICAgICBlbWFjc0N1cnNvci5jdXJzb3IubWFya2VyLmdldEhlYWRCdWZmZXJQb3NpdGlvbigpXG4gICAgICAjIEF0b20gZG9lc24ndCBoYXZlIGEgcHVibGljIEFQSSB0byBhZGQgYSBzZWxlY3Rpb24gdG8gYSBjdXJzb3IsIHNvIGFzc3VtZVxuICAgICAgIyB0aGF0IGFuIGFjdGl2ZSBzZWxlY3Rpb24gbWVhbnMgYW4gYWN0aXZlIG1hcmsuXG4gICAgICBtYXJrQWN0aXZlOiBlbWFjc0N1cnNvci5tYXJrKCkuaXNBY3RpdmUoKSBvclxuICAgICAgICAoZW1hY3NDdXJzb3IuY3Vyc29yLnNlbGVjdGlvbiBhbmQgbm90IGVtYWNzQ3Vyc29yLmN1cnNvci5zZWxlY3Rpb24uaXNFbXB0eSgpKVxuXG4gIHJlc3RvcmVDdXJzb3JzOiAoc2VsZWN0aW9ucykgLT5cbiAgICBjdXJzb3JzID0gQGVkaXRvci5nZXRDdXJzb3JzKClcbiAgICBzZWxlY3Rpb25zLmZvckVhY2ggKGluZm8sIGluZGV4KSA9PlxuICAgICAgcG9pbnQgPSBpZiBpbmZvLm1hcmtBY3RpdmUgdGhlbiBpbmZvLnRhaWwgZWxzZSBpbmZvLmhlYWRcbiAgICAgIGlmIGluZGV4ID49IGN1cnNvcnMubGVuZ3RoXG4gICAgICAgIGN1cnNvciA9IEBlZGl0b3IuYWRkQ3Vyc29yQXRCdWZmZXJQb3NpdGlvbihwb2ludClcbiAgICAgIGVsc2VcbiAgICAgICAgY3Vyc29yID0gY3Vyc29yc1tpbmRleF1cbiAgICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuXG4gICAgICBlbWFjc0N1cnNvciA9IEBnZXRFbWFjc0N1cnNvckZvcihjdXJzb3IpXG4gICAgICBpZiBpbmZvLm1hcmtBY3RpdmVcbiAgICAgICAgZW1hY3NDdXJzb3IubWFyaygpLnNldCgpLmFjdGl2YXRlKClcbiAgICAgICAgZW1hY3NDdXJzb3IuX2dvVG8oaW5mby5oZWFkKVxuXG4gIHBvc2l0aW9uQWZ0ZXI6IChwb2ludCkgLT5cbiAgICBsaW5lTGVuZ3RoID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhwb2ludC5yb3cpLmxlbmd0aFxuICAgIGlmIHBvaW50LmNvbHVtbiA9PSBsaW5lTGVuZ3RoXG4gICAgICBpZiBwb2ludC5yb3cgPT0gQGVkaXRvci5nZXRMYXN0QnVmZmVyUm93KClcbiAgICAgICAgbnVsbFxuICAgICAgZWxzZVxuICAgICAgICBuZXcgUG9pbnQocG9pbnQucm93ICsgMSwgMClcbiAgICBlbHNlXG4gICAgICBwb2ludC50cmFuc2xhdGUoWzAsIDFdKVxuXG4gIHBvc2l0aW9uQmVmb3JlOiAocG9pbnQpIC0+XG4gICAgaWYgcG9pbnQuY29sdW1uID09IDBcbiAgICAgIGlmIHBvaW50LnJvdyA9PSAwXG4gICAgICAgIG51bGxcbiAgICAgIGVsc2VcbiAgICAgICAgY29sdW1uID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhwb2ludC5yb3cgLSAxKS5sZW5ndGhcbiAgICAgICAgbmV3IFBvaW50KHBvaW50LnJvdyAtIDEsIGNvbHVtbilcbiAgICBlbHNlXG4gICAgICBwb2ludC50cmFuc2xhdGUoWzAsIC0xXSlcblxuICBjaGFyYWN0ZXJBZnRlcjogKHBvaW50KSAtPlxuICAgIHAgPSBAcG9zaXRpb25BZnRlcihwb2ludClcbiAgICBpZiBwIHRoZW4gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbcG9pbnQsIHBdKSBlbHNlIG51bGxcblxuICBjaGFyYWN0ZXJCZWZvcmU6IChwb2ludCkgLT5cbiAgICBwID0gQHBvc2l0aW9uQmVmb3JlKHBvaW50KVxuICAgIGlmIHAgdGhlbiBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtwLCBwb2ludF0pIGVsc2UgbnVsbFxuXG4gIGxvY2F0ZUJhY2t3YXJkRnJvbTogKHBvaW50LCByZWdFeHApIC0+XG4gICAgcmVzdWx0ID0gbnVsbFxuICAgIEBlZGl0b3IuYmFja3dhcmRzU2NhbkluQnVmZmVyUmFuZ2UgcmVnRXhwLCBbVXRpbHMuQk9CLCBwb2ludF0sIChoaXQpIC0+XG4gICAgICByZXN1bHQgPSBoaXQucmFuZ2VcbiAgICByZXN1bHRcblxuICBsb2NhdGVGb3J3YXJkRnJvbTogKHBvaW50LCByZWdFeHApIC0+XG4gICAgcmVzdWx0ID0gbnVsbFxuICAgIGVvZiA9IEBlZGl0b3IuZ2V0RW9mQnVmZmVyUG9zaXRpb24oKVxuICAgIEBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UgcmVnRXhwLCBbcG9pbnQsIGVvZl0sIChoaXQpIC0+XG4gICAgICByZXN1bHQgPSBoaXQucmFuZ2VcbiAgICByZXN1bHRcblxuICAjIyNcbiAgU2VjdGlvbjogTmF2aWdhdGlvblxuICAjIyNcblxuICBiYWNrd2FyZENoYXI6IC0+XG4gICAgQGVkaXRvci5tb3ZlQ3Vyc29ycyAoY3Vyc29yKSAtPlxuICAgICAgY3Vyc29yLm1vdmVMZWZ0KClcblxuICBmb3J3YXJkQ2hhcjogLT5cbiAgICBAZWRpdG9yLm1vdmVDdXJzb3JzIChjdXJzb3IpIC0+XG4gICAgICBjdXJzb3IubW92ZVJpZ2h0KClcblxuICBiYWNrd2FyZFdvcmQ6IC0+XG4gICAgQG1vdmVFbWFjc0N1cnNvcnMgKGVtYWNzQ3Vyc29yKSAtPlxuICAgICAgZW1hY3NDdXJzb3Iuc2tpcE5vbldvcmRDaGFyYWN0ZXJzQmFja3dhcmQoKVxuICAgICAgZW1hY3NDdXJzb3Iuc2tpcFdvcmRDaGFyYWN0ZXJzQmFja3dhcmQoKVxuXG4gIGZvcndhcmRXb3JkOiAtPlxuICAgIEBtb3ZlRW1hY3NDdXJzb3JzIChlbWFjc0N1cnNvcikgLT5cbiAgICAgIGVtYWNzQ3Vyc29yLnNraXBOb25Xb3JkQ2hhcmFjdGVyc0ZvcndhcmQoKVxuICAgICAgZW1hY3NDdXJzb3Iuc2tpcFdvcmRDaGFyYWN0ZXJzRm9yd2FyZCgpXG5cbiAgYmFja3dhcmRTZXhwOiAtPlxuICAgIEBtb3ZlRW1hY3NDdXJzb3JzIChlbWFjc0N1cnNvcikgLT5cbiAgICAgIGVtYWNzQ3Vyc29yLnNraXBTZXhwQmFja3dhcmQoKVxuXG4gIGZvcndhcmRTZXhwOiAtPlxuICAgIEBtb3ZlRW1hY3NDdXJzb3JzIChlbWFjc0N1cnNvcikgLT5cbiAgICAgIGVtYWNzQ3Vyc29yLnNraXBTZXhwRm9yd2FyZCgpXG5cbiAgYmFja3dhcmRMaXN0OiAtPlxuICAgIEBtb3ZlRW1hY3NDdXJzb3JzIChlbWFjc0N1cnNvcikgLT5cbiAgICAgIGVtYWNzQ3Vyc29yLnNraXBMaXN0QmFja3dhcmQoKVxuXG4gIGZvcndhcmRMaXN0OiAtPlxuICAgIEBtb3ZlRW1hY3NDdXJzb3JzIChlbWFjc0N1cnNvcikgLT5cbiAgICAgIGVtYWNzQ3Vyc29yLnNraXBMaXN0Rm9yd2FyZCgpXG5cbiAgcHJldmlvdXNMaW5lOiAtPlxuICAgIEBlZGl0b3IubW92ZUN1cnNvcnMgKGN1cnNvcikgLT5cbiAgICAgIGN1cnNvci5tb3ZlVXAoKVxuXG4gIG5leHRMaW5lOiAtPlxuICAgIEBlZGl0b3IubW92ZUN1cnNvcnMgKGN1cnNvcikgLT5cbiAgICAgIGN1cnNvci5tb3ZlRG93bigpXG5cbiAgYmFja3dhcmRQYXJhZ3JhcGg6IC0+XG4gICAgQG1vdmVFbWFjc0N1cnNvcnMgKGVtYWNzQ3Vyc29yLCBjdXJzb3IpIC0+XG4gICAgICBwb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICB1bmxlc3MgcG9zaXRpb24ucm93ID09IDBcbiAgICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKFtwb3NpdGlvbi5yb3cgLSAxLCAwXSlcblxuICAgICAgZW1hY3NDdXJzb3IuZ29Ub01hdGNoU3RhcnRCYWNrd2FyZCgvXlxccyokLykgb3JcbiAgICAgICAgY3Vyc29yLm1vdmVUb1RvcCgpXG5cbiAgZm9yd2FyZFBhcmFncmFwaDogLT5cbiAgICBsYXN0Um93ID0gQGVkaXRvci5nZXRMYXN0QnVmZmVyUm93KClcbiAgICBAbW92ZUVtYWNzQ3Vyc29ycyAoZW1hY3NDdXJzb3IsIGN1cnNvcikgLT5cbiAgICAgIHBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIHVubGVzcyBwb3NpdGlvbi5yb3cgPT0gbGFzdFJvd1xuICAgICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oW3Bvc2l0aW9uLnJvdyArIDEsIDBdKVxuXG4gICAgICBlbWFjc0N1cnNvci5nb1RvTWF0Y2hTdGFydEZvcndhcmQoL15cXHMqJC8pIG9yXG4gICAgICAgIGN1cnNvci5tb3ZlVG9Cb3R0b20oKVxuXG4gIGJhY2tUb0luZGVudGF0aW9uOiAtPlxuICAgIEBlZGl0b3IubW92ZUN1cnNvcnMgKGN1cnNvcikgPT5cbiAgICAgIHBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIGxpbmUgPSBAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KHBvc2l0aW9uLnJvdylcbiAgICAgIHRhcmdldENvbHVtbiA9IGxpbmUuc2VhcmNoKC9cXFMvKVxuICAgICAgdGFyZ2V0Q29sdW1uID0gbGluZS5sZW5ndGggaWYgdGFyZ2V0Q29sdW1uID09IC0xXG5cbiAgICAgIGlmIHBvc2l0aW9uLmNvbHVtbiAhPSB0YXJnZXRDb2x1bW5cbiAgICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKFtwb3NpdGlvbi5yb3csIHRhcmdldENvbHVtbl0pXG5cbiAgIyMjXG4gIFNlY3Rpb246IEtpbGxpbmcgJiBZYW5raW5nXG4gICMjI1xuXG4gIGJhY2t3YXJkS2lsbFdvcmQ6IC0+XG4gICAgQF9wdWxsRnJvbUNsaXBib2FyZCgpXG4gICAgbWV0aG9kID0gaWYgU3RhdGUua2lsbGluZyB0aGVuICdwcmVwZW5kJyBlbHNlICdwdXNoJ1xuICAgIGtpbGxzID0gW11cbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBAbW92ZUVtYWNzQ3Vyc29ycyAoZW1hY3NDdXJzb3IsIGN1cnNvcikgPT5cbiAgICAgICAga2lsbCA9IGVtYWNzQ3Vyc29yLmJhY2t3YXJkS2lsbFdvcmQobWV0aG9kKVxuICAgICAgICBraWxscy5wdXNoKGtpbGwpXG4gICAgQF91cGRhdGVHbG9iYWxLaWxsUmluZyhtZXRob2QsIGtpbGxzKVxuICAgIFN0YXRlLmtpbGxlZCgpXG5cbiAga2lsbFdvcmQ6IC0+XG4gICAgQF9wdWxsRnJvbUNsaXBib2FyZCgpXG4gICAgbWV0aG9kID0gaWYgU3RhdGUua2lsbGluZyB0aGVuICdhcHBlbmQnIGVsc2UgJ3B1c2gnXG4gICAga2lsbHMgPSBbXVxuICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIEBtb3ZlRW1hY3NDdXJzb3JzIChlbWFjc0N1cnNvcikgPT5cbiAgICAgICAga2lsbCA9IGVtYWNzQ3Vyc29yLmtpbGxXb3JkKG1ldGhvZClcbiAgICAgICAga2lsbHMucHVzaChraWxsKVxuICAgIEBfdXBkYXRlR2xvYmFsS2lsbFJpbmcobWV0aG9kLCBraWxscylcbiAgICBTdGF0ZS5raWxsZWQoKVxuXG4gIGtpbGxMaW5lOiAtPlxuICAgIEBfcHVsbEZyb21DbGlwYm9hcmQoKVxuICAgIG1ldGhvZCA9IGlmIFN0YXRlLmtpbGxpbmcgdGhlbiAnYXBwZW5kJyBlbHNlICdwdXNoJ1xuICAgIGtpbGxzID0gW11cbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBAbW92ZUVtYWNzQ3Vyc29ycyAoZW1hY3NDdXJzb3IpID0+XG4gICAgICAgIGtpbGwgPSBlbWFjc0N1cnNvci5raWxsTGluZShtZXRob2QpXG4gICAgICAgIGtpbGxzLnB1c2goa2lsbClcbiAgICBAX3VwZGF0ZUdsb2JhbEtpbGxSaW5nKG1ldGhvZCwga2lsbHMpXG4gICAgU3RhdGUua2lsbGVkKClcblxuICBraWxsUmVnaW9uOiAtPlxuICAgIEBfcHVsbEZyb21DbGlwYm9hcmQoKVxuICAgIG1ldGhvZCA9IGlmIFN0YXRlLmtpbGxpbmcgdGhlbiAnYXBwZW5kJyBlbHNlICdwdXNoJ1xuICAgIGtpbGxzID0gW11cbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBAbW92ZUVtYWNzQ3Vyc29ycyAoZW1hY3NDdXJzb3IpID0+XG4gICAgICAgIGtpbGwgPSBlbWFjc0N1cnNvci5raWxsUmVnaW9uKG1ldGhvZClcbiAgICAgICAga2lsbHMucHVzaChraWxsKVxuICAgIEBfdXBkYXRlR2xvYmFsS2lsbFJpbmcobWV0aG9kLCBraWxscylcbiAgICBTdGF0ZS5raWxsZWQoKVxuXG4gIGNvcHlSZWdpb25Bc0tpbGw6IC0+XG4gICAgQF9wdWxsRnJvbUNsaXBib2FyZCgpXG4gICAgbWV0aG9kID0gaWYgU3RhdGUua2lsbGluZyB0aGVuICdhcHBlbmQnIGVsc2UgJ3B1c2gnXG4gICAga2lsbHMgPSBbXVxuICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgICAgZW1hY3NDdXJzb3IgPSBAZ2V0RW1hY3NDdXJzb3JGb3Ioc2VsZWN0aW9uLmN1cnNvcilcbiAgICAgICAgdGV4dCA9IHNlbGVjdGlvbi5nZXRUZXh0KClcbiAgICAgICAgZW1hY3NDdXJzb3Iua2lsbFJpbmcoKVttZXRob2RdKHRleHQpXG4gICAgICAgIGVtYWNzQ3Vyc29yLmtpbGxSaW5nKCkuZ2V0Q3VycmVudEVudHJ5KClcbiAgICAgICAgZW1hY3NDdXJzb3IubWFyaygpLmRlYWN0aXZhdGUoKVxuICAgICAgICBraWxscy5wdXNoKHRleHQpXG4gICAgQF91cGRhdGVHbG9iYWxLaWxsUmluZyhtZXRob2QsIGtpbGxzKVxuXG4gIHlhbms6IC0+XG4gICAgQF9wdWxsRnJvbUNsaXBib2FyZCgpXG4gICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgZm9yIGVtYWNzQ3Vyc29yIGluIEBnZXRFbWFjc0N1cnNvcnMoKVxuICAgICAgICBlbWFjc0N1cnNvci55YW5rKClcbiAgICBTdGF0ZS55YW5rZWQoKVxuXG4gIHlhbmtQb3A6IC0+XG4gICAgcmV0dXJuIGlmIG5vdCBTdGF0ZS55YW5raW5nXG4gICAgQF9wdWxsRnJvbUNsaXBib2FyZCgpXG4gICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgZm9yIGVtYWNzQ3Vyc29yIGluIEBnZXRFbWFjc0N1cnNvcnMoKVxuICAgICAgICBlbWFjc0N1cnNvci5yb3RhdGVZYW5rKC0xKVxuICAgIFN0YXRlLnlhbmtlZCgpXG5cbiAgeWFua1NoaWZ0OiAtPlxuICAgIHJldHVybiBpZiBub3QgU3RhdGUueWFua2luZ1xuICAgIEBfcHVsbEZyb21DbGlwYm9hcmQoKVxuICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIGZvciBlbWFjc0N1cnNvciBpbiBAZ2V0RW1hY3NDdXJzb3JzKClcbiAgICAgICAgZW1hY3NDdXJzb3Iucm90YXRlWWFuaygxKVxuICAgIFN0YXRlLnlhbmtlZCgpXG5cbiAgX3B1c2hUb0NsaXBib2FyZDogLT5cbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoXCJhdG9taWMtZW1hY3Mua2lsbFRvQ2xpcGJvYXJkXCIpXG4gICAgICBLaWxsUmluZy5wdXNoVG9DbGlwYm9hcmQoKVxuXG4gIF9wdWxsRnJvbUNsaXBib2FyZDogLT5cbiAgICBpZiBhdG9tLmNvbmZpZy5nZXQoXCJhdG9taWMtZW1hY3MueWFua0Zyb21DbGlwYm9hcmRcIilcbiAgICAgIGtpbGxSaW5ncyA9IChjLmtpbGxSaW5nKCkgZm9yIGMgaW4gQGdldEVtYWNzQ3Vyc29ycygpKVxuICAgICAgS2lsbFJpbmcucHVsbEZyb21DbGlwYm9hcmQoa2lsbFJpbmdzKVxuXG4gIF91cGRhdGVHbG9iYWxLaWxsUmluZzogKG1ldGhvZCwga2lsbHMpIC0+XG4gICAgaWYga2lsbHMubGVuZ3RoID4gMVxuICAgICAgbWV0aG9kID0gJ3JlcGxhY2UnIGlmIG1ldGhvZCAhPSAncHVzaCdcbiAgICAgIEtpbGxSaW5nLmdsb2JhbFttZXRob2RdKGtpbGxzLmpvaW4oJ1xcbicpICsgJ1xcbicpXG4gICAgQF9wdXNoVG9DbGlwYm9hcmQoKVxuXG4gICMjI1xuICBTZWN0aW9uOiBFZGl0aW5nXG4gICMjI1xuXG4gIGRlbGV0ZUhvcml6b250YWxTcGFjZTogLT5cbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBAbW92ZUVtYWNzQ3Vyc29ycyAoZW1hY3NDdXJzb3IpID0+XG4gICAgICAgIHJhbmdlID0gZW1hY3NDdXJzb3IuaG9yaXpvbnRhbFNwYWNlUmFuZ2UoKVxuICAgICAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlLCAnJylcblxuICBkZWxldGVJbmRlbnRhdGlvbjogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBlZGl0b3JcbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBAZWRpdG9yLm1vdmVVcCgpXG4gICAgICBAZWRpdG9yLmpvaW5MaW5lcygpXG5cbiAgb3BlbkxpbmU6IC0+XG4gICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgZm9yIGVtYWNzQ3Vyc29yIGluIEBnZXRFbWFjc0N1cnNvcnMoKVxuICAgICAgICBlbWFjc0N1cnNvci5pbnNlcnRBZnRlcihcIlxcblwiKVxuXG4gIGp1c3RPbmVTcGFjZTogLT5cbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBmb3IgZW1hY3NDdXJzb3IgaW4gQGdldEVtYWNzQ3Vyc29ycygpXG4gICAgICAgIHJhbmdlID0gZW1hY3NDdXJzb3IuaG9yaXpvbnRhbFNwYWNlUmFuZ2UoKVxuICAgICAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlLCAnICcpXG5cbiAgZGVsZXRlQmxhbmtMaW5lczogLT5cbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBmb3IgZW1hY3NDdXJzb3IgaW4gQGdldEVtYWNzQ3Vyc29ycygpXG4gICAgICAgIGVtYWNzQ3Vyc29yLmRlbGV0ZUJsYW5rTGluZXMoKVxuXG4gIHRyYW5zcG9zZUNoYXJzOiAtPlxuICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIEBtb3ZlRW1hY3NDdXJzb3JzIChlbWFjc0N1cnNvcikgPT5cbiAgICAgICAgZW1hY3NDdXJzb3IudHJhbnNwb3NlQ2hhcnMoKVxuXG4gIHRyYW5zcG9zZVdvcmRzOiAtPlxuICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIEBtb3ZlRW1hY3NDdXJzb3JzIChlbWFjc0N1cnNvcikgPT5cbiAgICAgICAgZW1hY3NDdXJzb3IudHJhbnNwb3NlV29yZHMoKVxuXG4gIHRyYW5zcG9zZUxpbmVzOiAtPlxuICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIEBtb3ZlRW1hY3NDdXJzb3JzIChlbWFjc0N1cnNvcikgPT5cbiAgICAgICAgZW1hY3NDdXJzb3IudHJhbnNwb3NlTGluZXMoKVxuXG4gIHRyYW5zcG9zZVNleHBzOiAtPlxuICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIEBtb3ZlRW1hY3NDdXJzb3JzIChlbWFjc0N1cnNvcikgPT5cbiAgICAgICAgZW1hY3NDdXJzb3IudHJhbnNwb3NlU2V4cHMoKVxuXG4gIGRvd25jYXNlID0gKHMpIC0+IHMudG9Mb3dlckNhc2UoKVxuICB1cGNhc2UgPSAocykgLT4gcy50b1VwcGVyQ2FzZSgpXG4gIGNhcGl0YWxpemUgPSAocykgLT4gcy5zbGljZSgwLCAxKS50b1VwcGVyQ2FzZSgpICsgcy5zbGljZSgxKS50b0xvd2VyQ2FzZSgpXG5cbiAgZG93bmNhc2VXb3JkT3JSZWdpb246IC0+XG4gICAgQF90cmFuc2Zvcm1Xb3JkT3JSZWdpb24oZG93bmNhc2UpXG5cbiAgdXBjYXNlV29yZE9yUmVnaW9uOiAtPlxuICAgIEBfdHJhbnNmb3JtV29yZE9yUmVnaW9uKHVwY2FzZSlcblxuICBjYXBpdGFsaXplV29yZE9yUmVnaW9uOiAtPlxuICAgIEBfdHJhbnNmb3JtV29yZE9yUmVnaW9uKGNhcGl0YWxpemUsIHdvcmRBdEFUaW1lOiB0cnVlKVxuXG4gIF90cmFuc2Zvcm1Xb3JkT3JSZWdpb246ICh0cmFuc2Zvcm1Xb3JkLCB7d29yZEF0QVRpbWV9PXt9KSAtPlxuICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIGlmIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpLmZpbHRlcigocykgLT4gbm90IHMuaXNFbXB0eSgpKS5sZW5ndGggPiAwXG4gICAgICAgIEBlZGl0b3IubXV0YXRlU2VsZWN0ZWRUZXh0IChzZWxlY3Rpb24pID0+XG4gICAgICAgICAgcmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgICAgIGlmIHdvcmRBdEFUaW1lXG4gICAgICAgICAgICBAZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlIC9cXHcrL2csIHJhbmdlLCAoaGl0KSAtPlxuICAgICAgICAgICAgICBoaXQucmVwbGFjZSh0cmFuc2Zvcm1Xb3JkKGhpdC5tYXRjaFRleHQpKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UsIHRyYW5zZm9ybVdvcmQoc2VsZWN0aW9uLmdldFRleHQoKSkpXG4gICAgICBlbHNlXG4gICAgICAgIGZvciBjdXJzb3IgaW4gQGVkaXRvci5nZXRDdXJzb3JzKClcbiAgICAgICAgICBjdXJzb3IuZW1pdHRlci5fX3RyYWNrID0gdHJ1ZVxuICAgICAgICBAbW92ZUVtYWNzQ3Vyc29ycyAoZW1hY3NDdXJzb3IpID0+XG4gICAgICAgICAgZW1hY3NDdXJzb3IudHJhbnNmb3JtV29yZCh0cmFuc2Zvcm1Xb3JkKVxuXG4gIGRhYmJyZXZFeHBhbmQ6IC0+XG4gICAgaWYgQGNvbXBsZXRlcnM/XG4gICAgICBAY29tcGxldGVycy5mb3JFYWNoIChjb21wbGV0ZXIpIC0+XG4gICAgICAgIGNvbXBsZXRlci5uZXh0KClcbiAgICBlbHNlXG4gICAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICAgIEBjb21wbGV0ZXJzID0gW11cbiAgICAgICAgQG1vdmVFbWFjc0N1cnNvcnMgKGVtYWNzQ3Vyc29yKSA9PlxuICAgICAgICAgIGNvbXBsZXRlciA9IG5ldyBDb21wbGV0ZXIoQCwgZW1hY3NDdXJzb3IpXG4gICAgICAgICAgQGNvbXBsZXRlcnMucHVzaChjb21wbGV0ZXIpXG5cbiAgICBTdGF0ZS5kYWJicmV2U3RhdGUgPSB7ZW1hY3NFZGl0b3I6IEB9XG5cbiAgZGFiYnJldlByZXZpb3VzOiAtPlxuICAgIGlmIEBjb21wbGV0ZXJzP1xuICAgICAgQGNvbXBsZXRlcnMuZm9yRWFjaCAoY29tcGxldGVyKSAtPlxuICAgICAgICBjb21wbGV0ZXIucHJldmlvdXMoKVxuXG4gIGRhYmJyZXZEb25lOiAtPlxuICAgIEBjb21wbGV0ZXJzPy5mb3JFYWNoIChjb21wbGV0ZXIpIC0+XG4gICAgICBjb21wbGV0ZXIuZGVzdHJveSgpXG4gICAgQGNvbXBsZXRlcnMgPSBudWxsXG5cbiAgIyMjXG4gIFNlY3Rpb246IE1hcmtpbmcgJiBTZWxlY3RpbmdcbiAgIyMjXG5cbiAgc2V0TWFyazogLT5cbiAgICBmb3IgZW1hY3NDdXJzb3IgaW4gQGdldEVtYWNzQ3Vyc29ycygpXG4gICAgICBlbWFjc0N1cnNvci5tYXJrKCkuc2V0KCkuYWN0aXZhdGUoKVxuXG4gIG1hcmtTZXhwOiAtPlxuICAgIEBtb3ZlRW1hY3NDdXJzb3JzIChlbWFjc0N1cnNvcikgLT5cbiAgICAgIGVtYWNzQ3Vyc29yLm1hcmtTZXhwKClcblxuICBtYXJrV2hvbGVCdWZmZXI6IC0+XG4gICAgW2ZpcnN0LCByZXN0Li4uXSA9IEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgYy5kZXN0cm95KCkgZm9yIGMgaW4gcmVzdFxuICAgIGVtYWNzQ3Vyc29yID0gQGdldEVtYWNzQ3Vyc29yRm9yKGZpcnN0KVxuICAgIGZpcnN0Lm1vdmVUb0JvdHRvbSgpXG4gICAgZW1hY3NDdXJzb3IubWFyaygpLnNldCgpLmFjdGl2YXRlKClcbiAgICBmaXJzdC5tb3ZlVG9Ub3AoKVxuXG4gIGV4Y2hhbmdlUG9pbnRBbmRNYXJrOiAtPlxuICAgIEBtb3ZlRW1hY3NDdXJzb3JzIChlbWFjc0N1cnNvcikgLT5cbiAgICAgIGVtYWNzQ3Vyc29yLm1hcmsoKS5leGNoYW5nZSgpXG5cbiAgIyMjXG4gIFNlY3Rpb246IFVJXG4gICMjI1xuXG4gIHJlY2VudGVyVG9wQm90dG9tOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGVkaXRvclxuICAgIHZpZXcgPSBhdG9tLnZpZXdzLmdldFZpZXcoQGVkaXRvcilcbiAgICBtaW5Sb3cgPSBNYXRoLm1pbigoYy5nZXRCdWZmZXJSb3coKSBmb3IgYyBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKSkuLi4pXG4gICAgbWF4Um93ID0gTWF0aC5tYXgoKGMuZ2V0QnVmZmVyUm93KCkgZm9yIGMgaW4gQGVkaXRvci5nZXRDdXJzb3JzKCkpLi4uKVxuICAgIG1pbk9mZnNldCA9IHZpZXcucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKFttaW5Sb3csIDBdKVxuICAgIG1heE9mZnNldCA9IHZpZXcucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKFttYXhSb3csIDBdKVxuXG4gICAgc3dpdGNoIFN0YXRlLnJlY2VudGVyc1xuICAgICAgd2hlbiAwXG4gICAgICAgIHZpZXcuc2V0U2Nyb2xsVG9wKChtaW5PZmZzZXQudG9wICsgbWF4T2Zmc2V0LnRvcCAtIHZpZXcuZ2V0SGVpZ2h0KCkpLzIpXG4gICAgICB3aGVuIDFcbiAgICAgICAgIyBBdG9tIGFwcGxpZXMgYSAoaGFyZGNvZGVkKSAyLWxpbmUgYnVmZmVyIHdoaWxlIHNjcm9sbGluZyAtLSBkbyB0aGF0IGhlcmUuXG4gICAgICAgIHZpZXcuc2V0U2Nyb2xsVG9wKG1pbk9mZnNldC50b3AgLSAyKkBlZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCkpXG4gICAgICB3aGVuIDJcbiAgICAgICAgdmlldy5zZXRTY3JvbGxUb3AobWF4T2Zmc2V0LnRvcCArIDMqQGVkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKSAtIHZpZXcuZ2V0SGVpZ2h0KCkpXG5cbiAgICBTdGF0ZS5yZWNlbnRlcmVkKClcblxuICBzY3JvbGxVcDogLT5cbiAgICBpZiAodmlzaWJsZVJvd1JhbmdlID0gQGVkaXRvci5nZXRWaXNpYmxlUm93UmFuZ2UoKSlcbiAgICAgICMgSUYgdGhlIGJ1ZmZlciBpcyBlbXB0eSwgd2UgZ2V0IE5hTnMgaGVyZSAoQXRvbSAxLjIxKS5cbiAgICAgIHJldHVybiB1bmxlc3MgdmlzaWJsZVJvd1JhbmdlLmV2ZXJ5KChlKSA9PiAhTnVtYmVyLmlzTmFOKGUpKVxuXG4gICAgICBbZmlyc3RSb3csIGxhc3RSb3ddID0gdmlzaWJsZVJvd1JhbmdlXG4gICAgICBjdXJyZW50Um93ID0gQGVkaXRvci5jdXJzb3JzWzBdLmdldEJ1ZmZlclJvdygpXG4gICAgICByb3dDb3VudCA9IChsYXN0Um93IC0gZmlyc3RSb3cpIC0gMlxuICAgICAgQGVkaXRvci5tb3ZlRG93bihyb3dDb3VudClcblxuICBzY3JvbGxEb3duOiAtPlxuICAgIGlmICh2aXNpYmxlUm93UmFuZ2UgPSBAZWRpdG9yLmdldFZpc2libGVSb3dSYW5nZSgpKVxuICAgICAgIyBJRiB0aGUgYnVmZmVyIGlzIGVtcHR5LCB3ZSBnZXQgTmFOcyBoZXJlIChBdG9tIDEuMjEpLlxuICAgICAgcmV0dXJuIHVubGVzcyB2aXNpYmxlUm93UmFuZ2UuZXZlcnkoKGUpID0+ICFOdW1iZXIuaXNOYU4oZSkpXG5cbiAgICAgIFtmaXJzdFJvdyxsYXN0Um93XSA9IHZpc2libGVSb3dSYW5nZVxuICAgICAgY3VycmVudFJvdyA9IEBlZGl0b3IuY3Vyc29yc1swXS5nZXRCdWZmZXJSb3coKVxuICAgICAgcm93Q291bnQgPSAobGFzdFJvdyAtIGZpcnN0Um93KSAtIDJcbiAgICAgIEBlZGl0b3IubW92ZVVwKHJvd0NvdW50KVxuXG4gICMjI1xuICBTZWN0aW9uOiBPdGhlclxuICAjIyNcblxuICBrZXlib2FyZFF1aXQ6IC0+XG4gICAgZm9yIGVtYWNzQ3Vyc29yIGluIEBnZXRFbWFjc0N1cnNvcnMoKVxuICAgICAgZW1hY3NDdXJzb3IubWFyaygpLmRlYWN0aXZhdGUoKVxuIl19
