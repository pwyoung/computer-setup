(function() {
  var $, CompositeDisposable, Emitter, InputDialog, PlatformIOTerminalView, Pty, Task, Terminal, View, lastActiveElement, lastOpenedView, os, path, ref, ref1,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom'), Task = ref.Task, CompositeDisposable = ref.CompositeDisposable, Emitter = ref.Emitter;

  ref1 = require('atom-space-pen-views'), $ = ref1.$, View = ref1.View;

  Pty = require.resolve('./process');

  Terminal = require('term.js');

  InputDialog = null;

  path = require('path');

  os = require('os');

  lastOpenedView = null;

  lastActiveElement = null;

  module.exports = PlatformIOTerminalView = (function(superClass) {
    extend(PlatformIOTerminalView, superClass);

    function PlatformIOTerminalView() {
      this.blurTerminal = bind(this.blurTerminal, this);
      this.focusTerminal = bind(this.focusTerminal, this);
      this.blur = bind(this.blur, this);
      this.focus = bind(this.focus, this);
      this.resizePanel = bind(this.resizePanel, this);
      this.resizeStopped = bind(this.resizeStopped, this);
      this.resizeStarted = bind(this.resizeStarted, this);
      this.onWindowResize = bind(this.onWindowResize, this);
      this.hide = bind(this.hide, this);
      this.open = bind(this.open, this);
      this.recieveItemOrFile = bind(this.recieveItemOrFile, this);
      this.updateToolbarVisibility = bind(this.updateToolbarVisibility, this);
      this.setAnimationSpeed = bind(this.setAnimationSpeed, this);
      return PlatformIOTerminalView.__super__.constructor.apply(this, arguments);
    }

    PlatformIOTerminalView.prototype.animating = false;

    PlatformIOTerminalView.prototype.id = '';

    PlatformIOTerminalView.prototype.maximized = false;

    PlatformIOTerminalView.prototype.opened = false;

    PlatformIOTerminalView.prototype.pwd = '';

    PlatformIOTerminalView.prototype.windowHeight = $(window).height();

    PlatformIOTerminalView.prototype.rowHeight = 20;

    PlatformIOTerminalView.prototype.shell = '';

    PlatformIOTerminalView.prototype.tabView = false;

    PlatformIOTerminalView.content = function() {
      return this.div({
        "class": 'platformio-ide-terminal terminal-view',
        outlet: 'platformIOTerminalView'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'panel-divider',
            outlet: 'panelDivider'
          });
          _this.section({
            "class": 'input-block'
          }, function() {
            return _this.div({
              outlet: 'toolbar',
              "class": 'btn-toolbar'
            }, function() {
              _this.div({
                "class": 'btn-group'
              }, function() {
                return _this.button({
                  outlet: 'inputBtn',
                  "class": 'btn icon icon-keyboard',
                  click: 'inputDialog'
                });
              });
              return _this.div({
                "class": 'btn-group right'
              }, function() {
                _this.button({
                  outlet: 'hideBtn',
                  "class": 'btn icon icon-chevron-down',
                  click: 'hide'
                });
                _this.button({
                  outlet: 'maximizeBtn',
                  "class": 'btn icon icon-screen-full',
                  click: 'maximize'
                });
                return _this.button({
                  outlet: 'closeBtn',
                  "class": 'btn icon icon-x',
                  click: 'destroy'
                });
              });
            });
          });
          return _this.div({
            "class": 'xterm',
            outlet: 'xterm'
          });
        };
      })(this));
    };

    PlatformIOTerminalView.getFocusedTerminal = function() {
      return Terminal.Terminal.focus;
    };

    PlatformIOTerminalView.prototype.initialize = function(id, pwd, statusIcon, statusBar, shell, args, env, autoRun) {
      var bottomHeight, override, percent;
      this.id = id;
      this.pwd = pwd;
      this.statusIcon = statusIcon;
      this.statusBar = statusBar;
      this.shell = shell;
      this.args = args != null ? args : [];
      this.env = env != null ? env : {};
      this.autoRun = autoRun != null ? autoRun : [];
      this.subscriptions = new CompositeDisposable;
      this.emitter = new Emitter;
      this.subscriptions.add(atom.tooltips.add(this.closeBtn, {
        title: 'Close'
      }));
      this.subscriptions.add(atom.tooltips.add(this.hideBtn, {
        title: 'Hide'
      }));
      this.subscriptions.add(this.maximizeBtn.tooltip = atom.tooltips.add(this.maximizeBtn, {
        title: 'Fullscreen'
      }));
      this.inputBtn.tooltip = atom.tooltips.add(this.inputBtn, {
        title: 'Insert Text'
      });
      this.prevHeight = atom.config.get('platformio-ide-terminal.style.defaultPanelHeight');
      if (this.prevHeight.indexOf('%') > 0) {
        percent = Math.abs(Math.min(parseFloat(this.prevHeight) / 100.0, 1));
        bottomHeight = $('atom-panel.bottom').children(".terminal-view").height() || 0;
        this.prevHeight = percent * ($('.item-views').height() + bottomHeight);
      }
      this.xterm.height(0);
      this.setAnimationSpeed();
      this.subscriptions.add(atom.config.onDidChange('platformio-ide-terminal.style.animationSpeed', this.setAnimationSpeed));
      this.updateToolbarVisibility();
      this.subscriptions.add(atom.config.onDidChange('platformio-ide-terminal.toggles.showToolbar', this.updateToolbarVisibility));
      override = function(event) {
        if (event.originalEvent.dataTransfer.getData('platformio-ide-terminal') === 'true') {
          return;
        }
        event.preventDefault();
        return event.stopPropagation();
      };
      this.xterm.on('mouseup', (function(_this) {
        return function(event) {
          var lines, rawLines, text;
          if (event.which !== 3) {
            text = window.getSelection().toString();
            if (atom.config.get('platformio-ide-terminal.toggles.selectToCopy') && text) {
              rawLines = text.split(/\r?\n/g);
              lines = rawLines.map(function(line) {
                return line.replace(/\s/g, " ").trimRight();
              });
              text = lines.join("\n");
              atom.clipboard.write(text);
            }
            if (!text) {
              return _this.focus();
            }
          }
        };
      })(this));
      this.xterm.on('dragenter', override);
      this.xterm.on('dragover', override);
      this.xterm.on('drop', this.recieveItemOrFile);
      this.on('focus', this.focus);
      this.subscriptions.add({
        dispose: (function(_this) {
          return function() {
            return _this.off('focus', _this.focus);
          };
        })(this)
      });
      if (/zsh|bash/.test(this.shell) && this.args.indexOf('--login') === -1 && Pty.platform !== 'win32' && atom.config.get('platformio-ide-terminal.toggles.loginShell')) {
        return this.args.unshift('--login');
      }
    };

    PlatformIOTerminalView.prototype.attach = function() {
      if (this.panel != null) {
        return;
      }
      return this.panel = atom.workspace.addBottomPanel({
        item: this,
        visible: false
      });
    };

    PlatformIOTerminalView.prototype.setAnimationSpeed = function() {
      this.animationSpeed = atom.config.get('platformio-ide-terminal.style.animationSpeed');
      if (this.animationSpeed === 0) {
        this.animationSpeed = 100;
      }
      return this.xterm.css('transition', "height " + (0.25 / this.animationSpeed) + "s linear");
    };

    PlatformIOTerminalView.prototype.updateToolbarVisibility = function() {
      this.showToolbar = atom.config.get('platformio-ide-terminal.toggles.showToolbar');
      if (this.showToolbar) {
        return this.toolbar.css('display', 'block');
      } else {
        return this.toolbar.css('display', 'none');
      }
    };

    PlatformIOTerminalView.prototype.recieveItemOrFile = function(event) {
      var dataTransfer, file, filePath, i, len, ref2, results;
      event.preventDefault();
      event.stopPropagation();
      dataTransfer = event.originalEvent.dataTransfer;
      if (dataTransfer.getData('atom-event') === 'true') {
        filePath = dataTransfer.getData('text/plain');
        if (filePath) {
          return this.input(filePath + " ");
        }
      } else if (filePath = dataTransfer.getData('initialPath')) {
        return this.input(filePath + " ");
      } else if (dataTransfer.files.length > 0) {
        ref2 = dataTransfer.files;
        results = [];
        for (i = 0, len = ref2.length; i < len; i++) {
          file = ref2[i];
          results.push(this.input(file.path + " "));
        }
        return results;
      }
    };

    PlatformIOTerminalView.prototype.forkPtyProcess = function() {
      return Task.once(Pty, path.resolve(this.pwd), this.shell, this.args, this.env, (function(_this) {
        return function() {
          _this.input = function() {};
          return _this.resize = function() {};
        };
      })(this));
    };

    PlatformIOTerminalView.prototype.getId = function() {
      return this.id;
    };

    PlatformIOTerminalView.prototype.displayTerminal = function() {
      var cols, ref2, rows;
      ref2 = this.getDimensions(), cols = ref2.cols, rows = ref2.rows;
      this.ptyProcess = this.forkPtyProcess();
      this.terminal = new Terminal({
        cursorBlink: false,
        scrollback: atom.config.get('platformio-ide-terminal.core.scrollback'),
        cols: cols,
        rows: rows
      });
      this.attachListeners();
      this.attachResizeEvents();
      this.attachWindowEvents();
      return this.terminal.open(this.xterm.get(0));
    };

    PlatformIOTerminalView.prototype.attachListeners = function() {
      this.ptyProcess.on("platformio-ide-terminal:data", (function(_this) {
        return function(data) {
          return _this.terminal.write(data);
        };
      })(this));
      this.ptyProcess.on("platformio-ide-terminal:exit", (function(_this) {
        return function() {
          if (atom.config.get('platformio-ide-terminal.toggles.autoClose')) {
            return _this.destroy();
          }
        };
      })(this));
      this.terminal.end = (function(_this) {
        return function() {
          return _this.destroy();
        };
      })(this);
      this.terminal.on("data", (function(_this) {
        return function(data) {
          return _this.input(data);
        };
      })(this));
      this.ptyProcess.on("platformio-ide-terminal:title", (function(_this) {
        return function(title) {
          return _this.process = title;
        };
      })(this));
      this.terminal.on("title", (function(_this) {
        return function(title) {
          return _this.title = title;
        };
      })(this));
      return this.terminal.once("open", (function(_this) {
        return function() {
          var autoRunCommand, command, i, len, ref2, results;
          _this.applyStyle();
          _this.resizeTerminalToView();
          if (_this.ptyProcess.childProcess == null) {
            return;
          }
          autoRunCommand = atom.config.get('platformio-ide-terminal.core.autoRunCommand');
          if (autoRunCommand) {
            _this.input("" + autoRunCommand + os.EOL);
          }
          ref2 = _this.autoRun;
          results = [];
          for (i = 0, len = ref2.length; i < len; i++) {
            command = ref2[i];
            results.push(_this.input("" + command + os.EOL));
          }
          return results;
        };
      })(this));
    };

    PlatformIOTerminalView.prototype.destroy = function() {
      var ref2, ref3;
      this.subscriptions.dispose();
      this.statusIcon.destroy();
      this.statusBar.removeTerminalView(this);
      this.detachResizeEvents();
      this.detachWindowEvents();
      if (this.panel.isVisible()) {
        this.hide();
        this.onTransitionEnd((function(_this) {
          return function() {
            return _this.panel.destroy();
          };
        })(this));
      } else {
        this.panel.destroy();
      }
      if (this.statusIcon && this.statusIcon.parentNode) {
        this.statusIcon.parentNode.removeChild(this.statusIcon);
      }
      if ((ref2 = this.ptyProcess) != null) {
        ref2.terminate();
      }
      return (ref3 = this.terminal) != null ? ref3.destroy() : void 0;
    };

    PlatformIOTerminalView.prototype.maximize = function() {
      var btn;
      this.subscriptions.remove(this.maximizeBtn.tooltip);
      this.maximizeBtn.tooltip.dispose();
      this.maxHeight = this.prevHeight + atom.workspace.getCenter().paneContainer.element.offsetHeight;
      btn = this.maximizeBtn.children('span');
      this.onTransitionEnd((function(_this) {
        return function() {
          return _this.focus();
        };
      })(this));
      if (this.maximized) {
        this.maximizeBtn.tooltip = atom.tooltips.add(this.maximizeBtn, {
          title: 'Fullscreen'
        });
        this.subscriptions.add(this.maximizeBtn.tooltip);
        this.adjustHeight(this.prevHeight);
        btn.removeClass('icon-screen-normal').addClass('icon-screen-full');
        return this.maximized = false;
      } else {
        this.maximizeBtn.tooltip = atom.tooltips.add(this.maximizeBtn, {
          title: 'Normal'
        });
        this.subscriptions.add(this.maximizeBtn.tooltip);
        this.adjustHeight(this.maxHeight);
        btn.removeClass('icon-screen-full').addClass('icon-screen-normal');
        return this.maximized = true;
      }
    };

    PlatformIOTerminalView.prototype.open = function() {
      var icon;
      if (lastActiveElement == null) {
        lastActiveElement = $(document.activeElement);
      }
      if (lastOpenedView && lastOpenedView !== this) {
        if (lastOpenedView.maximized) {
          this.subscriptions.remove(this.maximizeBtn.tooltip);
          this.maximizeBtn.tooltip.dispose();
          icon = this.maximizeBtn.children('span');
          this.maxHeight = lastOpenedView.maxHeight;
          this.maximizeBtn.tooltip = atom.tooltips.add(this.maximizeBtn, {
            title: 'Normal'
          });
          this.subscriptions.add(this.maximizeBtn.tooltip);
          icon.removeClass('icon-screen-full').addClass('icon-screen-normal');
          this.maximized = true;
        }
        lastOpenedView.hide();
      }
      lastOpenedView = this;
      this.statusBar.setActiveTerminalView(this);
      this.statusIcon.activate();
      this.onTransitionEnd((function(_this) {
        return function() {
          if (!_this.opened) {
            _this.opened = true;
            _this.displayTerminal();
            _this.prevHeight = _this.nearestRow(_this.xterm.height());
            _this.xterm.height(_this.prevHeight);
            return _this.emit("platformio-ide-terminal:terminal-open");
          } else {
            return _this.focus();
          }
        };
      })(this));
      this.panel.show();
      this.xterm.height(0);
      this.animating = true;
      return this.xterm.height(this.maximized ? this.maxHeight : this.prevHeight);
    };

    PlatformIOTerminalView.prototype.hide = function() {
      var ref2;
      if ((ref2 = this.terminal) != null) {
        ref2.blur();
      }
      lastOpenedView = null;
      this.statusIcon.deactivate();
      this.onTransitionEnd((function(_this) {
        return function() {
          _this.panel.hide();
          if (lastOpenedView == null) {
            if (lastActiveElement != null) {
              lastActiveElement.focus();
              return lastActiveElement = null;
            }
          }
        };
      })(this));
      this.xterm.height(this.maximized ? this.maxHeight : this.prevHeight);
      this.animating = true;
      return this.xterm.height(0);
    };

    PlatformIOTerminalView.prototype.toggle = function() {
      if (this.animating) {
        return;
      }
      if (this.panel.isVisible()) {
        return this.hide();
      } else {
        return this.open();
      }
    };

    PlatformIOTerminalView.prototype.input = function(data) {
      if (this.ptyProcess.childProcess == null) {
        return;
      }
      this.terminal.stopScrolling();
      return this.ptyProcess.send({
        event: 'input',
        text: data
      });
    };

    PlatformIOTerminalView.prototype.resize = function(cols, rows) {
      if (this.ptyProcess.childProcess == null) {
        return;
      }
      return this.ptyProcess.send({
        event: 'resize',
        rows: rows,
        cols: cols
      });
    };

    PlatformIOTerminalView.prototype.pty = function() {
      var wait;
      if (!this.opened) {
        wait = new Promise((function(_this) {
          return function(resolve, reject) {
            _this.emitter.on("platformio-ide-terminal:terminal-open", function() {
              return resolve();
            });
            return setTimeout(reject, 1000);
          };
        })(this));
        return wait.then((function(_this) {
          return function() {
            return _this.ptyPromise();
          };
        })(this));
      } else {
        return this.ptyPromise();
      }
    };

    PlatformIOTerminalView.prototype.ptyPromise = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          if (_this.ptyProcess != null) {
            _this.ptyProcess.on("platformio-ide-terminal:pty", function(pty) {
              return resolve(pty);
            });
            _this.ptyProcess.send({
              event: 'pty'
            });
            return setTimeout(reject, 1000);
          } else {
            return reject();
          }
        };
      })(this));
    };

    PlatformIOTerminalView.prototype.applyStyle = function() {
      var config, defaultFont, editorFont, editorFontSize, overrideFont, overrideFontSize, ref2, ref3;
      config = atom.config.get('platformio-ide-terminal');
      this.xterm.addClass(config.style.theme);
      this.subscriptions.add(atom.config.onDidChange('platformio-ide-terminal.style.theme', (function(_this) {
        return function(event) {
          _this.xterm.removeClass(event.oldValue);
          return _this.xterm.addClass(event.newValue);
        };
      })(this)));
      if (config.toggles.cursorBlink) {
        this.xterm.addClass('cursor-blink');
      }
      editorFont = atom.config.get('editor.fontFamily');
      defaultFont = "Menlo, Consolas, 'DejaVu Sans Mono', monospace";
      overrideFont = config.style.fontFamily;
      this.terminal.element.style.fontFamily = overrideFont || editorFont || defaultFont;
      this.subscriptions.add(atom.config.onDidChange('editor.fontFamily', (function(_this) {
        return function(event) {
          editorFont = event.newValue;
          return _this.terminal.element.style.fontFamily = overrideFont || editorFont || defaultFont;
        };
      })(this)));
      this.subscriptions.add(atom.config.onDidChange('platformio-ide-terminal.style.fontFamily', (function(_this) {
        return function(event) {
          overrideFont = event.newValue;
          return _this.terminal.element.style.fontFamily = overrideFont || editorFont || defaultFont;
        };
      })(this)));
      editorFontSize = atom.config.get('editor.fontSize');
      overrideFontSize = config.style.fontSize;
      this.terminal.element.style.fontSize = (overrideFontSize || editorFontSize) + "px";
      this.subscriptions.add(atom.config.onDidChange('editor.fontSize', (function(_this) {
        return function(event) {
          editorFontSize = event.newValue;
          _this.terminal.element.style.fontSize = (overrideFontSize || editorFontSize) + "px";
          return _this.resizeTerminalToView();
        };
      })(this)));
      this.subscriptions.add(atom.config.onDidChange('platformio-ide-terminal.style.fontSize', (function(_this) {
        return function(event) {
          overrideFontSize = event.newValue;
          _this.terminal.element.style.fontSize = (overrideFontSize || editorFontSize) + "px";
          return _this.resizeTerminalToView();
        };
      })(this)));
      [].splice.apply(this.terminal.colors, [0, 8].concat(ref2 = [config.ansiColors.normal.black.toHexString(), config.ansiColors.normal.red.toHexString(), config.ansiColors.normal.green.toHexString(), config.ansiColors.normal.yellow.toHexString(), config.ansiColors.normal.blue.toHexString(), config.ansiColors.normal.magenta.toHexString(), config.ansiColors.normal.cyan.toHexString(), config.ansiColors.normal.white.toHexString()])), ref2;
      return ([].splice.apply(this.terminal.colors, [8, 8].concat(ref3 = [config.ansiColors.zBright.brightBlack.toHexString(), config.ansiColors.zBright.brightRed.toHexString(), config.ansiColors.zBright.brightGreen.toHexString(), config.ansiColors.zBright.brightYellow.toHexString(), config.ansiColors.zBright.brightBlue.toHexString(), config.ansiColors.zBright.brightMagenta.toHexString(), config.ansiColors.zBright.brightCyan.toHexString(), config.ansiColors.zBright.brightWhite.toHexString()])), ref3);
    };

    PlatformIOTerminalView.prototype.attachWindowEvents = function() {
      return $(window).on('resize', this.onWindowResize);
    };

    PlatformIOTerminalView.prototype.detachWindowEvents = function() {
      return $(window).off('resize', this.onWindowResize);
    };

    PlatformIOTerminalView.prototype.attachResizeEvents = function() {
      return this.panelDivider.on('mousedown', this.resizeStarted);
    };

    PlatformIOTerminalView.prototype.detachResizeEvents = function() {
      return this.panelDivider.off('mousedown');
    };

    PlatformIOTerminalView.prototype.onWindowResize = function() {
      var bottomPanel, clamped, delta, newHeight, overflow;
      if (!this.tabView) {
        this.xterm.css('transition', '');
        newHeight = $(window).height();
        bottomPanel = $('atom-panel-container.bottom').first().get(0);
        overflow = bottomPanel.scrollHeight - bottomPanel.offsetHeight;
        delta = newHeight - this.windowHeight;
        this.windowHeight = newHeight;
        if (this.maximized) {
          clamped = Math.max(this.maxHeight + delta, this.rowHeight);
          if (this.panel.isVisible()) {
            this.adjustHeight(clamped);
          }
          this.maxHeight = clamped;
          this.prevHeight = Math.min(this.prevHeight, this.maxHeight);
        } else if (overflow > 0) {
          clamped = Math.max(this.nearestRow(this.prevHeight + delta), this.rowHeight);
          if (this.panel.isVisible()) {
            this.adjustHeight(clamped);
          }
          this.prevHeight = clamped;
        }
        this.xterm.css('transition', "height " + (0.25 / this.animationSpeed) + "s linear");
      }
      return this.resizeTerminalToView();
    };

    PlatformIOTerminalView.prototype.resizeStarted = function() {
      if (this.maximized) {
        return;
      }
      this.maxHeight = this.prevHeight + $('.item-views').height();
      $(document).on('mousemove', this.resizePanel);
      $(document).on('mouseup', this.resizeStopped);
      return this.xterm.css('transition', '');
    };

    PlatformIOTerminalView.prototype.resizeStopped = function() {
      $(document).off('mousemove', this.resizePanel);
      $(document).off('mouseup', this.resizeStopped);
      return this.xterm.css('transition', "height " + (0.25 / this.animationSpeed) + "s linear");
    };

    PlatformIOTerminalView.prototype.nearestRow = function(value) {
      var rows;
      rows = Math.floor(value / this.rowHeight);
      return rows * this.rowHeight;
    };

    PlatformIOTerminalView.prototype.resizePanel = function(event) {
      var clamped, delta, mouseY;
      if (event.which !== 1) {
        return this.resizeStopped();
      }
      mouseY = $(window).height() - event.pageY;
      delta = mouseY - $('atom-panel-container.bottom').height() - $('atom-panel-container.footer').height();
      if (!(Math.abs(delta) > (this.rowHeight * 5 / 6))) {
        return;
      }
      clamped = Math.max(this.nearestRow(this.prevHeight + delta), this.rowHeight);
      if (clamped > this.maxHeight) {
        return;
      }
      this.xterm.height(clamped);
      $(this.terminal.element).height(clamped);
      this.prevHeight = clamped;
      return this.resizeTerminalToView();
    };

    PlatformIOTerminalView.prototype.adjustHeight = function(height) {
      this.xterm.height(height);
      return $(this.terminal.element).height(height);
    };

    PlatformIOTerminalView.prototype.copy = function() {
      var lines, rawLines, rawText, text, textarea;
      if (this.terminal._selected) {
        textarea = this.terminal.getCopyTextarea();
        text = this.terminal.grabText(this.terminal._selected.x1, this.terminal._selected.x2, this.terminal._selected.y1, this.terminal._selected.y2);
      } else {
        rawText = this.terminal.context.getSelection().toString();
        rawLines = rawText.split(/\r?\n/g);
        lines = rawLines.map(function(line) {
          return line.replace(/\s/g, " ").trimRight();
        });
        text = lines.join("\n");
      }
      return atom.clipboard.write(text);
    };

    PlatformIOTerminalView.prototype.paste = function() {
      return this.input(atom.clipboard.read());
    };

    PlatformIOTerminalView.prototype.insertSelection = function(customText) {
      var cursor, editor, line, runCommand, selection, selectionText;
      if (!(editor = atom.workspace.getActiveTextEditor())) {
        return;
      }
      runCommand = atom.config.get('platformio-ide-terminal.toggles.runInsertedText');
      selectionText = '';
      if (selection = editor.getSelectedText()) {
        this.terminal.stopScrolling();
        selectionText = selection;
      } else if (cursor = editor.getCursorBufferPosition()) {
        line = editor.lineTextForBufferRow(cursor.row);
        this.terminal.stopScrolling();
        selectionText = line;
        editor.moveDown(1);
      }
      return this.input("" + (customText.replace(/\$L/, "" + (editor.getCursorBufferPosition().row + 1)).replace(/\$F/, path.basename(editor.buffer.getPath() ? editor.buffer.getPath() : '.')).replace(/\$D/, path.dirname(editor.buffer.getPath() ? editor.buffer.getPath() : '.')).replace(/\$S/, selectionText).replace(/\$\$/, '$')) + (runCommand ? os.EOL : ''));
    };

    PlatformIOTerminalView.prototype.focus = function(fromWindowEvent) {
      this.resizeTerminalToView();
      this.focusTerminal(fromWindowEvent);
      this.statusBar.setActiveTerminalView(this);
      return PlatformIOTerminalView.__super__.focus.call(this);
    };

    PlatformIOTerminalView.prototype.blur = function() {
      this.blurTerminal();
      return PlatformIOTerminalView.__super__.blur.call(this);
    };

    PlatformIOTerminalView.prototype.focusTerminal = function(fromWindowEvent) {
      if (!this.terminal) {
        return;
      }
      lastActiveElement = $(document.activeElement);
      if (fromWindowEvent && !(lastActiveElement.is('div.terminal') || lastActiveElement.parents('div.terminal').length)) {
        return;
      }
      this.terminal.focus();
      if (this.terminal._textarea) {
        return this.terminal._textarea.focus();
      } else {
        return this.terminal.element.focus();
      }
    };

    PlatformIOTerminalView.prototype.blurTerminal = function() {
      if (!this.terminal) {
        return;
      }
      this.terminal.blur();
      this.terminal.element.blur();
      if (lastActiveElement != null) {
        return lastActiveElement.focus();
      }
    };

    PlatformIOTerminalView.prototype.resizeTerminalToView = function() {
      var cols, ref2, rows;
      if (!(this.panel.isVisible() || this.tabView)) {
        return;
      }
      ref2 = this.getDimensions(), cols = ref2.cols, rows = ref2.rows;
      if (!(cols > 0 && rows > 0)) {
        return;
      }
      if (!this.terminal) {
        return;
      }
      if (this.terminal.rows === rows && this.terminal.cols === cols) {
        return;
      }
      this.resize(cols, rows);
      return this.terminal.resize(cols, rows);
    };

    PlatformIOTerminalView.prototype.getDimensions = function() {
      var cols, fakeCol, fakeRow, rows;
      fakeRow = $("<div><span>&nbsp;</span></div>");
      if (this.terminal) {
        this.find('.terminal').append(fakeRow);
        fakeCol = fakeRow.children().first()[0].getBoundingClientRect();
        cols = Math.floor(this.xterm.width() / (fakeCol.width || 9));
        rows = Math.floor(this.xterm.height() / (fakeCol.height || 20));
        this.rowHeight = fakeCol.height;
        fakeRow.remove();
      } else {
        cols = Math.floor(this.xterm.width() / 9);
        rows = Math.floor(this.xterm.height() / 20);
      }
      return {
        cols: cols,
        rows: rows
      };
    };

    PlatformIOTerminalView.prototype.onTransitionEnd = function(callback) {
      return this.xterm.one('webkitTransitionEnd', (function(_this) {
        return function() {
          callback();
          return _this.animating = false;
        };
      })(this));
    };

    PlatformIOTerminalView.prototype.inputDialog = function() {
      var dialog;
      if (InputDialog == null) {
        InputDialog = require('./input-dialog');
      }
      dialog = new InputDialog(this);
      return dialog.attach();
    };

    PlatformIOTerminalView.prototype.rename = function() {
      return this.statusIcon.rename();
    };

    PlatformIOTerminalView.prototype.toggleTabView = function() {
      if (this.tabView) {
        this.panel = atom.workspace.addBottomPanel({
          item: this,
          visible: false
        });
        this.attachResizeEvents();
        this.closeBtn.show();
        this.hideBtn.show();
        this.maximizeBtn.show();
        return this.tabView = false;
      } else {
        this.panel.destroy();
        this.detachResizeEvents();
        this.closeBtn.hide();
        this.hideBtn.hide();
        this.maximizeBtn.hide();
        this.xterm.css("height", "");
        this.tabView = true;
        if (lastOpenedView === this) {
          return lastOpenedView = null;
        }
      }
    };

    PlatformIOTerminalView.prototype.getTitle = function() {
      return this.statusIcon.getName() || "platformio-ide-terminal";
    };

    PlatformIOTerminalView.prototype.getIconName = function() {
      return "terminal";
    };

    PlatformIOTerminalView.prototype.getShell = function() {
      return path.basename(this.shell);
    };

    PlatformIOTerminalView.prototype.getShellPath = function() {
      return this.shell;
    };

    PlatformIOTerminalView.prototype.emit = function(event, data) {
      return this.emitter.emit(event, data);
    };

    PlatformIOTerminalView.prototype.onDidChangeTitle = function(callback) {
      return this.emitter.on('did-change-title', callback);
    };

    PlatformIOTerminalView.prototype.getPath = function() {
      return this.getTerminalTitle();
    };

    PlatformIOTerminalView.prototype.getTerminalTitle = function() {
      return this.title || this.process;
    };

    PlatformIOTerminalView.prototype.getTerminal = function() {
      return this.terminal;
    };

    PlatformIOTerminalView.prototype.isAnimating = function() {
      return this.animating;
    };

    return PlatformIOTerminalView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nL2dpdC9wd3lvdW5nL2NvbXB1dGVyLXNldHVwL2dlbmVyaWMvZG90X2F0b20vcGFja2FnZXMvcGxhdGZvcm1pby1pZGUtdGVybWluYWwvbGliL3ZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx1SkFBQTtJQUFBOzs7O0VBQUEsTUFBdUMsT0FBQSxDQUFRLE1BQVIsQ0FBdkMsRUFBQyxlQUFELEVBQU8sNkNBQVAsRUFBNEI7O0VBQzVCLE9BQVksT0FBQSxDQUFRLHNCQUFSLENBQVosRUFBQyxVQUFELEVBQUk7O0VBRUosR0FBQSxHQUFNLE9BQU8sQ0FBQyxPQUFSLENBQWdCLFdBQWhCOztFQUNOLFFBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7RUFDWCxXQUFBLEdBQWM7O0VBRWQsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLEVBQUEsR0FBSyxPQUFBLENBQVEsSUFBUjs7RUFFTCxjQUFBLEdBQWlCOztFQUNqQixpQkFBQSxHQUFvQjs7RUFFcEIsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7cUNBQ0osU0FBQSxHQUFXOztxQ0FDWCxFQUFBLEdBQUk7O3FDQUNKLFNBQUEsR0FBVzs7cUNBQ1gsTUFBQSxHQUFROztxQ0FDUixHQUFBLEdBQUs7O3FDQUNMLFlBQUEsR0FBYyxDQUFBLENBQUUsTUFBRixDQUFTLENBQUMsTUFBVixDQUFBOztxQ0FDZCxTQUFBLEdBQVc7O3FDQUNYLEtBQUEsR0FBTzs7cUNBQ1AsT0FBQSxHQUFTOztJQUVULHNCQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyx1Q0FBUDtRQUFnRCxNQUFBLEVBQVEsd0JBQXhEO09BQUwsRUFBdUYsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ3JGLEtBQUMsQ0FB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QUMsS0FBSyxDQUFDLFdBQS9CLENBQUEsQ0FIdUIsRUFJdkIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQWhDLENBQUEsQ0FKdUIsRUFLdkIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQTlCLENBQUEsQ0FMdUIsRUFNdkIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQWpDLENBQUEsQ0FOdUIsRUFPdkIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQTlCLENBQUEsQ0FQdUIsRUFRdkIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQS9CLENBQUEsQ0FSdUIsQ0FBekIsSUFBeUI7YUFXekIsQ0FBQSwyREFBMEIsQ0FDeEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFdBQXRDLENBQUEsQ0FEd0IsRUFFeEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQXBDLENBQUEsQ0FGd0IsRUFHeEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFdBQXRDLENBQUEsQ0FId0IsRUFJeEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLFdBQXZDLENBQUEsQ0FKd0IsRUFLeEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFdBQXJDLENBQUEsQ0FMd0IsRUFNeEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLFdBQXhDLENBQUEsQ0FOd0IsRUFPeEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFdBQXJDLENBQUEsQ0FQd0IsRUFReEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFdBQXRDLENBQUEsQ0FSd0IsQ0FBMUIsSUFBMEIsSUFBMUI7SUFo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cUNBR1YsWUFBQSxHQUFjLFNBQUE7QUFDWixhQUFPLElBQUMsQ0FBQTtJQURJOztxQ0FHZCxJQUFBLEdBQU0sU0FBQyxLQUFELEVBQVEsSUFBUjthQUNKLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLEtBQWQsRUFBcUIsSUFBckI7SUFESTs7cUNBR04sZ0JBQUEsR0FBa0IsU0FBQyxRQUFEO2FBQ2hCLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLGtCQUFaLEVBQWdDLFFBQWhDO0lBRGdCOztxQ0FHbEIsT0FBQSxHQUFTLFNBQUE7QUFDUCxhQUFPLElBQUMsQ0FBQSxnQkFBRCxDQUFBO0lBREE7O3FDQUdULGdCQUFBLEdBQWtCLFNBQUE7QUFDaEIsYUFBTyxJQUFDLENBQUEsS0FBRCxJQUFVLElBQUMsQ0FBQTtJQURGOztxQ0FHbEIsV0FBQSxHQUFhLFNBQUE7QUFDWCxhQUFPLElBQUMsQ0FBQTtJQURHOztxQ0FHYixXQUFBLEdBQWEsU0FBQTtBQUNYLGFBQU8sSUFBQyxDQUFBO0lBREc7Ozs7S0Fwa0JzQjtBQWRyQyIsInNvdXJjZXNDb250ZW50IjpbIntUYXNrLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBFbWl0dGVyfSA9IHJlcXVpcmUgJ2F0b20nXG57JCwgVmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcblxuUHR5ID0gcmVxdWlyZS5yZXNvbHZlICcuL3Byb2Nlc3MnXG5UZXJtaW5hbCA9IHJlcXVpcmUgJ3Rlcm0uanMnXG5JbnB1dERpYWxvZyA9IG51bGxcblxucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5vcyA9IHJlcXVpcmUgJ29zJ1xuXG5sYXN0T3BlbmVkVmlldyA9IG51bGxcbmxhc3RBY3RpdmVFbGVtZW50ID0gbnVsbFxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBQbGF0Zm9ybUlPVGVybWluYWxWaWV3IGV4dGVuZHMgVmlld1xuICBhbmltYXRpbmc6IGZhbHNlXG4gIGlkOiAnJ1xuICBtYXhpbWl6ZWQ6IGZhbHNlXG4gIG9wZW5lZDogZmFsc2VcbiAgcHdkOiAnJ1xuICB3aW5kb3dIZWlnaHQ6ICQod2luZG93KS5oZWlnaHQoKVxuICByb3dIZWlnaHQ6IDIwXG4gIHNoZWxsOiAnJ1xuICB0YWJWaWV3OiBmYWxzZVxuXG4gIEBjb250ZW50OiAtPlxuICAgIEBkaXYgY2xhc3M6ICdwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbCB0ZXJtaW5hbC12aWV3Jywgb3V0bGV0OiAncGxhdGZvcm1JT1Rlcm1pbmFsVmlldycsID0+XG4gICAgICBAZGl2IGNsYXNzOiAncGFuZWwtZGl2aWRlcicsIG91dGxldDogJ3BhbmVsRGl2aWRlcidcbiAgICAgIEBzZWN0aW9uIGNsYXNzOiAnaW5wdXQtYmxvY2snLCA9PlxuICAgICAgICBAZGl2IG91dGxldDogJ3Rvb2xiYXInLCBjbGFzczogJ2J0bi10b29sYmFyJywgPT5cbiAgICAgICAgICBAZGl2IGNsYXNzOiAnYnRuLWdyb3VwJywgPT5cbiAgICAgICAgICAgIEBidXR0b24gb3V0bGV0OiAnaW5wdXRCdG4nLCBjbGFzczogJ2J0biBpY29uIGljb24ta2V5Ym9hcmQnLCBjbGljazogJ2lucHV0RGlhbG9nJ1xuICAgICAgICAgIEBkaXYgY2xhc3M6ICdidG4tZ3JvdXAgcmlnaHQnLCA9PlxuICAgICAgICAgICAgQGJ1dHRvbiBvdXRsZXQ6ICdoaWRlQnRuJywgY2xhc3M6ICdidG4gaWNvbiBpY29uLWNoZXZyb24tZG93bicsIGNsaWNrOiAnaGlkZSdcbiAgICAgICAgICAgIEBidXR0b24gb3V0bGV0OiAnbWF4aW1pemVCdG4nLCBjbGFzczogJ2J0biBpY29uIGljb24tc2NyZWVuLWZ1bGwnLCBjbGljazogJ21heGltaXplJ1xuICAgICAgICAgICAgQGJ1dHRvbiBvdXRsZXQ6ICdjbG9zZUJ0bicsIGNsYXNzOiAnYnRuIGljb24gaWNvbi14JywgY2xpY2s6ICdkZXN0cm95J1xuICAgICAgQGRpdiBjbGFzczogJ3h0ZXJtJywgb3V0bGV0OiAneHRlcm0nXG5cbiAgQGdldEZvY3VzZWRUZXJtaW5hbDogLT5cbiAgICByZXR1cm4gVGVybWluYWwuVGVybWluYWwuZm9jdXNcblxuICBpbml0aWFsaXplOiAoQGlkLCBAcHdkLCBAc3RhdHVzSWNvbiwgQHN0YXR1c0JhciwgQHNoZWxsLCBAYXJncz1bXSwgQGVudj17fSwgQGF1dG9SdW49W10pIC0+XG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAY2xvc2VCdG4sXG4gICAgICB0aXRsZTogJ0Nsb3NlJ1xuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAaGlkZUJ0bixcbiAgICAgIHRpdGxlOiAnSGlkZSdcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1heGltaXplQnRuLnRvb2x0aXAgPSBhdG9tLnRvb2x0aXBzLmFkZCBAbWF4aW1pemVCdG4sXG4gICAgICB0aXRsZTogJ0Z1bGxzY3JlZW4nXG4gICAgQGlucHV0QnRuLnRvb2x0aXAgPSBhdG9tLnRvb2x0aXBzLmFkZCBAaW5wdXRCdG4sXG4gICAgICB0aXRsZTogJ0luc2VydCBUZXh0J1xuXG4gICAgQHByZXZIZWlnaHQgPSBhdG9tLmNvbmZpZy5nZXQoJ3BsYXRmb3JtaW8taWRlLXRlcm1pbmFsLnN0eWxlLmRlZmF1bHRQYW5lbEhlaWdodCcpXG4gICAgaWYgQHByZXZIZWlnaHQuaW5kZXhPZignJScpID4gMFxuICAgICAgcGVyY2VudCA9IE1hdGguYWJzKE1hdGgubWluKHBhcnNlRmxvYXQoQHByZXZIZWlnaHQpIC8gMTAwLjAsIDEpKVxuICAgICAgYm90dG9tSGVpZ2h0ID0gJCgnYXRvbS1wYW5lbC5ib3R0b20nKS5jaGlsZHJlbihcIi50ZXJtaW5hbC12aWV3XCIpLmhlaWdodCgpIG9yIDBcbiAgICAgIEBwcmV2SGVpZ2h0ID0gcGVyY2VudCAqICgkKCcuaXRlbS12aWV3cycpLmhlaWdodCgpICsgYm90dG9tSGVpZ2h0KVxuICAgIEB4dGVybS5oZWlnaHQgMFxuXG4gICAgQHNldEFuaW1hdGlvblNwZWVkKClcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb25maWcub25EaWRDaGFuZ2UgJ3BsYXRmb3JtaW8taWRlLXRlcm1pbmFsLnN0eWxlLmFuaW1hdGlvblNwZWVkJywgQHNldEFuaW1hdGlvblNwZWVkXG5cbiAgICBAdXBkYXRlVG9vbGJhclZpc2liaWxpdHkoKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAncGxhdGZvcm1pby1pZGUtdGVybWluYWwudG9nZ2xlcy5zaG93VG9vbGJhcicsIEB1cGRhdGVUb29sYmFyVmlzaWJpbGl0eVxuXG4gICAgb3ZlcnJpZGUgPSAoZXZlbnQpIC0+XG4gICAgICByZXR1cm4gaWYgZXZlbnQub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIuZ2V0RGF0YSgncGxhdGZvcm1pby1pZGUtdGVybWluYWwnKSBpcyAndHJ1ZSdcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICBAeHRlcm0ub24gJ21vdXNldXAnLCAoZXZlbnQpID0+XG4gICAgICBpZiBldmVudC53aGljaCAhPSAzXG4gICAgICAgIHRleHQgPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkudG9TdHJpbmcoKVxuICAgICAgICBpZiBhdG9tLmNvbmZpZy5nZXQoJ3BsYXRmb3JtaW8taWRlLXRlcm1pbmFsLnRvZ2dsZXMuc2VsZWN0VG9Db3B5JykgYW5kIHRleHRcbiAgICAgICAgICByYXdMaW5lcyA9IHRleHQuc3BsaXQoL1xccj9cXG4vZylcbiAgICAgICAgICBsaW5lcyA9IHJhd0xpbmVzLm1hcCAobGluZSkgLT5cbiAgICAgICAgICAgIGxpbmUucmVwbGFjZSgvXFxzL2csIFwiIFwiKS50cmltUmlnaHQoKVxuICAgICAgICAgIHRleHQgPSBsaW5lcy5qb2luKFwiXFxuXCIpXG4gICAgICAgICAgYXRvbS5jbGlwYm9hcmQud3JpdGUodGV4dClcbiAgICAgICAgdW5sZXNzIHRleHRcbiAgICAgICAgICBAZm9jdXMoKVxuICAgIEB4dGVybS5vbiAnZHJhZ2VudGVyJywgb3ZlcnJpZGVcbiAgICBAeHRlcm0ub24gJ2RyYWdvdmVyJywgb3ZlcnJpZGVcbiAgICBAeHRlcm0ub24gJ2Ryb3AnLCBAcmVjaWV2ZUl0ZW1PckZpbGVcblxuICAgIEBvbiAnZm9jdXMnLCBAZm9jdXNcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgZGlzcG9zZTogPT5cbiAgICAgIEBvZmYgJ2ZvY3VzJywgQGZvY3VzXG5cbiAgICBpZiAvenNofGJhc2gvLnRlc3QoQHNoZWxsKSBhbmQgQGFyZ3MuaW5kZXhPZignLS1sb2dpbicpID09IC0xIGFuZCBQdHkucGxhdGZvcm0gaXNudCAnd2luMzInIGFuZCBhdG9tLmNvbmZpZy5nZXQoJ3BsYXRmb3JtaW8taWRlLXRlcm1pbmFsLnRvZ2dsZXMubG9naW5TaGVsbCcpXG4gICAgICBAYXJncy51bnNoaWZ0ICctLWxvZ2luJ1xuXG4gIGF0dGFjaDogLT5cbiAgICByZXR1cm4gaWYgQHBhbmVsP1xuICAgIEBwYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZEJvdHRvbVBhbmVsKGl0ZW06IHRoaXMsIHZpc2libGU6IGZhbHNlKVxuXG4gIHNldEFuaW1hdGlvblNwZWVkOiA9PlxuICAgIEBhbmltYXRpb25TcGVlZCA9IGF0b20uY29uZmlnLmdldCgncGxhdGZvcm1pby1pZGUtdGVybWluYWwuc3R5bGUuYW5pbWF0aW9uU3BlZWQnKVxuICAgIEBhbmltYXRpb25TcGVlZCA9IDEwMCBpZiBAYW5pbWF0aW9uU3BlZWQgaXMgMFxuXG4gICAgQHh0ZXJtLmNzcyAndHJhbnNpdGlvbicsIFwiaGVpZ2h0ICN7MC4yNSAvIEBhbmltYXRpb25TcGVlZH1zIGxpbmVhclwiXG5cbiAgdXBkYXRlVG9vbGJhclZpc2liaWxpdHk6ID0+XG4gICAgQHNob3dUb29sYmFyID0gYXRvbS5jb25maWcuZ2V0KCdwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbC50b2dnbGVzLnNob3dUb29sYmFyJylcbiAgICBpZiBAc2hvd1Rvb2xiYXJcbiAgICAgIEB0b29sYmFyLmNzcyAnZGlzcGxheScsICdibG9jaydcbiAgICBlbHNlXG4gICAgICBAdG9vbGJhci5jc3MgJ2Rpc3BsYXknLCAnbm9uZSdcblxuICByZWNpZXZlSXRlbU9yRmlsZTogKGV2ZW50KSA9PlxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgIHtkYXRhVHJhbnNmZXJ9ID0gZXZlbnQub3JpZ2luYWxFdmVudFxuXG4gICAgaWYgZGF0YVRyYW5zZmVyLmdldERhdGEoJ2F0b20tZXZlbnQnKSBpcyAndHJ1ZSdcbiAgICAgIGZpbGVQYXRoID0gZGF0YVRyYW5zZmVyLmdldERhdGEoJ3RleHQvcGxhaW4nKVxuICAgICAgQGlucHV0IFwiI3tmaWxlUGF0aH0gXCIgaWYgZmlsZVBhdGhcbiAgICBlbHNlIGlmIGZpbGVQYXRoID0gZGF0YVRyYW5zZmVyLmdldERhdGEoJ2luaXRpYWxQYXRoJylcbiAgICAgIEBpbnB1dCBcIiN7ZmlsZVBhdGh9IFwiXG4gICAgZWxzZSBpZiBkYXRhVHJhbnNmZXIuZmlsZXMubGVuZ3RoID4gMFxuICAgICAgZm9yIGZpbGUgaW4gZGF0YVRyYW5zZmVyLmZpbGVzXG4gICAgICAgIEBpbnB1dCBcIiN7ZmlsZS5wYXRofSBcIlxuXG4gIGZvcmtQdHlQcm9jZXNzOiAtPlxuICAgIFRhc2sub25jZSBQdHksIHBhdGgucmVzb2x2ZShAcHdkKSwgQHNoZWxsLCBAYXJncywgQGVudiwgPT5cbiAgICAgIEBpbnB1dCA9IC0+XG4gICAgICBAcmVzaXplID0gLT5cblxuICBnZXRJZDogLT5cbiAgICByZXR1cm4gQGlkXG5cbiAgZGlzcGxheVRlcm1pbmFsOiAtPlxuICAgIHtjb2xzLCByb3dzfSA9IEBnZXREaW1lbnNpb25zKClcbiAgICBAcHR5UHJvY2VzcyA9IEBmb3JrUHR5UHJvY2VzcygpXG5cbiAgICBAdGVybWluYWwgPSBuZXcgVGVybWluYWwge1xuICAgICAgY3Vyc29yQmxpbmsgICAgIDogZmFsc2VcbiAgICAgIHNjcm9sbGJhY2sgICAgICA6IGF0b20uY29uZmlnLmdldCAncGxhdGZvcm1pby1pZGUtdGVybWluYWwuY29yZS5zY3JvbGxiYWNrJ1xuICAgICAgY29scywgcm93c1xuICAgIH1cblxuICAgIEBhdHRhY2hMaXN0ZW5lcnMoKVxuICAgIEBhdHRhY2hSZXNpemVFdmVudHMoKVxuICAgIEBhdHRhY2hXaW5kb3dFdmVudHMoKVxuICAgIEB0ZXJtaW5hbC5vcGVuIEB4dGVybS5nZXQoMClcblxuICBhdHRhY2hMaXN0ZW5lcnM6IC0+XG4gICAgQHB0eVByb2Nlc3Mub24gXCJwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbDpkYXRhXCIsIChkYXRhKSA9PlxuICAgICAgQHRlcm1pbmFsLndyaXRlIGRhdGFcblxuICAgIEBwdHlQcm9jZXNzLm9uIFwicGxhdGZvcm1pby1pZGUtdGVybWluYWw6ZXhpdFwiLCA9PlxuICAgICAgQGRlc3Ryb3koKSBpZiBhdG9tLmNvbmZpZy5nZXQoJ3BsYXRmb3JtaW8taWRlLXRlcm1pbmFsLnRvZ2dsZXMuYXV0b0Nsb3NlJylcblxuICAgIEB0ZXJtaW5hbC5lbmQgPSA9PiBAZGVzdHJveSgpXG5cbiAgICBAdGVybWluYWwub24gXCJkYXRhXCIsIChkYXRhKSA9PlxuICAgICAgQGlucHV0IGRhdGFcblxuICAgIEBwdHlQcm9jZXNzLm9uIFwicGxhdGZvcm1pby1pZGUtdGVybWluYWw6dGl0bGVcIiwgKHRpdGxlKSA9PlxuICAgICAgQHByb2Nlc3MgPSB0aXRsZVxuICAgIEB0ZXJtaW5hbC5vbiBcInRpdGxlXCIsICh0aXRsZSkgPT5cbiAgICAgIEB0aXRsZSA9IHRpdGxlXG5cbiAgICBAdGVybWluYWwub25jZSBcIm9wZW5cIiwgPT5cbiAgICAgIEBhcHBseVN0eWxlKClcbiAgICAgIEByZXNpemVUZXJtaW5hbFRvVmlldygpXG5cbiAgICAgIHJldHVybiB1bmxlc3MgQHB0eVByb2Nlc3MuY2hpbGRQcm9jZXNzP1xuICAgICAgYXV0b1J1bkNvbW1hbmQgPSBhdG9tLmNvbmZpZy5nZXQoJ3BsYXRmb3JtaW8taWRlLXRlcm1pbmFsLmNvcmUuYXV0b1J1bkNvbW1hbmQnKVxuICAgICAgQGlucHV0IFwiI3thdXRvUnVuQ29tbWFuZH0je29zLkVPTH1cIiBpZiBhdXRvUnVuQ29tbWFuZFxuICAgICAgQGlucHV0IFwiI3tjb21tYW5kfSN7b3MuRU9MfVwiIGZvciBjb21tYW5kIGluIEBhdXRvUnVuXG5cbiAgZGVzdHJveTogLT5cbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBAc3RhdHVzSWNvbi5kZXN0cm95KClcbiAgICBAc3RhdHVzQmFyLnJlbW92ZVRlcm1pbmFsVmlldyB0aGlzXG4gICAgQGRldGFjaFJlc2l6ZUV2ZW50cygpXG4gICAgQGRldGFjaFdpbmRvd0V2ZW50cygpXG5cbiAgICBpZiBAcGFuZWwuaXNWaXNpYmxlKClcbiAgICAgIEBoaWRlKClcbiAgICAgIEBvblRyYW5zaXRpb25FbmQgPT4gQHBhbmVsLmRlc3Ryb3koKVxuICAgIGVsc2VcbiAgICAgIEBwYW5lbC5kZXN0cm95KClcblxuICAgIGlmIEBzdGF0dXNJY29uIGFuZCBAc3RhdHVzSWNvbi5wYXJlbnROb2RlXG4gICAgICBAc3RhdHVzSWNvbi5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKEBzdGF0dXNJY29uKVxuXG4gICAgQHB0eVByb2Nlc3M/LnRlcm1pbmF0ZSgpXG4gICAgQHRlcm1pbmFsPy5kZXN0cm95KClcblxuICBtYXhpbWl6ZTogLT5cbiAgICBAc3Vic2NyaXB0aW9ucy5yZW1vdmUgQG1heGltaXplQnRuLnRvb2x0aXBcbiAgICBAbWF4aW1pemVCdG4udG9vbHRpcC5kaXNwb3NlKClcblxuICAgIEBtYXhIZWlnaHQgPSBAcHJldkhlaWdodCArIGF0b20ud29ya3NwYWNlLmdldENlbnRlcigpLnBhbmVDb250YWluZXIuZWxlbWVudC5vZmZzZXRIZWlnaHRcbiAgICBidG4gPSBAbWF4aW1pemVCdG4uY2hpbGRyZW4oJ3NwYW4nKVxuICAgIEBvblRyYW5zaXRpb25FbmQgPT4gQGZvY3VzKClcblxuICAgIGlmIEBtYXhpbWl6ZWRcbiAgICAgIEBtYXhpbWl6ZUJ0bi50b29sdGlwID0gYXRvbS50b29sdGlwcy5hZGQgQG1heGltaXplQnRuLFxuICAgICAgICB0aXRsZTogJ0Z1bGxzY3JlZW4nXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1heGltaXplQnRuLnRvb2x0aXBcbiAgICAgIEBhZGp1c3RIZWlnaHQgQHByZXZIZWlnaHRcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnaWNvbi1zY3JlZW4tbm9ybWFsJykuYWRkQ2xhc3MoJ2ljb24tc2NyZWVuLWZ1bGwnKVxuICAgICAgQG1heGltaXplZCA9IGZhbHNlXG4gICAgZWxzZVxuICAgICAgQG1heGltaXplQnRuLnRvb2x0aXAgPSBhdG9tLnRvb2x0aXBzLmFkZCBAbWF4aW1pemVCdG4sXG4gICAgICAgIHRpdGxlOiAnTm9ybWFsJ1xuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBtYXhpbWl6ZUJ0bi50b29sdGlwXG4gICAgICBAYWRqdXN0SGVpZ2h0IEBtYXhIZWlnaHRcbiAgICAgIGJ0bi5yZW1vdmVDbGFzcygnaWNvbi1zY3JlZW4tZnVsbCcpLmFkZENsYXNzKCdpY29uLXNjcmVlbi1ub3JtYWwnKVxuICAgICAgQG1heGltaXplZCA9IHRydWVcblxuICBvcGVuOiA9PlxuICAgIGxhc3RBY3RpdmVFbGVtZW50ID89ICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudClcblxuICAgIGlmIGxhc3RPcGVuZWRWaWV3IGFuZCBsYXN0T3BlbmVkVmlldyAhPSB0aGlzXG4gICAgICBpZiBsYXN0T3BlbmVkVmlldy5tYXhpbWl6ZWRcbiAgICAgICAgQHN1YnNjcmlwdGlvbnMucmVtb3ZlIEBtYXhpbWl6ZUJ0bi50b29sdGlwXG4gICAgICAgIEBtYXhpbWl6ZUJ0bi50b29sdGlwLmRpc3Bvc2UoKVxuICAgICAgICBpY29uID0gQG1heGltaXplQnRuLmNoaWxkcmVuKCdzcGFuJylcblxuICAgICAgICBAbWF4SGVpZ2h0ID0gbGFzdE9wZW5lZFZpZXcubWF4SGVpZ2h0XG4gICAgICAgIEBtYXhpbWl6ZUJ0bi50b29sdGlwID0gYXRvbS50b29sdGlwcy5hZGQgQG1heGltaXplQnRuLFxuICAgICAgICAgIHRpdGxlOiAnTm9ybWFsJ1xuICAgICAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQG1heGltaXplQnRuLnRvb2x0aXBcbiAgICAgICAgaWNvbi5yZW1vdmVDbGFzcygnaWNvbi1zY3JlZW4tZnVsbCcpLmFkZENsYXNzKCdpY29uLXNjcmVlbi1ub3JtYWwnKVxuICAgICAgICBAbWF4aW1pemVkID0gdHJ1ZVxuICAgICAgbGFzdE9wZW5lZFZpZXcuaGlkZSgpXG5cbiAgICBsYXN0T3BlbmVkVmlldyA9IHRoaXNcbiAgICBAc3RhdHVzQmFyLnNldEFjdGl2ZVRlcm1pbmFsVmlldyB0aGlzXG4gICAgQHN0YXR1c0ljb24uYWN0aXZhdGUoKVxuXG4gICAgQG9uVHJhbnNpdGlvbkVuZCA9PlxuICAgICAgaWYgbm90IEBvcGVuZWRcbiAgICAgICAgQG9wZW5lZCA9IHRydWVcbiAgICAgICAgQGRpc3BsYXlUZXJtaW5hbCgpXG4gICAgICAgIEBwcmV2SGVpZ2h0ID0gQG5lYXJlc3RSb3coQHh0ZXJtLmhlaWdodCgpKVxuICAgICAgICBAeHRlcm0uaGVpZ2h0KEBwcmV2SGVpZ2h0KVxuICAgICAgICBAZW1pdCBcInBsYXRmb3JtaW8taWRlLXRlcm1pbmFsOnRlcm1pbmFsLW9wZW5cIlxuICAgICAgZWxzZVxuICAgICAgICBAZm9jdXMoKVxuXG4gICAgQHBhbmVsLnNob3coKVxuICAgIEB4dGVybS5oZWlnaHQgMFxuICAgIEBhbmltYXRpbmcgPSB0cnVlXG4gICAgQHh0ZXJtLmhlaWdodCBpZiBAbWF4aW1pemVkIHRoZW4gQG1heEhlaWdodCBlbHNlIEBwcmV2SGVpZ2h0XG5cbiAgaGlkZTogPT5cbiAgICBAdGVybWluYWw/LmJsdXIoKVxuICAgIGxhc3RPcGVuZWRWaWV3ID0gbnVsbFxuICAgIEBzdGF0dXNJY29uLmRlYWN0aXZhdGUoKVxuXG4gICAgQG9uVHJhbnNpdGlvbkVuZCA9PlxuICAgICAgQHBhbmVsLmhpZGUoKVxuICAgICAgdW5sZXNzIGxhc3RPcGVuZWRWaWV3P1xuICAgICAgICBpZiBsYXN0QWN0aXZlRWxlbWVudD9cbiAgICAgICAgICBsYXN0QWN0aXZlRWxlbWVudC5mb2N1cygpXG4gICAgICAgICAgbGFzdEFjdGl2ZUVsZW1lbnQgPSBudWxsXG5cbiAgICBAeHRlcm0uaGVpZ2h0IGlmIEBtYXhpbWl6ZWQgdGhlbiBAbWF4SGVpZ2h0IGVsc2UgQHByZXZIZWlnaHRcbiAgICBAYW5pbWF0aW5nID0gdHJ1ZVxuICAgIEB4dGVybS5oZWlnaHQgMFxuXG4gIHRvZ2dsZTogLT5cbiAgICByZXR1cm4gaWYgQGFuaW1hdGluZ1xuXG4gICAgaWYgQHBhbmVsLmlzVmlzaWJsZSgpXG4gICAgICBAaGlkZSgpXG4gICAgZWxzZVxuICAgICAgQG9wZW4oKVxuXG4gIGlucHV0OiAoZGF0YSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBwdHlQcm9jZXNzLmNoaWxkUHJvY2Vzcz9cblxuICAgIEB0ZXJtaW5hbC5zdG9wU2Nyb2xsaW5nKClcbiAgICBAcHR5UHJvY2Vzcy5zZW5kIGV2ZW50OiAnaW5wdXQnLCB0ZXh0OiBkYXRhXG5cbiAgcmVzaXplOiAoY29scywgcm93cykgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBwdHlQcm9jZXNzLmNoaWxkUHJvY2Vzcz9cblxuICAgIEBwdHlQcm9jZXNzLnNlbmQge2V2ZW50OiAncmVzaXplJywgcm93cywgY29sc31cblxuICBwdHk6ICgpIC0+XG4gICAgaWYgbm90IEBvcGVuZWRcbiAgICAgIHdhaXQgPSBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgICBAZW1pdHRlci5vbiBcInBsYXRmb3JtaW8taWRlLXRlcm1pbmFsOnRlcm1pbmFsLW9wZW5cIiwgKCkgPT5cbiAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgc2V0VGltZW91dCByZWplY3QsIDEwMDBcblxuICAgICAgd2FpdC50aGVuICgpID0+XG4gICAgICAgIEBwdHlQcm9taXNlKClcbiAgICBlbHNlXG4gICAgICBAcHR5UHJvbWlzZSgpXG5cbiAgcHR5UHJvbWlzZTogKCkgLT5cbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgaWYgQHB0eVByb2Nlc3M/XG4gICAgICAgIEBwdHlQcm9jZXNzLm9uIFwicGxhdGZvcm1pby1pZGUtdGVybWluYWw6cHR5XCIsIChwdHkpID0+XG4gICAgICAgICAgcmVzb2x2ZShwdHkpXG4gICAgICAgIEBwdHlQcm9jZXNzLnNlbmQge2V2ZW50OiAncHR5J31cbiAgICAgICAgc2V0VGltZW91dCByZWplY3QsIDEwMDBcbiAgICAgIGVsc2VcbiAgICAgICAgcmVqZWN0KClcblxuICBhcHBseVN0eWxlOiAtPlxuICAgIGNvbmZpZyA9IGF0b20uY29uZmlnLmdldCAncGxhdGZvcm1pby1pZGUtdGVybWluYWwnXG5cbiAgICBAeHRlcm0uYWRkQ2xhc3MgY29uZmlnLnN0eWxlLnRoZW1lXG4gICAgXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlICdwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbC5zdHlsZS50aGVtZScsIChldmVudCkgPT5cbiAgICAgIEB4dGVybS5yZW1vdmVDbGFzcyBldmVudC5vbGRWYWx1ZVxuICAgICAgQHh0ZXJtLmFkZENsYXNzIGV2ZW50Lm5ld1ZhbHVlXG5cbiAgICBAeHRlcm0uYWRkQ2xhc3MgJ2N1cnNvci1ibGluaycgaWYgY29uZmlnLnRvZ2dsZXMuY3Vyc29yQmxpbmtcblxuICAgIGVkaXRvckZvbnQgPSBhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci5mb250RmFtaWx5JylcbiAgICBkZWZhdWx0Rm9udCA9IFwiTWVubG8sIENvbnNvbGFzLCAnRGVqYVZ1IFNhbnMgTW9ubycsIG1vbm9zcGFjZVwiXG4gICAgb3ZlcnJpZGVGb250ID0gY29uZmlnLnN0eWxlLmZvbnRGYW1pbHlcbiAgICBAdGVybWluYWwuZWxlbWVudC5zdHlsZS5mb250RmFtaWx5ID0gb3ZlcnJpZGVGb250IG9yIGVkaXRvckZvbnQgb3IgZGVmYXVsdEZvbnRcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnZWRpdG9yLmZvbnRGYW1pbHknLCAoZXZlbnQpID0+XG4gICAgICBlZGl0b3JGb250ID0gZXZlbnQubmV3VmFsdWVcbiAgICAgIEB0ZXJtaW5hbC5lbGVtZW50LnN0eWxlLmZvbnRGYW1pbHkgPSBvdmVycmlkZUZvbnQgb3IgZWRpdG9yRm9udCBvciBkZWZhdWx0Rm9udFxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAncGxhdGZvcm1pby1pZGUtdGVybWluYWwuc3R5bGUuZm9udEZhbWlseScsIChldmVudCkgPT5cbiAgICAgIG92ZXJyaWRlRm9udCA9IGV2ZW50Lm5ld1ZhbHVlXG4gICAgICBAdGVybWluYWwuZWxlbWVudC5zdHlsZS5mb250RmFtaWx5ID0gb3ZlcnJpZGVGb250IG9yIGVkaXRvckZvbnQgb3IgZGVmYXVsdEZvbnRcblxuICAgIGVkaXRvckZvbnRTaXplID0gYXRvbS5jb25maWcuZ2V0KCdlZGl0b3IuZm9udFNpemUnKVxuICAgIG92ZXJyaWRlRm9udFNpemUgPSBjb25maWcuc3R5bGUuZm9udFNpemVcbiAgICBAdGVybWluYWwuZWxlbWVudC5zdHlsZS5mb250U2l6ZSA9IFwiI3tvdmVycmlkZUZvbnRTaXplIG9yIGVkaXRvckZvbnRTaXplfXB4XCJcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAnZWRpdG9yLmZvbnRTaXplJywgKGV2ZW50KSA9PlxuICAgICAgZWRpdG9yRm9udFNpemUgPSBldmVudC5uZXdWYWx1ZVxuICAgICAgQHRlcm1pbmFsLmVsZW1lbnQuc3R5bGUuZm9udFNpemUgPSBcIiN7b3ZlcnJpZGVGb250U2l6ZSBvciBlZGl0b3JGb250U2l6ZX1weFwiXG4gICAgICBAcmVzaXplVGVybWluYWxUb1ZpZXcoKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSAncGxhdGZvcm1pby1pZGUtdGVybWluYWwuc3R5bGUuZm9udFNpemUnLCAoZXZlbnQpID0+XG4gICAgICBvdmVycmlkZUZvbnRTaXplID0gZXZlbnQubmV3VmFsdWVcbiAgICAgIEB0ZXJtaW5hbC5lbGVtZW50LnN0eWxlLmZvbnRTaXplID0gXCIje292ZXJyaWRlRm9udFNpemUgb3IgZWRpdG9yRm9udFNpemV9cHhcIlxuICAgICAgQHJlc2l6ZVRlcm1pbmFsVG9WaWV3KClcblxuICAgICMgZmlyc3QgOCBjb2xvcnMgaS5lLiAnZGFyaycgY29sb3JzXG4gICAgQHRlcm1pbmFsLmNvbG9yc1swLi43XSA9IFtcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLm5vcm1hbC5ibGFjay50b0hleFN0cmluZygpXG4gICAgICBjb25maWcuYW5zaUNvbG9ycy5ub3JtYWwucmVkLnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLm5vcm1hbC5ncmVlbi50b0hleFN0cmluZygpXG4gICAgICBjb25maWcuYW5zaUNvbG9ycy5ub3JtYWwueWVsbG93LnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLm5vcm1hbC5ibHVlLnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLm5vcm1hbC5tYWdlbnRhLnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLm5vcm1hbC5jeWFuLnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLm5vcm1hbC53aGl0ZS50b0hleFN0cmluZygpXG4gICAgXVxuICAgICMgJ2JyaWdodCcgY29sb3JzXG4gICAgQHRlcm1pbmFsLmNvbG9yc1s4Li4xNV0gPSBbXG4gICAgICBjb25maWcuYW5zaUNvbG9ycy56QnJpZ2h0LmJyaWdodEJsYWNrLnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLnpCcmlnaHQuYnJpZ2h0UmVkLnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLnpCcmlnaHQuYnJpZ2h0R3JlZW4udG9IZXhTdHJpbmcoKVxuICAgICAgY29uZmlnLmFuc2lDb2xvcnMuekJyaWdodC5icmlnaHRZZWxsb3cudG9IZXhTdHJpbmcoKVxuICAgICAgY29uZmlnLmFuc2lDb2xvcnMuekJyaWdodC5icmlnaHRCbHVlLnRvSGV4U3RyaW5nKClcbiAgICAgIGNvbmZpZy5hbnNpQ29sb3JzLnpCcmlnaHQuYnJpZ2h0TWFnZW50YS50b0hleFN0cmluZygpXG4gICAgICBjb25maWcuYW5zaUNvbG9ycy56QnJpZ2h0LmJyaWdodEN5YW4udG9IZXhTdHJpbmcoKVxuICAgICAgY29uZmlnLmFuc2lDb2xvcnMuekJyaWdodC5icmlnaHRXaGl0ZS50b0hleFN0cmluZygpXG4gICAgXVxuXG4gIGF0dGFjaFdpbmRvd0V2ZW50czogLT5cbiAgICAkKHdpbmRvdykub24gJ3Jlc2l6ZScsIEBvbldpbmRvd1Jlc2l6ZVxuXG4gIGRldGFjaFdpbmRvd0V2ZW50czogLT5cbiAgICAkKHdpbmRvdykub2ZmICdyZXNpemUnLCBAb25XaW5kb3dSZXNpemVcblxuICBhdHRhY2hSZXNpemVFdmVudHM6IC0+XG4gICAgQHBhbmVsRGl2aWRlci5vbiAnbW91c2Vkb3duJywgQHJlc2l6ZVN0YXJ0ZWRcblxuICBkZXRhY2hSZXNpemVFdmVudHM6IC0+XG4gICAgQHBhbmVsRGl2aWRlci5vZmYgJ21vdXNlZG93bidcblxuICBvbldpbmRvd1Jlc2l6ZTogPT5cbiAgICBpZiBub3QgQHRhYlZpZXdcbiAgICAgIEB4dGVybS5jc3MgJ3RyYW5zaXRpb24nLCAnJ1xuICAgICAgbmV3SGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpXG4gICAgICBib3R0b21QYW5lbCA9ICQoJ2F0b20tcGFuZWwtY29udGFpbmVyLmJvdHRvbScpLmZpcnN0KCkuZ2V0KDApXG4gICAgICBvdmVyZmxvdyA9IGJvdHRvbVBhbmVsLnNjcm9sbEhlaWdodCAtIGJvdHRvbVBhbmVsLm9mZnNldEhlaWdodFxuXG4gICAgICBkZWx0YSA9IG5ld0hlaWdodCAtIEB3aW5kb3dIZWlnaHRcbiAgICAgIEB3aW5kb3dIZWlnaHQgPSBuZXdIZWlnaHRcblxuICAgICAgaWYgQG1heGltaXplZFxuICAgICAgICBjbGFtcGVkID0gTWF0aC5tYXgoQG1heEhlaWdodCArIGRlbHRhLCBAcm93SGVpZ2h0KVxuXG4gICAgICAgIEBhZGp1c3RIZWlnaHQgY2xhbXBlZCBpZiBAcGFuZWwuaXNWaXNpYmxlKClcbiAgICAgICAgQG1heEhlaWdodCA9IGNsYW1wZWRcblxuICAgICAgICBAcHJldkhlaWdodCA9IE1hdGgubWluKEBwcmV2SGVpZ2h0LCBAbWF4SGVpZ2h0KVxuICAgICAgZWxzZSBpZiBvdmVyZmxvdyA+IDBcbiAgICAgICAgY2xhbXBlZCA9IE1hdGgubWF4KEBuZWFyZXN0Um93KEBwcmV2SGVpZ2h0ICsgZGVsdGEpLCBAcm93SGVpZ2h0KVxuXG4gICAgICAgIEBhZGp1c3RIZWlnaHQgY2xhbXBlZCBpZiBAcGFuZWwuaXNWaXNpYmxlKClcbiAgICAgICAgQHByZXZIZWlnaHQgPSBjbGFtcGVkXG5cbiAgICAgIEB4dGVybS5jc3MgJ3RyYW5zaXRpb24nLCBcImhlaWdodCAjezAuMjUgLyBAYW5pbWF0aW9uU3BlZWR9cyBsaW5lYXJcIlxuICAgIEByZXNpemVUZXJtaW5hbFRvVmlldygpXG5cbiAgcmVzaXplU3RhcnRlZDogPT5cbiAgICByZXR1cm4gaWYgQG1heGltaXplZFxuICAgIEBtYXhIZWlnaHQgPSBAcHJldkhlaWdodCArICQoJy5pdGVtLXZpZXdzJykuaGVpZ2h0KClcbiAgICAkKGRvY3VtZW50KS5vbignbW91c2Vtb3ZlJywgQHJlc2l6ZVBhbmVsKVxuICAgICQoZG9jdW1lbnQpLm9uKCdtb3VzZXVwJywgQHJlc2l6ZVN0b3BwZWQpXG4gICAgQHh0ZXJtLmNzcyAndHJhbnNpdGlvbicsICcnXG5cbiAgcmVzaXplU3RvcHBlZDogPT5cbiAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNlbW92ZScsIEByZXNpemVQYW5lbClcbiAgICAkKGRvY3VtZW50KS5vZmYoJ21vdXNldXAnLCBAcmVzaXplU3RvcHBlZClcbiAgICBAeHRlcm0uY3NzICd0cmFuc2l0aW9uJywgXCJoZWlnaHQgI3swLjI1IC8gQGFuaW1hdGlvblNwZWVkfXMgbGluZWFyXCJcblxuICBuZWFyZXN0Um93OiAodmFsdWUpIC0+XG4gICAgcm93cyA9IHZhbHVlIC8vIEByb3dIZWlnaHRcbiAgICByZXR1cm4gcm93cyAqIEByb3dIZWlnaHRcblxuICByZXNpemVQYW5lbDogKGV2ZW50KSA9PlxuICAgIHJldHVybiBAcmVzaXplU3RvcHBlZCgpIHVubGVzcyBldmVudC53aGljaCBpcyAxXG5cbiAgICBtb3VzZVkgPSAkKHdpbmRvdykuaGVpZ2h0KCkgLSBldmVudC5wYWdlWVxuICAgIGRlbHRhID0gbW91c2VZIC0gJCgnYXRvbS1wYW5lbC1jb250YWluZXIuYm90dG9tJykuaGVpZ2h0KCkgLSAkKCdhdG9tLXBhbmVsLWNvbnRhaW5lci5mb290ZXInKS5oZWlnaHQoKVxuICAgIHJldHVybiB1bmxlc3MgTWF0aC5hYnMoZGVsdGEpID4gKEByb3dIZWlnaHQgKiA1IC8gNilcblxuICAgIGNsYW1wZWQgPSBNYXRoLm1heChAbmVhcmVzdFJvdyhAcHJldkhlaWdodCArIGRlbHRhKSwgQHJvd0hlaWdodClcbiAgICByZXR1cm4gaWYgY2xhbXBlZCA+IEBtYXhIZWlnaHRcblxuICAgIEB4dGVybS5oZWlnaHQgY2xhbXBlZFxuICAgICQoQHRlcm1pbmFsLmVsZW1lbnQpLmhlaWdodCBjbGFtcGVkXG4gICAgQHByZXZIZWlnaHQgPSBjbGFtcGVkXG5cbiAgICBAcmVzaXplVGVybWluYWxUb1ZpZXcoKVxuXG4gIGFkanVzdEhlaWdodDogKGhlaWdodCkgLT5cbiAgICBAeHRlcm0uaGVpZ2h0IGhlaWdodFxuICAgICQoQHRlcm1pbmFsLmVsZW1lbnQpLmhlaWdodCBoZWlnaHRcblxuICBjb3B5OiAtPlxuICAgIGlmIEB0ZXJtaW5hbC5fc2VsZWN0ZWRcbiAgICAgIHRleHRhcmVhID0gQHRlcm1pbmFsLmdldENvcHlUZXh0YXJlYSgpXG4gICAgICB0ZXh0ID0gQHRlcm1pbmFsLmdyYWJUZXh0KFxuICAgICAgICBAdGVybWluYWwuX3NlbGVjdGVkLngxLCBAdGVybWluYWwuX3NlbGVjdGVkLngyLFxuICAgICAgICBAdGVybWluYWwuX3NlbGVjdGVkLnkxLCBAdGVybWluYWwuX3NlbGVjdGVkLnkyKVxuICAgIGVsc2VcbiAgICAgIHJhd1RleHQgPSBAdGVybWluYWwuY29udGV4dC5nZXRTZWxlY3Rpb24oKS50b1N0cmluZygpXG4gICAgICByYXdMaW5lcyA9IHJhd1RleHQuc3BsaXQoL1xccj9cXG4vZylcbiAgICAgIGxpbmVzID0gcmF3TGluZXMubWFwIChsaW5lKSAtPlxuICAgICAgICBsaW5lLnJlcGxhY2UoL1xccy9nLCBcIiBcIikudHJpbVJpZ2h0KClcbiAgICAgIHRleHQgPSBsaW5lcy5qb2luKFwiXFxuXCIpXG4gICAgYXRvbS5jbGlwYm9hcmQud3JpdGUgdGV4dFxuXG4gIHBhc3RlOiAtPlxuICAgIEBpbnB1dCBhdG9tLmNsaXBib2FyZC5yZWFkKClcblxuICBpbnNlcnRTZWxlY3Rpb246IChjdXN0b21UZXh0KSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgcnVuQ29tbWFuZCA9IGF0b20uY29uZmlnLmdldCgncGxhdGZvcm1pby1pZGUtdGVybWluYWwudG9nZ2xlcy5ydW5JbnNlcnRlZFRleHQnKVxuICAgIHNlbGVjdGlvblRleHQgPSAnJ1xuICAgIGlmIHNlbGVjdGlvbiA9IGVkaXRvci5nZXRTZWxlY3RlZFRleHQoKVxuICAgICAgQHRlcm1pbmFsLnN0b3BTY3JvbGxpbmcoKVxuICAgICAgc2VsZWN0aW9uVGV4dCA9IHNlbGVjdGlvblxuICAgIGVsc2UgaWYgY3Vyc29yID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIGxpbmUgPSBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3coY3Vyc29yLnJvdylcbiAgICAgIEB0ZXJtaW5hbC5zdG9wU2Nyb2xsaW5nKClcbiAgICAgIHNlbGVjdGlvblRleHQgPSBsaW5lXG4gICAgICBlZGl0b3IubW92ZURvd24oMSk7XG4gICAgQGlucHV0IFwiI3tjdXN0b21UZXh0LlxuICAgICAgcmVwbGFjZSgvXFwkTC8sIFwiI3tlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKS5yb3cgKyAxfVwiKS5cbiAgICAgIHJlcGxhY2UoL1xcJEYvLCBwYXRoLmJhc2VuYW1lKGlmIGVkaXRvci5idWZmZXIuZ2V0UGF0aCgpIHRoZW4gZWRpdG9yLmJ1ZmZlci5nZXRQYXRoKCkgZWxzZSAnLicpKS5cbiAgICAgIHJlcGxhY2UoL1xcJEQvLCBwYXRoLmRpcm5hbWUoaWYgZWRpdG9yLmJ1ZmZlci5nZXRQYXRoKCkgdGhlbiBlZGl0b3IuYnVmZmVyLmdldFBhdGgoKSBlbHNlICcuJykpLlxuICAgICAgcmVwbGFjZSgvXFwkUy8sIHNlbGVjdGlvblRleHQpLlxuICAgICAgcmVwbGFjZSgvXFwkXFwkLywgJyQnKX0je2lmIHJ1bkNvbW1hbmQgdGhlbiBvcy5FT0wgZWxzZSAnJ31cIlxuXG4gIGZvY3VzOiAoZnJvbVdpbmRvd0V2ZW50KSA9PlxuICAgIEByZXNpemVUZXJtaW5hbFRvVmlldygpXG4gICAgQGZvY3VzVGVybWluYWwoZnJvbVdpbmRvd0V2ZW50KVxuICAgIEBzdGF0dXNCYXIuc2V0QWN0aXZlVGVybWluYWxWaWV3KHRoaXMpXG4gICAgc3VwZXIoKVxuXG4gIGJsdXI6ID0+XG4gICAgQGJsdXJUZXJtaW5hbCgpXG4gICAgc3VwZXIoKVxuXG4gIGZvY3VzVGVybWluYWw6IChmcm9tV2luZG93RXZlbnQpID0+XG4gICAgcmV0dXJuIHVubGVzcyBAdGVybWluYWxcblxuICAgIGxhc3RBY3RpdmVFbGVtZW50ID0gJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KVxuICAgIHJldHVybiBpZiBmcm9tV2luZG93RXZlbnQgYW5kIG5vdCAobGFzdEFjdGl2ZUVsZW1lbnQuaXMoJ2Rpdi50ZXJtaW5hbCcpIG9yIGxhc3RBY3RpdmVFbGVtZW50LnBhcmVudHMoJ2Rpdi50ZXJtaW5hbCcpLmxlbmd0aClcblxuICAgIEB0ZXJtaW5hbC5mb2N1cygpXG4gICAgaWYgQHRlcm1pbmFsLl90ZXh0YXJlYVxuICAgICAgQHRlcm1pbmFsLl90ZXh0YXJlYS5mb2N1cygpXG4gICAgZWxzZVxuICAgICAgQHRlcm1pbmFsLmVsZW1lbnQuZm9jdXMoKVxuXG4gIGJsdXJUZXJtaW5hbDogPT5cbiAgICByZXR1cm4gdW5sZXNzIEB0ZXJtaW5hbFxuXG4gICAgQHRlcm1pbmFsLmJsdXIoKVxuICAgIEB0ZXJtaW5hbC5lbGVtZW50LmJsdXIoKVxuXG4gICAgaWYgbGFzdEFjdGl2ZUVsZW1lbnQ/XG4gICAgICBsYXN0QWN0aXZlRWxlbWVudC5mb2N1cygpXG5cbiAgcmVzaXplVGVybWluYWxUb1ZpZXc6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAcGFuZWwuaXNWaXNpYmxlKCkgb3IgQHRhYlZpZXdcblxuICAgIHtjb2xzLCByb3dzfSA9IEBnZXREaW1lbnNpb25zKClcbiAgICByZXR1cm4gdW5sZXNzIGNvbHMgPiAwIGFuZCByb3dzID4gMFxuICAgIHJldHVybiB1bmxlc3MgQHRlcm1pbmFsXG4gICAgcmV0dXJuIGlmIEB0ZXJtaW5hbC5yb3dzIGlzIHJvd3MgYW5kIEB0ZXJtaW5hbC5jb2xzIGlzIGNvbHNcblxuICAgIEByZXNpemUgY29scywgcm93c1xuICAgIEB0ZXJtaW5hbC5yZXNpemUgY29scywgcm93c1xuXG4gIGdldERpbWVuc2lvbnM6IC0+XG4gICAgZmFrZVJvdyA9ICQoXCI8ZGl2PjxzcGFuPiZuYnNwOzwvc3Bhbj48L2Rpdj5cIilcblxuICAgIGlmIEB0ZXJtaW5hbFxuICAgICAgQGZpbmQoJy50ZXJtaW5hbCcpLmFwcGVuZCBmYWtlUm93XG4gICAgICBmYWtlQ29sID0gZmFrZVJvdy5jaGlsZHJlbigpLmZpcnN0KClbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgIGNvbHMgPSBNYXRoLmZsb29yIEB4dGVybS53aWR0aCgpIC8gKGZha2VDb2wud2lkdGggb3IgOSlcbiAgICAgIHJvd3MgPSBNYXRoLmZsb29yIEB4dGVybS5oZWlnaHQoKSAvIChmYWtlQ29sLmhlaWdodCBvciAyMClcbiAgICAgIEByb3dIZWlnaHQgPSBmYWtlQ29sLmhlaWdodFxuICAgICAgZmFrZVJvdy5yZW1vdmUoKVxuICAgIGVsc2VcbiAgICAgIGNvbHMgPSBNYXRoLmZsb29yIEB4dGVybS53aWR0aCgpIC8gOVxuICAgICAgcm93cyA9IE1hdGguZmxvb3IgQHh0ZXJtLmhlaWdodCgpIC8gMjBcblxuICAgIHtjb2xzLCByb3dzfVxuXG4gIG9uVHJhbnNpdGlvbkVuZDogKGNhbGxiYWNrKSAtPlxuICAgIEB4dGVybS5vbmUgJ3dlYmtpdFRyYW5zaXRpb25FbmQnLCA9PlxuICAgICAgY2FsbGJhY2soKVxuICAgICAgQGFuaW1hdGluZyA9IGZhbHNlXG5cbiAgaW5wdXREaWFsb2c6IC0+XG4gICAgSW5wdXREaWFsb2cgPz0gcmVxdWlyZSgnLi9pbnB1dC1kaWFsb2cnKVxuICAgIGRpYWxvZyA9IG5ldyBJbnB1dERpYWxvZyB0aGlzXG4gICAgZGlhbG9nLmF0dGFjaCgpXG5cbiAgcmVuYW1lOiAtPlxuICAgIEBzdGF0dXNJY29uLnJlbmFtZSgpXG5cbiAgdG9nZ2xlVGFiVmlldzogLT5cbiAgICBpZiBAdGFiVmlld1xuICAgICAgQHBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkQm90dG9tUGFuZWwoaXRlbTogdGhpcywgdmlzaWJsZTogZmFsc2UpXG4gICAgICBAYXR0YWNoUmVzaXplRXZlbnRzKClcbiAgICAgIEBjbG9zZUJ0bi5zaG93KClcbiAgICAgIEBoaWRlQnRuLnNob3coKVxuICAgICAgQG1heGltaXplQnRuLnNob3coKVxuICAgICAgQHRhYlZpZXcgPSBmYWxzZVxuICAgIGVsc2VcbiAgICAgIEBwYW5lbC5kZXN0cm95KClcbiAgICAgIEBkZXRhY2hSZXNpemVFdmVudHMoKVxuICAgICAgQGNsb3NlQnRuLmhpZGUoKVxuICAgICAgQGhpZGVCdG4uaGlkZSgpXG4gICAgICBAbWF4aW1pemVCdG4uaGlkZSgpXG4gICAgICBAeHRlcm0uY3NzIFwiaGVpZ2h0XCIsIFwiXCJcbiAgICAgIEB0YWJWaWV3ID0gdHJ1ZVxuICAgICAgbGFzdE9wZW5lZFZpZXcgPSBudWxsIGlmIGxhc3RPcGVuZWRWaWV3ID09IHRoaXNcblxuICBnZXRUaXRsZTogLT5cbiAgICBAc3RhdHVzSWNvbi5nZXROYW1lKCkgb3IgXCJwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbFwiXG5cbiAgZ2V0SWNvbk5hbWU6IC0+XG4gICAgXCJ0ZXJtaW5hbFwiXG5cbiAgZ2V0U2hlbGw6IC0+XG4gICAgcmV0dXJuIHBhdGguYmFzZW5hbWUgQHNoZWxsXG5cbiAgZ2V0U2hlbGxQYXRoOiAtPlxuICAgIHJldHVybiBAc2hlbGxcblxuICBlbWl0OiAoZXZlbnQsIGRhdGEpIC0+XG4gICAgQGVtaXR0ZXIuZW1pdCBldmVudCwgZGF0YVxuXG4gIG9uRGlkQ2hhbmdlVGl0bGU6IChjYWxsYmFjaykgLT5cbiAgICBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZS10aXRsZScsIGNhbGxiYWNrXG5cbiAgZ2V0UGF0aDogLT5cbiAgICByZXR1cm4gQGdldFRlcm1pbmFsVGl0bGUoKVxuXG4gIGdldFRlcm1pbmFsVGl0bGU6IC0+XG4gICAgcmV0dXJuIEB0aXRsZSBvciBAcHJvY2Vzc1xuXG4gIGdldFRlcm1pbmFsOiAtPlxuICAgIHJldHVybiBAdGVybWluYWxcblxuICBpc0FuaW1hdGluZzogLT5cbiAgICByZXR1cm4gQGFuaW1hdGluZ1xuIl19
