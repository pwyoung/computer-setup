(function() {
  var Completer, CompositeDisposable, EmacsCursor, EmacsEditor, KillRing, Mark, SearchManager, State, afterCommand, beforeCommand, closeOtherPanes, findFile, getEditor;

  CompositeDisposable = require('atom').CompositeDisposable;

  Completer = require('./completer');

  EmacsCursor = require('./emacs-cursor');

  EmacsEditor = require('./emacs-editor');

  KillRing = require('./kill-ring');

  Mark = require('./mark');

  SearchManager = require('./search-manager');

  State = require('./state');

  beforeCommand = function(event) {
    return State.beforeCommand(event);
  };

  afterCommand = function(event) {
    var emacsCursor, emacsEditor, i, len, ref;
    Mark.deactivatePending();
    if (State.yankComplete()) {
      emacsEditor = getEditor(event);
      ref = emacsEditor.getEmacsCursors();
      for (i = 0, len = ref.length; i < len; i++) {
        emacsCursor = ref[i];
        emacsCursor.yankComplete();
      }
    }
    return State.afterCommand(event);
  };

  getEditor = function(event) {
    var editor, ref, ref1, ref2;
    editor = (ref = (ref1 = event.target) != null ? (ref2 = ref1.closest('atom-text-editor')) != null ? typeof ref2.getModel === "function" ? ref2.getModel() : void 0 : void 0 : void 0) != null ? ref : atom.workspace.getActiveTextEditor();
    return EmacsEditor["for"](editor);
  };

  findFile = function(event) {
    var haveAOF, useAOF;
    haveAOF = atom.packages.isPackageLoaded('advanced-open-file');
    useAOF = atom.config.get('atomic-emacs.useAdvancedOpenFile');
    if (haveAOF && useAOF) {
      return atom.commands.dispatch(event.target, 'advanced-open-file:toggle');
    } else {
      return atom.commands.dispatch(event.target, 'fuzzy-finder:toggle-file-finder');
    }
  };

  closeOtherPanes = function(event) {
    var activePane, container, i, len, pane, ref, results;
    container = atom.workspace.getPaneContainers().find((function(_this) {
      return function(c) {
        return c.getLocation() === 'center';
      };
    })(this));
    activePane = container != null ? container.getActivePane() : void 0;
    if (activePane == null) {
      return;
    }
    ref = container.getPanes();
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      pane = ref[i];
      if (pane !== activePane) {
        results.push(pane.close());
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  module.exports = {
    EmacsCursor: EmacsCursor,
    EmacsEditor: EmacsEditor,
    KillRing: KillRing,
    Mark: Mark,
    SearchManager: SearchManager,
    State: State,
    config: {
      useAdvancedOpenFile: {
        type: 'boolean',
        "default": true,
        title: 'Use advanced-open-file for find-file if available'
      },
      alwaysUseKillRing: {
        type: 'boolean',
        "default": false,
        title: 'Use kill ring for built-in copy & cut commands'
      },
      killToClipboard: {
        type: 'boolean',
        "default": true,
        title: 'Send kills to the system clipboard'
      },
      yankFromClipboard: {
        type: 'boolean',
        "default": false,
        title: 'Yank changed text from the system clipboard'
      },
      killWholeLine: {
        type: 'boolean',
        "default": false,
        title: 'Always Kill whole line.'
      }
    },
    activate: function() {
      var ref, ref1;
      if (this.disposable) {
        console.log("atomic-emacs activated twice -- aborting");
        return;
      }
      State.initialize();
      this.search = new SearchManager({
        plugin: this
      });
      if ((ref = document.getElementsByTagName('atom-workspace')[0]) != null) {
        if ((ref1 = ref.classList) != null) {
          ref1.add('atomic-emacs');
        }
      }
      this.disposable = new CompositeDisposable;
      this.disposable.add(atom.commands.onWillDispatch(function(event) {
        return beforeCommand(event);
      }));
      this.disposable.add(atom.commands.onDidDispatch(function(event) {
        return afterCommand(event);
      }));
      this.disposable.add(atom.commands.add('atom-text-editor', {
        "atomic-emacs:backward-char": function(event) {
          return getEditor(event).backwardChar();
        },
        "atomic-emacs:forward-char": function(event) {
          return getEditor(event).forwardChar();
        },
        "atomic-emacs:backward-word": function(event) {
          return getEditor(event).backwardWord();
        },
        "atomic-emacs:forward-word": function(event) {
          return getEditor(event).forwardWord();
        },
        "atomic-emacs:backward-sexp": function(event) {
          return getEditor(event).backwardSexp();
        },
        "atomic-emacs:forward-sexp": function(event) {
          return getEditor(event).forwardSexp();
        },
        "atomic-emacs:backward-list": function(event) {
          return getEditor(event).backwardList();
        },
        "atomic-emacs:forward-list": function(event) {
          return getEditor(event).forwardList();
        },
        "atomic-emacs:previous-line": function(event) {
          return getEditor(event).previousLine();
        },
        "atomic-emacs:next-line": function(event) {
          return getEditor(event).nextLine();
        },
        "atomic-emacs:backward-paragraph": function(event) {
          return getEditor(event).backwardParagraph();
        },
        "atomic-emacs:forward-paragraph": function(event) {
          return getEditor(event).forwardParagraph();
        },
        "atomic-emacs:back-to-indentation": function(event) {
          return getEditor(event).backToIndentation();
        },
        "atomic-emacs:backward-kill-word": function(event) {
          return getEditor(event).backwardKillWord();
        },
        "atomic-emacs:kill-word": function(event) {
          return getEditor(event).killWord();
        },
        "atomic-emacs:kill-line": function(event) {
          return getEditor(event).killLine();
        },
        "atomic-emacs:kill-region": function(event) {
          return getEditor(event).killRegion();
        },
        "atomic-emacs:copy-region-as-kill": function(event) {
          return getEditor(event).copyRegionAsKill();
        },
        "atomic-emacs:append-next-kill": function(event) {
          return State.killed();
        },
        "atomic-emacs:yank": function(event) {
          return getEditor(event).yank();
        },
        "atomic-emacs:yank-pop": function(event) {
          return getEditor(event).yankPop();
        },
        "atomic-emacs:yank-shift": function(event) {
          return getEditor(event).yankShift();
        },
        "atomic-emacs:cut": function(event) {
          if (atom.config.get('atomic-emacs.alwaysUseKillRing')) {
            return getEditor(event).killRegion();
          } else {
            return event.abortKeyBinding();
          }
        },
        "atomic-emacs:copy": function(event) {
          if (atom.config.get('atomic-emacs.alwaysUseKillRing')) {
            return getEditor(event).copyRegionAsKill();
          } else {
            return event.abortKeyBinding();
          }
        },
        "atomic-emacs:delete-horizontal-space": function(event) {
          return getEditor(event).deleteHorizontalSpace();
        },
        "atomic-emacs:delete-indentation": function(event) {
          return getEditor(event).deleteIndentation();
        },
        "atomic-emacs:open-line": function(event) {
          return getEditor(event).openLine();
        },
        "atomic-emacs:just-one-space": function(event) {
          return getEditor(event).justOneSpace();
        },
        "atomic-emacs:delete-blank-lines": function(event) {
          return getEditor(event).deleteBlankLines();
        },
        "atomic-emacs:transpose-chars": function(event) {
          return getEditor(event).transposeChars();
        },
        "atomic-emacs:transpose-lines": function(event) {
          return getEditor(event).transposeLines();
        },
        "atomic-emacs:transpose-sexps": function(event) {
          return getEditor(event).transposeSexps();
        },
        "atomic-emacs:transpose-words": function(event) {
          return getEditor(event).transposeWords();
        },
        "atomic-emacs:downcase-word-or-region": function(event) {
          return getEditor(event).downcaseWordOrRegion();
        },
        "atomic-emacs:upcase-word-or-region": function(event) {
          return getEditor(event).upcaseWordOrRegion();
        },
        "atomic-emacs:capitalize-word-or-region": function(event) {
          return getEditor(event).capitalizeWordOrRegion();
        },
        "atomic-emacs:dabbrev-expand": function(event) {
          return getEditor(event).dabbrevExpand();
        },
        "atomic-emacs:dabbrev-previous": function(event) {
          return getEditor(event).dabbrevPrevious();
        },
        "atomic-emacs:isearch-forward": (function(_this) {
          return function(event) {
            return _this.search.start(getEditor(event), {
              direction: 'forward'
            });
          };
        })(this),
        "atomic-emacs:isearch-backward": (function(_this) {
          return function(event) {
            return _this.search.start(getEditor(event), {
              direction: 'backward'
            });
          };
        })(this),
        "atomic-emacs:set-mark": function(event) {
          return getEditor(event).setMark();
        },
        "atomic-emacs:mark-sexp": function(event) {
          return getEditor(event).markSexp();
        },
        "atomic-emacs:mark-whole-buffer": function(event) {
          return getEditor(event).markWholeBuffer();
        },
        "atomic-emacs:exchange-point-and-mark": function(event) {
          return getEditor(event).exchangePointAndMark();
        },
        "atomic-emacs:recenter-top-bottom": function(event) {
          return getEditor(event).recenterTopBottom();
        },
        "atomic-emacs:scroll-down": function(event) {
          return getEditor(event).scrollDown();
        },
        "atomic-emacs:scroll-up": function(event) {
          return getEditor(event).scrollUp();
        },
        "core:cancel": function(event) {
          return getEditor(event).keyboardQuit();
        }
      }));
      this.disposable.add(atom.commands.add('.atomic-emacs.search atom-text-editor', {
        "atomic-emacs:isearch-exit": (function(_this) {
          return function(event) {
            return _this.search.exit();
          };
        })(this),
        "atomic-emacs:isearch-cancel": (function(_this) {
          return function(event) {
            return _this.search.cancel();
          };
        })(this),
        "atomic-emacs:isearch-repeat-forward": (function(_this) {
          return function(event) {
            return _this.search.repeat('forward');
          };
        })(this),
        "atomic-emacs:isearch-repeat-backward": (function(_this) {
          return function(event) {
            return _this.search.repeat('backward');
          };
        })(this),
        "atomic-emacs:isearch-toggle-case-fold": (function(_this) {
          return function(event) {
            return _this.search.toggleCaseSensitivity();
          };
        })(this),
        "atomic-emacs:isearch-toggle-regexp": (function(_this) {
          return function(event) {
            return _this.search.toggleIsRegExp();
          };
        })(this),
        "atomic-emacs:isearch-yank-word-or-character": (function(_this) {
          return function(event) {
            return _this.search.yankWordOrCharacter();
          };
        })(this)
      }));
      return this.disposable.add(atom.commands.add('atom-workspace', {
        "atomic-emacs:find-file": function(event) {
          return findFile(event);
        },
        "atomic-emacs:close-other-panes": function(event) {
          return closeOtherPanes(event);
        }
      }));
    },
    deactivate: function() {
      var ref, ref1, ref2;
      if ((ref = document.getElementsByTagName('atom-workspace')[0]) != null) {
        if ((ref1 = ref.classList) != null) {
          ref1.remove('atomic-emacs');
        }
      }
      if ((ref2 = this.disposable) != null) {
        ref2.dispose();
      }
      this.disposable = null;
      KillRing.global.reset();
      return this.search.destroy();
    },
    consumeElementIcons: function(addIconToElement) {
      this.addIconToElement = addIconToElement;
    },
    service_0_13: function() {
      return {
        state: State,
        search: this.search,
        editor: function(atomEditor) {
          return EmacsEditor["for"](atomEditor);
        },
        cursor: function(atomCursor) {
          return this.editor(atomCursor.editor).getEmacsCursorFor(atomCursor);
        },
        getEditor: function(event) {
          return getEditor(event);
        }
      };
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2F0b21pYy1lbWFjcy9saWIvYXRvbWljLWVtYWNzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixTQUFBLEdBQVksT0FBQSxDQUFRLGFBQVI7O0VBQ1osV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLGdCQUFSOztFQUNkLFFBQUEsR0FBVyxPQUFBLENBQVEsYUFBUjs7RUFDWCxJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBQ1AsYUFBQSxHQUFnQixPQUFBLENBQVEsa0JBQVI7O0VBQ2hCLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7RUFFUixhQUFBLEdBQWdCLFNBQUMsS0FBRDtXQUNkLEtBQUssQ0FBQyxhQUFOLENBQW9CLEtBQXBCO0VBRGM7O0VBR2hCLFlBQUEsR0FBZSxTQUFDLEtBQUQ7QUFDYixRQUFBO0lBQUEsSUFBSSxDQUFDLGlCQUFMLENBQUE7SUFFQSxJQUFHLEtBQUssQ0FBQyxZQUFOLENBQUEsQ0FBSDtNQUNFLFdBQUEsR0FBYyxTQUFBLENBQVUsS0FBVjtBQUNkO0FBQUEsV0FBQSxxQ0FBQTs7UUFDRSxXQUFXLENBQUMsWUFBWixDQUFBO0FBREYsT0FGRjs7V0FLQSxLQUFLLENBQUMsWUFBTixDQUFtQixLQUFuQjtFQVJhOztFQVVmLFNBQUEsR0FBWSxTQUFDLEtBQUQ7QUFFVixRQUFBO0lBQUEsTUFBQSxnTUFBa0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBO1dBQ2xFLFdBQVcsRUFBQyxHQUFELEVBQVgsQ0FBZ0IsTUFBaEI7RUFIVTs7RUFLWixRQUFBLEdBQVcsU0FBQyxLQUFEO0FBQ1QsUUFBQTtJQUFBLE9BQUEsR0FBVSxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWQsQ0FBOEIsb0JBQTlCO0lBQ1YsTUFBQSxHQUFTLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixrQ0FBaEI7SUFDVCxJQUFHLE9BQUEsSUFBWSxNQUFmO2FBQ0UsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFkLENBQXVCLEtBQUssQ0FBQyxNQUE3QixFQUFxQywyQkFBckMsRUFERjtLQUFBLE1BQUE7YUFHRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQWQsQ0FBdUIsS0FBSyxDQUFDLE1BQTdCLEVBQXFDLGlDQUFyQyxFQUhGOztFQUhTOztFQVFYLGVBQUEsR0FBa0IsU0FBQyxLQUFEO0FBQ2hCLFFBQUE7SUFBQSxTQUFBLEdBQVksSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBZixDQUFBLENBQWtDLENBQUMsSUFBbkMsQ0FBd0MsQ0FBQSxTQUFBLEtBQUE7YUFBQSxTQUFDLENBQUQ7ZUFBTyxDQUFDLENBQUMsV0FBRixDQUFBLENBQUEsS0FBbUI7TUFBMUI7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXhDO0lBQ1osVUFBQSx1QkFBYSxTQUFTLENBQUUsYUFBWCxDQUFBO0lBQ2IsSUFBYyxrQkFBZDtBQUFBLGFBQUE7O0FBQ0E7QUFBQTtTQUFBLHFDQUFBOztNQUNFLElBQU8sSUFBQSxLQUFRLFVBQWY7cUJBQ0UsSUFBSSxDQUFDLEtBQUwsQ0FBQSxHQURGO09BQUEsTUFBQTs2QkFBQTs7QUFERjs7RUFKZ0I7O0VBUWxCLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxXQUFBLEVBQWEsV0FBYjtJQUNBLFdBQUEsRUFBYSxXQURiO0lBRUEsUUFBQSxFQUFVLFFBRlY7SUFHQSxJQUFBLEVBQU0sSUFITjtJQUlBLGFBQUEsRUFBZSxhQUpmO0lBS0EsS0FBQSxFQUFPLEtBTFA7SUFPQSxNQUFBLEVBQ0U7TUFBQSxtQkFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLElBRFQ7UUFFQSxLQUFBLEVBQU8sbURBRlA7T0FERjtNQUlBLGlCQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FEVDtRQUVBLEtBQUEsRUFBTyxnREFGUDtPQUxGO01BUUEsZUFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFDQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLElBRFQ7UUFFQSxLQUFBLEVBQU8sb0NBRlA7T0FURjtNQVlBLGlCQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUNBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FEVDtRQUVBLEtBQUEsRUFBTyw2Q0FGUDtPQWJGO01BZ0JBLGFBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxTQUFOO1FBQ0EsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQURUO1FBRUEsS0FBQSxFQUFPLHlCQUZQO09BakJGO0tBUkY7SUE2QkEsUUFBQSxFQUFVLFNBQUE7QUFDUixVQUFBO01BQUEsSUFBRyxJQUFDLENBQUEsVUFBSjtRQUNFLE9BQU8sQ0FBQyxHQUFSLENBQVksMENBQVo7QUFDQSxlQUZGOztNQUlBLEtBQUssQ0FBQyxVQUFOLENBQUE7TUFDQSxJQUFDLENBQUEsTUFBRCxHQUFVLElBQUksYUFBSixDQUFrQjtRQUFBLE1BQUEsRUFBUSxJQUFSO09BQWxCOzs7Y0FDbUQsQ0FBRSxHQUEvRCxDQUFtRSxjQUFuRTs7O01BQ0EsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFJO01BQ2xCLElBQUMsQ0FBQSxVQUFVLENBQUMsR0FBWixDQUFnQixJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWQsQ0FBNkIsU0FBQyxLQUFEO2VBQVcsYUFBQSxDQUFjLEtBQWQ7TUFBWCxDQUE3QixDQUFoQjtNQUNBLElBQUMsQ0FBQSxVQUFVLENBQUMsR0FBWixDQUFnQixJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWQsQ0FBNEIsU0FBQyxLQUFEO2VBQVcsWUFBQSxDQUFhLEtBQWI7TUFBWCxDQUE1QixDQUFoQjtNQUNBLElBQUMsQ0FBQSxVQUFVLENBQUMsR0FBWixDQUFnQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0Isa0JBQWxCLEVBRWQ7UUFBQSw0QkFBQSxFQUE4QixTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxZQUFqQixDQUFBO1FBQVgsQ0FBOUI7UUFDQSwyQkFBQSxFQUE2QixTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxXQUFqQixDQUFBO1FBQVgsQ0FEN0I7UUFFQSw0QkFBQSxFQUE4QixTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxZQUFqQixDQUFBO1FBQVgsQ0FGOUI7UUFHQSwyQkFBQSxFQUE2QixTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxXQUFqQixDQUFBO1FBQVgsQ0FIN0I7UUFJQSw0QkFBQSxFQUE4QixTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxZQUFqQixDQUFBO1FBQVgsQ0FKOUI7UUFLQSwyQkFBQSxFQUE2QixTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxXQUFqQixDQUFBO1FBQVgsQ0FMN0I7UUFNQSw0QkFBQSxFQUE4QixTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxZQUFqQixDQUFBO1FBQVgsQ0FOOUI7UUFPQSwyQkFBQSxFQUE2QixTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxXQUFqQixDQUFBO1FBQVgsQ0FQN0I7UUFRQSw0QkFBQSxFQUE4QixTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxZQUFqQixDQUFBO1FBQVgsQ0FSOUI7UUFTQSx3QkFBQSxFQUEwQixTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxRQUFqQixDQUFBO1FBQVgsQ0FUMUI7UUFVQSxpQ0FBQSxFQUFtQyxTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxpQkFBakIsQ0FBQTtRQUFYLENBVm5DO1FBV0EsZ0NBQUEsRUFBa0MsU0FBQyxLQUFEO2lCQUFXLFNBQUEsQ0FBVSxLQUFWLENBQWdCLENBQUMsZ0JBQWpCLENBQUE7UUFBWCxDQVhsQztRQVlBLGtDQUFBLEVBQW9DLFNBQUMsS0FBRDtpQkFBVyxTQUFBLENBQVUsS0FBVixDQUFnQixDQUFDLGlCQUFqQixDQUFBO1FBQVgsQ0FacEM7UUFlQSxpQ0FBQSxFQUFtQyxTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxnQkFBakIsQ0FBQTtRQUFYLENBZm5DO1FBZ0JBLHdCQUFBLEVBQTBCLFNBQUMsS0FBRDtpQkFBVyxTQUFBLENBQVUsS0FBVixDQUFnQixDQUFDLFFBQWpCLENBQUE7UUFBWCxDQWhCMUI7UUFpQkEsd0JBQUEsRUFBMEIsU0FBQyxLQUFEO2lCQUFXLFNBQUEsQ0FBVSxLQUFWLENBQWdCLENBQUMsUUFBakIsQ0FBQTtRQUFYLENBakIxQjtRQWtCQSwwQkFBQSxFQUE0QixTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxVQUFqQixDQUFBO1FBQVgsQ0FsQjVCO1FBbUJBLGtDQUFBLEVBQW9DLFNBQUMsS0FBRDtpQkFBVyxTQUFBLENBQVUsS0FBVixDQUFnQixDQUFDLGdCQUFqQixDQUFBO1FBQVgsQ0FuQnBDO1FBb0JBLCtCQUFBLEVBQWlDLFNBQUMsS0FBRDtpQkFBVyxLQUFLLENBQUMsTUFBTixDQUFBO1FBQVgsQ0FwQmpDO1FBcUJBLG1CQUFBLEVBQXFCLFNBQUMsS0FBRDtpQkFBVyxTQUFBLENBQVUsS0FBVixDQUFnQixDQUFDLElBQWpCLENBQUE7UUFBWCxDQXJCckI7UUFzQkEsdUJBQUEsRUFBeUIsU0FBQyxLQUFEO2lCQUFXLFNBQUEsQ0FBVSxLQUFWLENBQWdCLENBQUMsT0FBakIsQ0FBQTtRQUFYLENBdEJ6QjtRQXVCQSx5QkFBQSxFQUEyQixTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxTQUFqQixDQUFBO1FBQVgsQ0F2QjNCO1FBd0JBLGtCQUFBLEVBQW9CLFNBQUMsS0FBRDtVQUNsQixJQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixnQ0FBaEIsQ0FBSDttQkFDRSxTQUFBLENBQVUsS0FBVixDQUFnQixDQUFDLFVBQWpCLENBQUEsRUFERjtXQUFBLE1BQUE7bUJBR0UsS0FBSyxDQUFDLGVBQU4sQ0FBQSxFQUhGOztRQURrQixDQXhCcEI7UUE2QkEsbUJBQUEsRUFBcUIsU0FBQyxLQUFEO1VBQ25CLElBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLGdDQUFoQixDQUFIO21CQUNFLFNBQUEsQ0FBVSxLQUFWLENBQWdCLENBQUMsZ0JBQWpCLENBQUEsRUFERjtXQUFBLE1BQUE7bUJBR0UsS0FBSyxDQUFDLGVBQU4sQ0FBQSxFQUhGOztRQURtQixDQTdCckI7UUFvQ0Esc0NBQUEsRUFBd0MsU0FBQyxLQUFEO2lCQUFXLFNBQUEsQ0FBVSxLQUFWLENBQWdCLENBQUMscUJBQWpCLENBQUE7UUFBWCxDQXBDeEM7UUFxQ0EsaUNBQUEsRUFBbUMsU0FBQyxLQUFEO2lCQUFXLFNBQUEsQ0FBVSxLQUFWLENBQWdCLENBQUMsaUJBQWpCLENBQUE7UUFBWCxDQXJDbkM7UUFzQ0Esd0JBQUEsRUFBMEIsU0FBQyxLQUFEO2lCQUFXLFNBQUEsQ0FBVSxLQUFWLENBQWdCLENBQUMsUUFBakIsQ0FBQTtRQUFYLENBdEMxQjtRQXVDQSw2QkFBQSxFQUErQixTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxZQUFqQixDQUFBO1FBQVgsQ0F2Qy9CO1FBd0NBLGlDQUFBLEVBQW1DLFNBQUMsS0FBRDtpQkFBVyxTQUFBLENBQVUsS0FBVixDQUFnQixDQUFDLGdCQUFqQixDQUFBO1FBQVgsQ0F4Q25DO1FBeUNBLDhCQUFBLEVBQWdDLFNBQUMsS0FBRDtpQkFBVyxTQUFBLENBQVUsS0FBVixDQUFnQixDQUFDLGNBQWpCLENBQUE7UUFBWCxDQXpDaEM7UUEwQ0EsOEJBQUEsRUFBZ0MsU0FBQyxLQUFEO2lCQUFXLFNBQUEsQ0FBVSxLQUFWLENBQWdCLENBQUMsY0FBakIsQ0FBQTtRQUFYLENBMUNoQztRQTJDQSw4QkFBQSxFQUFnQyxTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxjQUFqQixDQUFBO1FBQVgsQ0EzQ2hDO1FBNENBLDhCQUFBLEVBQWdDLFNBQUMsS0FBRDtpQkFBVyxTQUFBLENBQVUsS0FBVixDQUFnQixDQUFDLGNBQWpCLENBQUE7UUFBWCxDQTVDaEM7UUE2Q0Esc0NBQUEsRUFBd0MsU0FBQyxLQUFEO2lCQUFXLFNBQUEsQ0FBVSxLQUFWLENBQWdCLENBQUMsb0JBQWpCLENBQUE7UUFBWCxDQTdDeEM7UUE4Q0Esb0NBQUEsRUFBc0MsU0FBQyxLQUFEO2lCQUFXLFNBQUEsQ0FBVSxLQUFWLENBQWdCLENBQUMsa0JBQWpCLENBQUE7UUFBWCxDQTlDdEM7UUErQ0Esd0NBQUEsRUFBMEMsU0FBQyxLQUFEO2lCQUFXLFNBQUEsQ0FBVSxLQUFWLENBQWdCLENBQUMsc0JBQWpCLENBQUE7UUFBWCxDQS9DMUM7UUFnREEsNkJBQUEsRUFBK0IsU0FBQyxLQUFEO2lCQUFXLFNBQUEsQ0FBVSxLQUFWLENBQWdCLENBQUMsYUFBakIsQ0FBQTtRQUFYLENBaEQvQjtRQWlEQSwrQkFBQSxFQUFpQyxTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxlQUFqQixDQUFBO1FBQVgsQ0FqRGpDO1FBb0RBLDhCQUFBLEVBQWdDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsS0FBRDttQkFBVyxLQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBYyxTQUFBLENBQVUsS0FBVixDQUFkLEVBQWdDO2NBQUEsU0FBQSxFQUFXLFNBQVg7YUFBaEM7VUFBWDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FwRGhDO1FBcURBLCtCQUFBLEVBQWlDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsS0FBRDttQkFBVyxLQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBYyxTQUFBLENBQVUsS0FBVixDQUFkLEVBQWdDO2NBQUEsU0FBQSxFQUFXLFVBQVg7YUFBaEM7VUFBWDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FyRGpDO1FBd0RBLHVCQUFBLEVBQXlCLFNBQUMsS0FBRDtpQkFBVyxTQUFBLENBQVUsS0FBVixDQUFnQixDQUFDLE9BQWpCLENBQUE7UUFBWCxDQXhEekI7UUF5REEsd0JBQUEsRUFBMEIsU0FBQyxLQUFEO2lCQUFXLFNBQUEsQ0FBVSxLQUFWLENBQWdCLENBQUMsUUFBakIsQ0FBQTtRQUFYLENBekQxQjtRQTBEQSxnQ0FBQSxFQUFrQyxTQUFDLEtBQUQ7aUJBQVcsU0FBQSxDQUFVLEtBQVYsQ0FBZ0IsQ0FBQyxlQUFqQixDQUFBO1FBQVgsQ0ExRGxDO1FBMkRBLHNDQUFBLEVBQXdDLFNBQUMsS0FBRDtpQkFBVyxTQUFBLENBQVUsS0FBVixDQUFnQixDQUFDLG9CQUFqQixDQUFBO1FBQVgsQ0EzRHhDO1FBOERBLGtDQUFBLEVBQW9DLFNBQUMsS0FBRDtpQkFBVyxTQUFBLENBQVUsS0FBVixDQUFnQixDQUFDLGlCQUFqQixDQUFBO1FBQVgsQ0E5RHBDO1FBK0RBLDBCQUFBLEVBQTRCLFNBQUMsS0FBRDtpQkFBVyxTQUFBLENBQVUsS0FBVixDQUFnQixDQUFDLFVBQWpCLENBQUE7UUFBWCxDQS9ENUI7UUFnRUEsd0JBQUEsRUFBMEIsU0FBQyxLQUFEO2lCQUFXLFNBQUEsQ0FBVSxLQUFWLENBQWdCLENBQUMsUUFBakIsQ0FBQTtRQUFYLENBaEUxQjtRQW1FQSxhQUFBLEVBQWUsU0FBQyxLQUFEO2lCQUFXLFNBQUEsQ0FBVSxLQUFWLENBQWdCLENBQUMsWUFBakIsQ0FBQTtRQUFYLENBbkVmO09BRmMsQ0FBaEI7TUF1RUEsSUFBQyxDQUFBLFVBQVUsQ0FBQyxHQUFaLENBQWdCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQix1Q0FBbEIsRUFDZDtRQUFBLDJCQUFBLEVBQTZCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsS0FBRDttQkFBVyxLQUFDLENBQUEsTUFBTSxDQUFDLElBQVIsQ0FBQTtVQUFYO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE3QjtRQUNBLDZCQUFBLEVBQStCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsS0FBRDttQkFBVyxLQUFDLENBQUEsTUFBTSxDQUFDLE1BQVIsQ0FBQTtVQUFYO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUQvQjtRQUVBLHFDQUFBLEVBQXVDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsS0FBRDttQkFBVyxLQUFDLENBQUEsTUFBTSxDQUFDLE1BQVIsQ0FBZSxTQUFmO1VBQVg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRnZDO1FBR0Esc0NBQUEsRUFBd0MsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxLQUFEO21CQUFXLEtBQUMsQ0FBQSxNQUFNLENBQUMsTUFBUixDQUFlLFVBQWY7VUFBWDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FIeEM7UUFJQSx1Q0FBQSxFQUF5QyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLEtBQUQ7bUJBQVcsS0FBQyxDQUFBLE1BQU0sQ0FBQyxxQkFBUixDQUFBO1VBQVg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBSnpDO1FBS0Esb0NBQUEsRUFBc0MsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxLQUFEO21CQUFXLEtBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUFBO1VBQVg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBTHRDO1FBTUEsNkNBQUEsRUFBK0MsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxLQUFEO21CQUFXLEtBQUMsQ0FBQSxNQUFNLENBQUMsbUJBQVIsQ0FBQTtVQUFYO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQU4vQztPQURjLENBQWhCO2FBU0EsSUFBQyxDQUFBLFVBQVUsQ0FBQyxHQUFaLENBQWdCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFDZDtRQUFBLHdCQUFBLEVBQTBCLFNBQUMsS0FBRDtpQkFBVyxRQUFBLENBQVMsS0FBVDtRQUFYLENBQTFCO1FBQ0EsZ0NBQUEsRUFBa0MsU0FBQyxLQUFEO2lCQUFXLGVBQUEsQ0FBZ0IsS0FBaEI7UUFBWCxDQURsQztPQURjLENBQWhCO0lBM0ZRLENBN0JWO0lBNEhBLFVBQUEsRUFBWSxTQUFBO0FBQ1YsVUFBQTs7O2NBQTZELENBQUUsTUFBL0QsQ0FBc0UsY0FBdEU7Ozs7WUFDVyxDQUFFLE9BQWIsQ0FBQTs7TUFDQSxJQUFDLENBQUEsVUFBRCxHQUFjO01BQ2QsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFoQixDQUFBO2FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFSLENBQUE7SUFMVSxDQTVIWjtJQW1JQSxtQkFBQSxFQUFxQixTQUFDLGdCQUFEO01BQUMsSUFBQyxDQUFBLG1CQUFEO0lBQUQsQ0FuSXJCO0lBcUlBLFlBQUEsRUFBYyxTQUFBO2FBQ1o7UUFBQSxLQUFBLEVBQU8sS0FBUDtRQUNBLE1BQUEsRUFBUSxJQUFDLENBQUEsTUFEVDtRQUVBLE1BQUEsRUFBUSxTQUFDLFVBQUQ7aUJBQWdCLFdBQVcsRUFBQyxHQUFELEVBQVgsQ0FBZ0IsVUFBaEI7UUFBaEIsQ0FGUjtRQUdBLE1BQUEsRUFBUSxTQUFDLFVBQUQ7aUJBQWdCLElBQUMsQ0FBQSxNQUFELENBQVEsVUFBVSxDQUFDLE1BQW5CLENBQTBCLENBQUMsaUJBQTNCLENBQTZDLFVBQTdDO1FBQWhCLENBSFI7UUFJQSxTQUFBLEVBQVcsU0FBQyxLQUFEO2lCQUFXLFNBQUEsQ0FBVSxLQUFWO1FBQVgsQ0FKWDs7SUFEWSxDQXJJZDs7QUE1Q0YiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuQ29tcGxldGVyID0gcmVxdWlyZSAnLi9jb21wbGV0ZXInXG5FbWFjc0N1cnNvciA9IHJlcXVpcmUgJy4vZW1hY3MtY3Vyc29yJ1xuRW1hY3NFZGl0b3IgPSByZXF1aXJlICcuL2VtYWNzLWVkaXRvcidcbktpbGxSaW5nID0gcmVxdWlyZSAnLi9raWxsLXJpbmcnXG5NYXJrID0gcmVxdWlyZSAnLi9tYXJrJ1xuU2VhcmNoTWFuYWdlciA9IHJlcXVpcmUgJy4vc2VhcmNoLW1hbmFnZXInXG5TdGF0ZSA9IHJlcXVpcmUgJy4vc3RhdGUnXG5cbmJlZm9yZUNvbW1hbmQgPSAoZXZlbnQpIC0+XG4gIFN0YXRlLmJlZm9yZUNvbW1hbmQoZXZlbnQpXG5cbmFmdGVyQ29tbWFuZCA9IChldmVudCkgLT5cbiAgTWFyay5kZWFjdGl2YXRlUGVuZGluZygpXG5cbiAgaWYgU3RhdGUueWFua0NvbXBsZXRlKClcbiAgICBlbWFjc0VkaXRvciA9IGdldEVkaXRvcihldmVudClcbiAgICBmb3IgZW1hY3NDdXJzb3IgaW4gZW1hY3NFZGl0b3IuZ2V0RW1hY3NDdXJzb3JzKClcbiAgICAgIGVtYWNzQ3Vyc29yLnlhbmtDb21wbGV0ZSgpXG5cbiAgU3RhdGUuYWZ0ZXJDb21tYW5kKGV2ZW50KVxuXG5nZXRFZGl0b3IgPSAoZXZlbnQpIC0+XG4gICMgR2V0IGVkaXRvciBmcm9tIHRoZSBldmVudCBpZiBwb3NzaWJsZSBzbyB3ZSBjYW4gdGFyZ2V0IG1pbmktZWRpdG9ycy5cbiAgZWRpdG9yID0gZXZlbnQudGFyZ2V0Py5jbG9zZXN0KCdhdG9tLXRleHQtZWRpdG9yJyk/LmdldE1vZGVsPygpID8gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gIEVtYWNzRWRpdG9yLmZvcihlZGl0b3IpXG5cbmZpbmRGaWxlID0gKGV2ZW50KSAtPlxuICBoYXZlQU9GID0gYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VMb2FkZWQoJ2FkdmFuY2VkLW9wZW4tZmlsZScpXG4gIHVzZUFPRiA9IGF0b20uY29uZmlnLmdldCgnYXRvbWljLWVtYWNzLnVzZUFkdmFuY2VkT3BlbkZpbGUnKVxuICBpZiBoYXZlQU9GIGFuZCB1c2VBT0ZcbiAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGV2ZW50LnRhcmdldCwgJ2FkdmFuY2VkLW9wZW4tZmlsZTp0b2dnbGUnKVxuICBlbHNlXG4gICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChldmVudC50YXJnZXQsICdmdXp6eS1maW5kZXI6dG9nZ2xlLWZpbGUtZmluZGVyJylcblxuY2xvc2VPdGhlclBhbmVzID0gKGV2ZW50KSAtPlxuICBjb250YWluZXIgPSBhdG9tLndvcmtzcGFjZS5nZXRQYW5lQ29udGFpbmVycygpLmZpbmQoKGMpID0+IGMuZ2V0TG9jYXRpb24oKSA9PSAnY2VudGVyJylcbiAgYWN0aXZlUGFuZSA9IGNvbnRhaW5lcj8uZ2V0QWN0aXZlUGFuZSgpXG4gIHJldHVybiBpZiBub3QgYWN0aXZlUGFuZT9cbiAgZm9yIHBhbmUgaW4gY29udGFpbmVyLmdldFBhbmVzKClcbiAgICB1bmxlc3MgcGFuZSBpcyBhY3RpdmVQYW5lXG4gICAgICBwYW5lLmNsb3NlKClcblxubW9kdWxlLmV4cG9ydHMgPVxuICBFbWFjc0N1cnNvcjogRW1hY3NDdXJzb3JcbiAgRW1hY3NFZGl0b3I6IEVtYWNzRWRpdG9yXG4gIEtpbGxSaW5nOiBLaWxsUmluZ1xuICBNYXJrOiBNYXJrXG4gIFNlYXJjaE1hbmFnZXI6IFNlYXJjaE1hbmFnZXJcbiAgU3RhdGU6IFN0YXRlXG5cbiAgY29uZmlnOlxuICAgIHVzZUFkdmFuY2VkT3BlbkZpbGU6XG4gICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgdGl0bGU6ICdVc2UgYWR2YW5jZWQtb3Blbi1maWxlIGZvciBmaW5kLWZpbGUgaWYgYXZhaWxhYmxlJ1xuICAgIGFsd2F5c1VzZUtpbGxSaW5nOlxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgICB0aXRsZTogJ1VzZSBraWxsIHJpbmcgZm9yIGJ1aWx0LWluIGNvcHkgJiBjdXQgY29tbWFuZHMnXG4gICAga2lsbFRvQ2xpcGJvYXJkOlxuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgIHRpdGxlOiAnU2VuZCBraWxscyB0byB0aGUgc3lzdGVtIGNsaXBib2FyZCdcbiAgICB5YW5rRnJvbUNsaXBib2FyZDpcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgICAgdGl0bGU6ICdZYW5rIGNoYW5nZWQgdGV4dCBmcm9tIHRoZSBzeXN0ZW0gY2xpcGJvYXJkJ1xuICAgIGtpbGxXaG9sZUxpbmU6XG4gICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgIHRpdGxlOiAnQWx3YXlzIEtpbGwgd2hvbGUgbGluZS4nXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgaWYgQGRpc3Bvc2FibGVcbiAgICAgIGNvbnNvbGUubG9nIFwiYXRvbWljLWVtYWNzIGFjdGl2YXRlZCB0d2ljZSAtLSBhYm9ydGluZ1wiXG4gICAgICByZXR1cm5cblxuICAgIFN0YXRlLmluaXRpYWxpemUoKVxuICAgIEBzZWFyY2ggPSBuZXcgU2VhcmNoTWFuYWdlcihwbHVnaW46IEApXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2F0b20td29ya3NwYWNlJylbMF0/LmNsYXNzTGlzdD8uYWRkKCdhdG9taWMtZW1hY3MnKVxuICAgIEBkaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAZGlzcG9zYWJsZS5hZGQgYXRvbS5jb21tYW5kcy5vbldpbGxEaXNwYXRjaCAoZXZlbnQpIC0+IGJlZm9yZUNvbW1hbmQoZXZlbnQpXG4gICAgQGRpc3Bvc2FibGUuYWRkIGF0b20uY29tbWFuZHMub25EaWREaXNwYXRjaCAoZXZlbnQpIC0+IGFmdGVyQ29tbWFuZChldmVudClcbiAgICBAZGlzcG9zYWJsZS5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20tdGV4dC1lZGl0b3InLFxuICAgICAgIyBOYXZpZ2F0aW9uXG4gICAgICBcImF0b21pYy1lbWFjczpiYWNrd2FyZC1jaGFyXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5iYWNrd2FyZENoYXIoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6Zm9yd2FyZC1jaGFyXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5mb3J3YXJkQ2hhcigpXG4gICAgICBcImF0b21pYy1lbWFjczpiYWNrd2FyZC13b3JkXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5iYWNrd2FyZFdvcmQoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6Zm9yd2FyZC13b3JkXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5mb3J3YXJkV29yZCgpXG4gICAgICBcImF0b21pYy1lbWFjczpiYWNrd2FyZC1zZXhwXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5iYWNrd2FyZFNleHAoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6Zm9yd2FyZC1zZXhwXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5mb3J3YXJkU2V4cCgpXG4gICAgICBcImF0b21pYy1lbWFjczpiYWNrd2FyZC1saXN0XCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5iYWNrd2FyZExpc3QoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6Zm9yd2FyZC1saXN0XCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5mb3J3YXJkTGlzdCgpXG4gICAgICBcImF0b21pYy1lbWFjczpwcmV2aW91cy1saW5lXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5wcmV2aW91c0xpbmUoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6bmV4dC1saW5lXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5uZXh0TGluZSgpXG4gICAgICBcImF0b21pYy1lbWFjczpiYWNrd2FyZC1wYXJhZ3JhcGhcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLmJhY2t3YXJkUGFyYWdyYXBoKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOmZvcndhcmQtcGFyYWdyYXBoXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5mb3J3YXJkUGFyYWdyYXBoKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOmJhY2stdG8taW5kZW50YXRpb25cIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLmJhY2tUb0luZGVudGF0aW9uKClcblxuICAgICAgIyBLaWxsaW5nICYgWWFua2luZ1xuICAgICAgXCJhdG9taWMtZW1hY3M6YmFja3dhcmQta2lsbC13b3JkXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5iYWNrd2FyZEtpbGxXb3JkKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOmtpbGwtd29yZFwiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkua2lsbFdvcmQoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6a2lsbC1saW5lXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5raWxsTGluZSgpXG4gICAgICBcImF0b21pYy1lbWFjczpraWxsLXJlZ2lvblwiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkua2lsbFJlZ2lvbigpXG4gICAgICBcImF0b21pYy1lbWFjczpjb3B5LXJlZ2lvbi1hcy1raWxsXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5jb3B5UmVnaW9uQXNLaWxsKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOmFwcGVuZC1uZXh0LWtpbGxcIjogKGV2ZW50KSAtPiBTdGF0ZS5raWxsZWQoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6eWFua1wiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkueWFuaygpXG4gICAgICBcImF0b21pYy1lbWFjczp5YW5rLXBvcFwiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkueWFua1BvcCgpXG4gICAgICBcImF0b21pYy1lbWFjczp5YW5rLXNoaWZ0XCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS55YW5rU2hpZnQoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6Y3V0XCI6IChldmVudCkgLT5cbiAgICAgICAgaWYgYXRvbS5jb25maWcuZ2V0KCdhdG9taWMtZW1hY3MuYWx3YXlzVXNlS2lsbFJpbmcnKVxuICAgICAgICAgIGdldEVkaXRvcihldmVudCkua2lsbFJlZ2lvbigpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBldmVudC5hYm9ydEtleUJpbmRpbmcoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6Y29weVwiOiAoZXZlbnQpIC0+XG4gICAgICAgIGlmIGF0b20uY29uZmlnLmdldCgnYXRvbWljLWVtYWNzLmFsd2F5c1VzZUtpbGxSaW5nJylcbiAgICAgICAgICBnZXRFZGl0b3IoZXZlbnQpLmNvcHlSZWdpb25Bc0tpbGwoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgZXZlbnQuYWJvcnRLZXlCaW5kaW5nKClcblxuICAgICAgIyBFZGl0aW5nXG4gICAgICBcImF0b21pYy1lbWFjczpkZWxldGUtaG9yaXpvbnRhbC1zcGFjZVwiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkuZGVsZXRlSG9yaXpvbnRhbFNwYWNlKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOmRlbGV0ZS1pbmRlbnRhdGlvblwiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkuZGVsZXRlSW5kZW50YXRpb24oKVxuICAgICAgXCJhdG9taWMtZW1hY3M6b3Blbi1saW5lXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5vcGVuTGluZSgpXG4gICAgICBcImF0b21pYy1lbWFjczpqdXN0LW9uZS1zcGFjZVwiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkuanVzdE9uZVNwYWNlKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOmRlbGV0ZS1ibGFuay1saW5lc1wiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkuZGVsZXRlQmxhbmtMaW5lcygpXG4gICAgICBcImF0b21pYy1lbWFjczp0cmFuc3Bvc2UtY2hhcnNcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLnRyYW5zcG9zZUNoYXJzKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOnRyYW5zcG9zZS1saW5lc1wiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkudHJhbnNwb3NlTGluZXMoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6dHJhbnNwb3NlLXNleHBzXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS50cmFuc3Bvc2VTZXhwcygpXG4gICAgICBcImF0b21pYy1lbWFjczp0cmFuc3Bvc2Utd29yZHNcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLnRyYW5zcG9zZVdvcmRzKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOmRvd25jYXNlLXdvcmQtb3ItcmVnaW9uXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5kb3duY2FzZVdvcmRPclJlZ2lvbigpXG4gICAgICBcImF0b21pYy1lbWFjczp1cGNhc2Utd29yZC1vci1yZWdpb25cIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLnVwY2FzZVdvcmRPclJlZ2lvbigpXG4gICAgICBcImF0b21pYy1lbWFjczpjYXBpdGFsaXplLXdvcmQtb3ItcmVnaW9uXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5jYXBpdGFsaXplV29yZE9yUmVnaW9uKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOmRhYmJyZXYtZXhwYW5kXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5kYWJicmV2RXhwYW5kKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOmRhYmJyZXYtcHJldmlvdXNcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLmRhYmJyZXZQcmV2aW91cygpXG5cbiAgICAgICMgU2VhcmNoaW5nXG4gICAgICBcImF0b21pYy1lbWFjczppc2VhcmNoLWZvcndhcmRcIjogKGV2ZW50KSA9PiBAc2VhcmNoLnN0YXJ0KGdldEVkaXRvcihldmVudCksIGRpcmVjdGlvbjogJ2ZvcndhcmQnKVxuICAgICAgXCJhdG9taWMtZW1hY3M6aXNlYXJjaC1iYWNrd2FyZFwiOiAoZXZlbnQpID0+IEBzZWFyY2guc3RhcnQoZ2V0RWRpdG9yKGV2ZW50KSwgZGlyZWN0aW9uOiAnYmFja3dhcmQnKVxuXG4gICAgICAjIE1hcmtpbmcgJiBTZWxlY3RpbmdcbiAgICAgIFwiYXRvbWljLWVtYWNzOnNldC1tYXJrXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5zZXRNYXJrKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOm1hcmstc2V4cFwiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkubWFya1NleHAoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6bWFyay13aG9sZS1idWZmZXJcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLm1hcmtXaG9sZUJ1ZmZlcigpXG4gICAgICBcImF0b21pYy1lbWFjczpleGNoYW5nZS1wb2ludC1hbmQtbWFya1wiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkuZXhjaGFuZ2VQb2ludEFuZE1hcmsoKVxuXG4gICAgICAjIFNjcm9sbGluZ1xuICAgICAgXCJhdG9taWMtZW1hY3M6cmVjZW50ZXItdG9wLWJvdHRvbVwiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkucmVjZW50ZXJUb3BCb3R0b20oKVxuICAgICAgXCJhdG9taWMtZW1hY3M6c2Nyb2xsLWRvd25cIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLnNjcm9sbERvd24oKVxuICAgICAgXCJhdG9taWMtZW1hY3M6c2Nyb2xsLXVwXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5zY3JvbGxVcCgpXG5cbiAgICAgICMgVUlcbiAgICAgIFwiY29yZTpjYW5jZWxcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLmtleWJvYXJkUXVpdCgpXG5cbiAgICBAZGlzcG9zYWJsZS5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJy5hdG9taWMtZW1hY3Muc2VhcmNoIGF0b20tdGV4dC1lZGl0b3InLFxuICAgICAgXCJhdG9taWMtZW1hY3M6aXNlYXJjaC1leGl0XCI6IChldmVudCkgPT4gQHNlYXJjaC5leGl0KClcbiAgICAgIFwiYXRvbWljLWVtYWNzOmlzZWFyY2gtY2FuY2VsXCI6IChldmVudCkgPT4gQHNlYXJjaC5jYW5jZWwoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6aXNlYXJjaC1yZXBlYXQtZm9yd2FyZFwiOiAoZXZlbnQpID0+IEBzZWFyY2gucmVwZWF0KCdmb3J3YXJkJylcbiAgICAgIFwiYXRvbWljLWVtYWNzOmlzZWFyY2gtcmVwZWF0LWJhY2t3YXJkXCI6IChldmVudCkgPT4gQHNlYXJjaC5yZXBlYXQoJ2JhY2t3YXJkJylcbiAgICAgIFwiYXRvbWljLWVtYWNzOmlzZWFyY2gtdG9nZ2xlLWNhc2UtZm9sZFwiOiAoZXZlbnQpID0+IEBzZWFyY2gudG9nZ2xlQ2FzZVNlbnNpdGl2aXR5KClcbiAgICAgIFwiYXRvbWljLWVtYWNzOmlzZWFyY2gtdG9nZ2xlLXJlZ2V4cFwiOiAoZXZlbnQpID0+IEBzZWFyY2gudG9nZ2xlSXNSZWdFeHAoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6aXNlYXJjaC15YW5rLXdvcmQtb3ItY2hhcmFjdGVyXCI6IChldmVudCkgPT4gQHNlYXJjaC55YW5rV29yZE9yQ2hhcmFjdGVyKClcblxuICAgIEBkaXNwb3NhYmxlLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLFxuICAgICAgXCJhdG9taWMtZW1hY3M6ZmluZC1maWxlXCI6IChldmVudCkgLT4gZmluZEZpbGUoZXZlbnQpXG4gICAgICBcImF0b21pYy1lbWFjczpjbG9zZS1vdGhlci1wYW5lc1wiOiAoZXZlbnQpIC0+IGNsb3NlT3RoZXJQYW5lcyhldmVudClcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdhdG9tLXdvcmtzcGFjZScpWzBdPy5jbGFzc0xpc3Q/LnJlbW92ZSgnYXRvbWljLWVtYWNzJylcbiAgICBAZGlzcG9zYWJsZT8uZGlzcG9zZSgpXG4gICAgQGRpc3Bvc2FibGUgPSBudWxsXG4gICAgS2lsbFJpbmcuZ2xvYmFsLnJlc2V0KClcbiAgICBAc2VhcmNoLmRlc3Ryb3koKVxuXG4gIGNvbnN1bWVFbGVtZW50SWNvbnM6IChAYWRkSWNvblRvRWxlbWVudCkgLT5cblxuICBzZXJ2aWNlXzBfMTM6IC0+XG4gICAgc3RhdGU6IFN0YXRlXG4gICAgc2VhcmNoOiBAc2VhcmNoXG4gICAgZWRpdG9yOiAoYXRvbUVkaXRvcikgLT4gRW1hY3NFZGl0b3IuZm9yKGF0b21FZGl0b3IpXG4gICAgY3Vyc29yOiAoYXRvbUN1cnNvcikgLT4gQGVkaXRvcihhdG9tQ3Vyc29yLmVkaXRvcikuZ2V0RW1hY3NDdXJzb3JGb3IoYXRvbUN1cnNvcilcbiAgICBnZXRFZGl0b3I6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KVxuIl19
