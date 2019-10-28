Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _atom = require('atom');

var _eventKit = require('event-kit');

var _osenv = require('osenv');

var _osenv2 = _interopRequireDefault(_osenv);

var _config = require('./config');

var config = _interopRequireWildcard(_config);

var _models = require('./models');

var _utils = require('./utils');

var _view = require('./view');

var _view2 = _interopRequireDefault(_view);

// Emitter for outside packages to subscribe to. Subscription functions
// are exponsed in ./advanced-open-file
var emitter = new _eventKit.Emitter();

exports.emitter = emitter;

var AdvancedOpenFileController = (function () {
    function AdvancedOpenFileController() {
        _classCallCheck(this, AdvancedOpenFileController);

        this.view = new _view2['default']();
        this.panel = null;

        this.currentPath = null;
        this.pathHistory = [];
        this.disposables = new _atom.CompositeDisposable();

        this.disposables.add(atom.commands.add('atom-workspace', {
            'advanced-open-file:toggle': this.toggle.bind(this)
        }));
        this.disposables.add(atom.commands.add('.advanced-open-file', {
            'core:confirm': this.confirm.bind(this),
            'core:cancel': this.detach.bind(this),
            'application:add-project-folder': this.addSelectedProjectFolder.bind(this),
            'advanced-open-file:autocomplete': this.autocomplete.bind(this),
            'advanced-open-file:undo': this.undo.bind(this),
            'advanced-open-file:move-cursor-down': this.moveCursorDown.bind(this),
            'advanced-open-file:move-cursor-up': this.moveCursorUp.bind(this),
            'advanced-open-file:move-cursor-bottom': this.moveCursorBottom.bind(this),
            'advanced-open-file:move-cursor-top': this.moveCursorTop.bind(this),
            'advanced-open-file:confirm-selected-or-first': this.confirmSelectedOrFirst.bind(this),
            'advanced-open-file:delete-path-component': this.deletePathComponent.bind(this),

            'pane:split-left': this.splitConfirm(function (pane) {
                return pane.splitLeft();
            }),
            'pane:split-right': this.splitConfirm(function (pane) {
                return pane.splitRight();
            }),
            'pane:split-up': this.splitConfirm(function (pane) {
                return pane.splitUp();
            }),
            'pane:split-down': this.splitConfirm(function (pane) {
                return pane.splitDown();
            })
        }));

        this.view.onDidClickFile(this.clickFile.bind(this));
        this.view.onDidClickAddProjectFolder(this.addProjectFolder.bind(this));
        this.view.onDidClickOutside(this.detach.bind(this));
        this.view.onDidPathChange(this.pathChange.bind(this));
    }

    _createClass(AdvancedOpenFileController, [{
        key: 'destroy',
        value: function destroy() {
            this.disposables.dispose();
        }
    }, {
        key: 'clickFile',
        value: function clickFile(fileName) {
            this.selectPath(new _models.Path(fileName));
        }
    }, {
        key: 'pathChange',
        value: function pathChange(newPath) {
            this.currentPath = newPath;

            var replace = false;

            // Since the user typed this, apply fast-dir-switch
            // shortcuts.
            if (config.get('helmDirSwitch')) {
                if (newPath.hasShortcut('')) {
                    // Empty shortcut == '//'
                    newPath = newPath.root();
                    replace = true;
                } else if (newPath.hasShortcut('~')) {
                    newPath = new _models.Path(_osenv2['default'].home() + _path2['default'].sep);
                    replace = true;
                } else if (newPath.hasShortcut(':')) {
                    var projectPath = (0, _utils.getProjectPath)();
                    if (projectPath) {
                        newPath = new _models.Path(projectPath + newPath.sep);
                        replace = true;
                    }
                }
            }

            // If we're replacing the path, save it in the history and set the path.
            // If we aren't, the user is just typing and we don't need the history
            // and want to avoid setting the path which resets the cursor.
            if (replace) {
                this.updatePath(newPath);
            }
        }
    }, {
        key: 'selectPath',
        value: function selectPath(newPath) {
            var split = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

            if (newPath.isDirectory()) {
                if (split !== false) {
                    atom.beep();
                } else {
                    this.updatePath(newPath.asDirectory());
                }
            } else if (split !== false) {
                this.splitOpenPath(newPath, split);
            } else {
                this.openPath(newPath);
            }
        }
    }, {
        key: 'updatePath',
        value: function updatePath(newPath) {
            var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            var _ref$saveHistory = _ref.saveHistory;
            var saveHistory = _ref$saveHistory === undefined ? true : _ref$saveHistory;

            if (saveHistory) {
                this.pathHistory.push(this.currentPath);
            }

            this.currentPath = newPath;
            this.view.setPath(newPath);
        }
    }, {
        key: 'splitOpenPath',
        value: function splitOpenPath(path, split) {
            split(atom.workspace.getActivePane());
            this.openPath(path);
        }
    }, {
        key: 'openPath',
        value: function openPath(path) {
            if (path.exists()) {
                if (path.isFile()) {
                    atom.workspace.open(path.absolute);
                    emitter.emit('did-open-path', path.absolute);
                    this.detach();
                } else {
                    atom.beep();
                }
            } else if (path.fragment) {
                try {
                    path.createDirectories();
                    if (config.get('createFileInstantly')) {
                        path.createFile();
                        emitter.emit('did-create-path', path.absolute);
                    }
                    atom.workspace.open(path.absolute);
                    emitter.emit('did-open-path', path.absolute);
                } catch (err) {
                    atom.notifications.addError('Could not open file', {
                        detail: err,
                        icon: 'alert'
                    });
                } finally {
                    this.detach();
                }
            } else if (config.get('createDirectories')) {
                try {
                    path.createDirectories();
                    atom.notifications.addSuccess('Directory created', {
                        detail: 'Created directory "' + path.full + '".',
                        icon: 'file-directory'
                    });
                    emitter.emit('did-create-path', path.absolute);
                    this.detach();
                } catch (err) {
                    atom.notifications.addError('Could not create directory', {
                        detail: err,
                        icon: 'file-directory'
                    });
                } finally {
                    this.detach();
                }
            } else {
                atom.beep();
            }
        }
    }, {
        key: 'deletePathComponent',
        value: function deletePathComponent() {
            if (this.currentPath.isRoot()) {
                atom.beep();
            } else {
                this.updatePath(this.currentPath.parent());
            }
        }
    }, {
        key: 'addProjectFolder',
        value: function addProjectFolder(fileName) {
            var folderPath = new _models.Path(fileName);
            if (folderPath.isDirectory() && !folderPath.isProjectDirectory()) {
                atom.project.addPath(folderPath.absolute);
                atom.notifications.addSuccess('Added project folder', {
                    detail: 'Added "' + folderPath.full + '" as a project folder.',
                    icon: 'file-directory'
                });
                this.view.refreshPathListItem(folderPath);
            } else {
                atom.beep();
            }
        }
    }, {
        key: 'addSelectedProjectFolder',
        value: function addSelectedProjectFolder(event) {
            event.stopPropagation();

            var selectedPath = this.view.selectedPath();
            if (selectedPath == null && this.currentPath.isDirectory()) {
                this.addProjectFolder(this.currentPath.full);
            } else if (selectedPath !== null && !selectedPath.equals(this.currentPath.parent())) {
                this.addProjectFolder(selectedPath.full);
            } else {
                atom.beep();
            }
        }

        /**
         * Autocomplete the current input to the longest common prefix among
         * paths matching the current input. If no change is made to the
         * current path, beep.
         */
    }, {
        key: 'autocomplete',
        value: function autocomplete() {
            var matchingPaths = this.currentPath.matchingPaths();
            if (matchingPaths.length === 0) {
                atom.beep();
            } else if (matchingPaths.length === 1 || config.get('fuzzyMatch')) {
                var newPath = matchingPaths[0];
                if (newPath.isDirectory()) {
                    this.updatePath(newPath.asDirectory());
                } else {
                    this.updatePath(newPath);
                }
            } else {
                var newPath = _models.Path.commonPrefix(matchingPaths);
                if (newPath.equals(this.currentPath)) {
                    atom.beep();
                } else {
                    this.updatePath(newPath);
                }
            }
        }
    }, {
        key: 'toggle',
        value: function toggle() {
            if (this.panel) {
                this.detach();
            } else {
                this.attach();
            }
        }
    }, {
        key: 'splitConfirm',
        value: function splitConfirm(split) {
            return this.confirm.bind(this, undefined, split);
        }
    }, {
        key: 'confirm',
        value: function confirm(event) {
            var split = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

            var selectedPath = this.view.selectedPath();
            if (selectedPath !== null) {
                this.selectPath(selectedPath, split);
            } else {
                this.selectPath(this.currentPath, split);
            }
        }
    }, {
        key: 'confirmSelectedOrFirst',
        value: function confirmSelectedOrFirst() {
            var selectedPath = this.view.selectedPath();
            if (selectedPath !== null) {
                this.selectPath(selectedPath);
            } else {
                var firstPath = this.view.firstPath();
                if (firstPath !== null) {
                    this.selectPath(firstPath);
                } else {
                    this.selectPath(this.currentPath);
                }
            }
        }
    }, {
        key: 'undo',
        value: function undo() {
            if (this.pathHistory.length > 0) {
                this.updatePath(this.pathHistory.pop(), { saveHistory: false });
            } else {
                var initialPath = _models.Path.initial();
                if (!this.currentPath.equals(initialPath)) {
                    this.updatePath(initialPath, { saveHistory: false });
                } else {
                    atom.beep();
                }
            }
        }
    }, {
        key: 'moveCursorDown',
        value: function moveCursorDown() {
            var index = this.view.cursorIndex;
            if (index === null || index === this.view.pathListLength() - 1) {
                index = 0;
            } else {
                index++;
            }

            this.view.setCursorIndex(index);
        }
    }, {
        key: 'moveCursorUp',
        value: function moveCursorUp() {
            var index = this.view.cursorIndex;
            if (index === null || index === 0) {
                index = this.view.pathListLength() - 1;
            } else {
                index--;
            }

            this.view.setCursorIndex(index);
        }
    }, {
        key: 'moveCursorTop',
        value: function moveCursorTop() {
            this.view.setCursorIndex(0);
        }
    }, {
        key: 'moveCursorBottom',
        value: function moveCursorBottom() {
            this.view.setCursorIndex(this.view.pathListLength() - 1);
        }
    }, {
        key: 'detach',
        value: function detach() {
            if (this.panel === null) {
                return;
            }

            this.panel.destroy();
            this.panel = null;
            atom.workspace.getActivePane().activate();
        }
    }, {
        key: 'attach',
        value: function attach() {
            if (this.panel !== null) {
                return;
            }

            var initialPath = _models.Path.initial();
            this.pathHistory = [];
            this.currentPath = initialPath;
            this.updatePath(_models.Path.initial(), { saveHistory: false });
            this.panel = this.view.createModalPanel();
        }
    }]);

    return AdvancedOpenFileController;
})();

exports.AdvancedOpenFileController = AdvancedOpenFileController;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3B5b3VuZy8uYXRvbS9wYWNrYWdlcy9hZHZhbmNlZC1vcGVuLWZpbGUvbGliL2NvbnRyb2xsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7b0JBRW9CLE1BQU07Ozs7b0JBRVEsTUFBTTs7d0JBRWxCLFdBQVc7O3FCQUNmLE9BQU87Ozs7c0JBRUQsVUFBVTs7SUFBdEIsTUFBTTs7c0JBQ0MsVUFBVTs7cUJBQ0EsU0FBUzs7b0JBQ0wsUUFBUTs7Ozs7O0FBS2xDLElBQUksT0FBTyxHQUFHLHVCQUFhLENBQUM7Ozs7SUFHdEIsMEJBQTBCO0FBQ3hCLGFBREYsMEJBQTBCLEdBQ3JCOzhCQURMLDBCQUEwQjs7QUFFL0IsWUFBSSxDQUFDLElBQUksR0FBRyx1QkFBMEIsQ0FBQztBQUN2QyxZQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7QUFDeEIsWUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFDdEIsWUFBSSxDQUFDLFdBQVcsR0FBRywrQkFBeUIsQ0FBQzs7QUFFN0MsWUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUU7QUFDckQsdUNBQTJCLEVBQUksSUFBSSxDQUFDLE1BQU0sTUFBWCxJQUFJLENBQU87U0FDN0MsQ0FBQyxDQUFDLENBQUM7QUFDSixZQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRTtBQUMxRCwwQkFBYyxFQUFJLElBQUksQ0FBQyxPQUFPLE1BQVosSUFBSSxDQUFRO0FBQzlCLHlCQUFhLEVBQUksSUFBSSxDQUFDLE1BQU0sTUFBWCxJQUFJLENBQU87QUFDNUIsNENBQWdDLEVBQUksSUFBSSxDQUFDLHdCQUF3QixNQUE3QixJQUFJLENBQXlCO0FBQ2pFLDZDQUFp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QUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFDdEIsZ0JBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO0FBQy9CLGdCQUFJLENBQUMsVUFBVSxDQUFDLGFBQUssT0FBTyxFQUFFLEVBQUUsRUFBQyxXQUFXLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztBQUN0RCxnQkFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7U0FDN0M7OztXQXhUUSwwQkFBMEIiLCJmaWxlIjoiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2FkdmFuY2VkLW9wZW4tZmlsZS9saWIvY29udHJvbGxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBAYmFiZWwgKi9cblxuaW1wb3J0IHN0ZFBhdGggZnJvbSAncGF0aCc7XG5cbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSAnYXRvbSc7XG5cbmltcG9ydCB7RW1pdHRlcn0gZnJvbSAnZXZlbnQta2l0JztcbmltcG9ydCBvc2VudiBmcm9tICdvc2Vudic7XG5cbmltcG9ydCAqIGFzIGNvbmZpZyBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQge1BhdGh9IGZyb20gJy4vbW9kZWxzJztcbmltcG9ydCB7Z2V0UHJvamVjdFBhdGh9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IEFkdmFuY2VkT3BlbkZpbGVWaWV3IGZyb20gJy4vdmlldyc7XG5cblxuLy8gRW1pdHRlciBmb3Igb3V0c2lkZSBwYWNrYWdlcyB0byBzdWJzY3JpYmUgdG8uIFN1YnNjcmlwdGlvbiBmdW5jdGlvbnNcbi8vIGFyZSBleHBvbnNlZCBpbiAuL2FkdmFuY2VkLW9wZW4tZmlsZVxuZXhwb3J0IGxldCBlbWl0dGVyID0gbmV3IEVtaXR0ZXIoKTtcblxuXG5leHBvcnQgY2xhc3MgQWR2YW5jZWRPcGVuRmlsZUNvbnRyb2xsZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnZpZXcgPSBuZXcgQWR2YW5jZWRPcGVuRmlsZVZpZXcoKTtcbiAgICAgICAgdGhpcy5wYW5lbCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jdXJyZW50UGF0aCA9IG51bGw7XG4gICAgICAgIHRoaXMucGF0aEhpc3RvcnkgPSBbXTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywge1xuICAgICAgICAgICAgJ2FkdmFuY2VkLW9wZW4tZmlsZTp0b2dnbGUnOiA6OnRoaXMudG9nZ2xlXG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJy5hZHZhbmNlZC1vcGVuLWZpbGUnLCB7XG4gICAgICAgICAgICAnY29yZTpjb25maXJtJzogOjp0aGlzLmNvbmZpcm0sXG4gICAgICAgICAgICAnY29yZTpjYW5jZWwnOiA6OnRoaXMuZGV0YWNoLFxuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uOmFkZC1wcm9qZWN0LWZvbGRlcic6IDo6dGhpcy5hZGRTZWxlY3RlZFByb2plY3RGb2xkZXIsXG4gICAgICAgICAgICAnYWR2YW5jZWQtb3Blbi1maWxlOmF1dG9jb21wbGV0ZSc6IDo6dGhpcy5hdXRvY29tcGxldGUsXG4gICAgICAgICAgICAnYWR2YW5jZWQtb3Blbi1maWxlOnVuZG8nOiA6OnRoaXMudW5kbyxcbiAgICAgICAgICAgICdhZHZhbmNlZC1vcGVuLWZpbGU6bW92ZS1jdXJzb3ItZG93bic6IDo6dGhpcy5tb3ZlQ3Vyc29yRG93bixcbiAgICAgICAgICAgICdhZHZhbmNlZC1vcGVuLWZpbGU6bW92ZS1jdXJzb3ItdXAnOiA6OnRoaXMubW92ZUN1cnNvclVwLFxuICAgICAgICAgICAgJ2FkdmFuY2VkLW9wZW4tZmlsZTptb3ZlLWN1cnNvci1ib3R0b20nOiA6OnRoaXMubW92ZUN1cnNvckJvdHRvbSxcbiAgICAgICAgICAgICdhZHZhbmNlZC1vcGVuLWZpbGU6bW92ZS1jdXJzb3ItdG9wJzogOjp0aGlzLm1vdmVDdXJzb3JUb3AsXG4gICAgICAgICAgICAnYWR2YW5jZWQtb3Blbi1maWxlOmNvbmZpcm0tc2VsZWN0ZWQtb3ItZmlyc3QnOiA6OnRoaXMuY29uZmlybVNlbGVjdGVkT3JGaXJzdCxcbiAgICAgICAgICAgICdhZHZhbmNlZC1vcGVuLWZpbGU6ZGVsZXRlLXBhdGgtY29tcG9uZW50JzogOjp0aGlzLmRlbGV0ZVBhdGhDb21wb25lbnQsXG5cbiAgICAgICAgICAgICdwYW5lOnNwbGl0LWxlZnQnOiB0aGlzLnNwbGl0Q29uZmlybSgocGFuZSkgPT4gcGFuZS5zcGxpdExlZnQoKSksXG4gICAgICAgICAgICAncGFuZTpzcGxpdC1yaWdodCc6IHRoaXMuc3BsaXRDb25maXJtKChwYW5lKSA9PiBwYW5lLnNwbGl0UmlnaHQoKSksXG4gICAgICAgICAgICAncGFuZTpzcGxpdC11cCc6IHRoaXMuc3BsaXRDb25maXJtKChwYW5lKSA9PiBwYW5lLnNwbGl0VXAoKSksXG4gICAgICAgICAgICAncGFuZTpzcGxpdC1kb3duJzogdGhpcy5zcGxpdENvbmZpcm0oKHBhbmUpID0+IHBhbmUuc3BsaXREb3duKCkpLFxuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy52aWV3Lm9uRGlkQ2xpY2tGaWxlKDo6dGhpcy5jbGlja0ZpbGUpO1xuICAgICAgICB0aGlzLnZpZXcub25EaWRDbGlja0FkZFByb2plY3RGb2xkZXIoOjp0aGlzLmFkZFByb2plY3RGb2xkZXIpO1xuICAgICAgICB0aGlzLnZpZXcub25EaWRDbGlja091dHNpZGUoOjp0aGlzLmRldGFjaCk7XG4gICAgICAgIHRoaXMudmlldy5vbkRpZFBhdGhDaGFuZ2UoOjp0aGlzLnBhdGhDaGFuZ2UpO1xuICAgIH1cblxuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZXMuZGlzcG9zZSgpO1xuICAgIH1cblxuICAgIGNsaWNrRmlsZShmaWxlTmFtZSkge1xuICAgICAgICB0aGlzLnNlbGVjdFBhdGgobmV3IFBhdGgoZmlsZU5hbWUpKTtcbiAgICB9XG5cbiAgICBwYXRoQ2hhbmdlKG5ld1BhdGgpICB7XG4gICAgICAgIHRoaXMuY3VycmVudFBhdGggPSBuZXdQYXRoO1xuXG4gICAgICAgIGxldCByZXBsYWNlID0gZmFsc2U7XG5cbiAgICAgICAgLy8gU2luY2UgdGhlIHVzZXIgdHlwZWQgdGhpcywgYXBwbHkgZmFzdC1kaXItc3dpdGNoXG4gICAgICAgIC8vIHNob3J0Y3V0cy5cbiAgICAgICAgaWYgKGNvbmZpZy5nZXQoJ2hlbG1EaXJTd2l0Y2gnKSkge1xuICAgICAgICAgICAgaWYgKG5ld1BhdGguaGFzU2hvcnRjdXQoJycpKSB7ICAvLyBFbXB0eSBzaG9ydGN1dCA9PSAnLy8nXG4gICAgICAgICAgICAgICAgbmV3UGF0aCA9IG5ld1BhdGgucm9vdCgpO1xuICAgICAgICAgICAgICAgIHJlcGxhY2UgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChuZXdQYXRoLmhhc1Nob3J0Y3V0KCd+JykpIHtcbiAgICAgICAgICAgICAgICBuZXdQYXRoID0gbmV3IFBhdGgob3NlbnYuaG9tZSgpICsgc3RkUGF0aC5zZXApO1xuICAgICAgICAgICAgICAgIHJlcGxhY2UgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChuZXdQYXRoLmhhc1Nob3J0Y3V0KCc6JykpIHtcbiAgICAgICAgICAgICAgICBsZXQgcHJvamVjdFBhdGggPSBnZXRQcm9qZWN0UGF0aCgpO1xuICAgICAgICAgICAgICAgIGlmIChwcm9qZWN0UGF0aCkge1xuICAgICAgICAgICAgICAgICAgICBuZXdQYXRoID0gbmV3IFBhdGgocHJvamVjdFBhdGggKyBuZXdQYXRoLnNlcCk7XG4gICAgICAgICAgICAgICAgICAgIHJlcGxhY2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHdlJ3JlIHJlcGxhY2luZyB0aGUgcGF0aCwgc2F2ZSBpdCBpbiB0aGUgaGlzdG9yeSBhbmQgc2V0IHRoZSBwYXRoLlxuICAgICAgICAvLyBJZiB3ZSBhcmVuJ3QsIHRoZSB1c2VyIGlzIGp1c3QgdHlwaW5nIGFuZCB3ZSBkb24ndCBuZWVkIHRoZSBoaXN0b3J5XG4gICAgICAgIC8vIGFuZCB3YW50IHRvIGF2b2lkIHNldHRpbmcgdGhlIHBhdGggd2hpY2ggcmVzZXRzIHRoZSBjdXJzb3IuXG4gICAgICAgIGlmIChyZXBsYWNlKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVBhdGgobmV3UGF0aCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZWxlY3RQYXRoKG5ld1BhdGgsIHNwbGl0PWZhbHNlKSB7XG4gICAgICAgIGlmIChuZXdQYXRoLmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgIGlmIChzcGxpdCAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBhdG9tLmJlZXAoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVQYXRoKG5ld1BhdGguYXNEaXJlY3RvcnkoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc3BsaXQgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICB0aGlzLnNwbGl0T3BlblBhdGgobmV3UGF0aCwgc3BsaXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5vcGVuUGF0aChuZXdQYXRoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZVBhdGgobmV3UGF0aCwge3NhdmVIaXN0b3J5PXRydWV9PXt9KSB7XG4gICAgICAgIGlmIChzYXZlSGlzdG9yeSkge1xuICAgICAgICAgICAgdGhpcy5wYXRoSGlzdG9yeS5wdXNoKHRoaXMuY3VycmVudFBhdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdXJyZW50UGF0aCA9IG5ld1BhdGg7XG4gICAgICAgIHRoaXMudmlldy5zZXRQYXRoKG5ld1BhdGgpO1xuICAgIH1cblxuICAgIHNwbGl0T3BlblBhdGgocGF0aCwgc3BsaXQpIHtcbiAgICAgICAgc3BsaXQoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpKTtcbiAgICAgICAgdGhpcy5vcGVuUGF0aChwYXRoKTtcbiAgICB9XG5cbiAgICBvcGVuUGF0aChwYXRoKSB7XG4gICAgICAgIGlmIChwYXRoLmV4aXN0cygpKSB7XG4gICAgICAgICAgICBpZiAocGF0aC5pc0ZpbGUoKSkge1xuICAgICAgICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4ocGF0aC5hYnNvbHV0ZSk7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5lbWl0KCdkaWQtb3Blbi1wYXRoJywgcGF0aC5hYnNvbHV0ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXRhY2goKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXRvbS5iZWVwKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAocGF0aC5mcmFnbWVudCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBwYXRoLmNyZWF0ZURpcmVjdG9yaWVzKCk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbmZpZy5nZXQoJ2NyZWF0ZUZpbGVJbnN0YW50bHknKSkge1xuICAgICAgICAgICAgICAgICAgICBwYXRoLmNyZWF0ZUZpbGUoKTtcbiAgICAgICAgICAgICAgICAgICAgZW1pdHRlci5lbWl0KCdkaWQtY3JlYXRlLXBhdGgnLCBwYXRoLmFic29sdXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihwYXRoLmFic29sdXRlKTtcbiAgICAgICAgICAgICAgICBlbWl0dGVyLmVtaXQoJ2RpZC1vcGVuLXBhdGgnLCBwYXRoLmFic29sdXRlKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcignQ291bGQgbm90IG9wZW4gZmlsZScsIHtcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBlcnIsXG4gICAgICAgICAgICAgICAgICAgIGljb246ICdhbGVydCcsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGV0YWNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoY29uZmlnLmdldCgnY3JlYXRlRGlyZWN0b3JpZXMnKSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBwYXRoLmNyZWF0ZURpcmVjdG9yaWVzKCk7XG4gICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFN1Y2Nlc3MoJ0RpcmVjdG9yeSBjcmVhdGVkJywge1xuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IGBDcmVhdGVkIGRpcmVjdG9yeSBcIiR7cGF0aC5mdWxsfVwiLmAsXG4gICAgICAgICAgICAgICAgICAgIGljb246ICdmaWxlLWRpcmVjdG9yeScsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZW1pdHRlci5lbWl0KCdkaWQtY3JlYXRlLXBhdGgnLCBwYXRoLmFic29sdXRlKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRldGFjaCgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKCdDb3VsZCBub3QgY3JlYXRlIGRpcmVjdG9yeScsIHtcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBlcnIsXG4gICAgICAgICAgICAgICAgICAgIGljb246ICdmaWxlLWRpcmVjdG9yeScsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGV0YWNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhdG9tLmJlZXAoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRlbGV0ZVBhdGhDb21wb25lbnQoKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRQYXRoLmlzUm9vdCgpKSB7XG4gICAgICAgICAgICBhdG9tLmJlZXAoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlUGF0aCh0aGlzLmN1cnJlbnRQYXRoLnBhcmVudCgpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFkZFByb2plY3RGb2xkZXIoZmlsZU5hbWUpIHtcbiAgICAgICAgbGV0IGZvbGRlclBhdGggPSBuZXcgUGF0aChmaWxlTmFtZSk7XG4gICAgICAgIGlmIChmb2xkZXJQYXRoLmlzRGlyZWN0b3J5KCkgJiYgIWZvbGRlclBhdGguaXNQcm9qZWN0RGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgIGF0b20ucHJvamVjdC5hZGRQYXRoKGZvbGRlclBhdGguYWJzb2x1dGUpO1xuICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFN1Y2Nlc3MoJ0FkZGVkIHByb2plY3QgZm9sZGVyJywge1xuICAgICAgICAgICAgICAgIGRldGFpbDogYEFkZGVkIFwiJHtmb2xkZXJQYXRoLmZ1bGx9XCIgYXMgYSBwcm9qZWN0IGZvbGRlci5gLFxuICAgICAgICAgICAgICAgIGljb246ICdmaWxlLWRpcmVjdG9yeScsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMudmlldy5yZWZyZXNoUGF0aExpc3RJdGVtKGZvbGRlclBhdGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXRvbS5iZWVwKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhZGRTZWxlY3RlZFByb2plY3RGb2xkZXIoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgbGV0IHNlbGVjdGVkUGF0aCA9IHRoaXMudmlldy5zZWxlY3RlZFBhdGgoKTtcbiAgICAgICAgaWYgKHNlbGVjdGVkUGF0aCA9PSBudWxsICYmIHRoaXMuY3VycmVudFBhdGguaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgdGhpcy5hZGRQcm9qZWN0Rm9sZGVyKHRoaXMuY3VycmVudFBhdGguZnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2VsZWN0ZWRQYXRoICE9PSBudWxsICYmICFzZWxlY3RlZFBhdGguZXF1YWxzKHRoaXMuY3VycmVudFBhdGgucGFyZW50KCkpKSB7XG4gICAgICAgICAgICB0aGlzLmFkZFByb2plY3RGb2xkZXIoc2VsZWN0ZWRQYXRoLmZ1bGwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXRvbS5iZWVwKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBdXRvY29tcGxldGUgdGhlIGN1cnJlbnQgaW5wdXQgdG8gdGhlIGxvbmdlc3QgY29tbW9uIHByZWZpeCBhbW9uZ1xuICAgICAqIHBhdGhzIG1hdGNoaW5nIHRoZSBjdXJyZW50IGlucHV0LiBJZiBubyBjaGFuZ2UgaXMgbWFkZSB0byB0aGVcbiAgICAgKiBjdXJyZW50IHBhdGgsIGJlZXAuXG4gICAgICovXG4gICAgYXV0b2NvbXBsZXRlKCkge1xuICAgICAgICBsZXQgbWF0Y2hpbmdQYXRocyA9IHRoaXMuY3VycmVudFBhdGgubWF0Y2hpbmdQYXRocygpO1xuICAgICAgICBpZiAobWF0Y2hpbmdQYXRocy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGF0b20uYmVlcCgpO1xuICAgICAgICB9IGVsc2UgaWYgKG1hdGNoaW5nUGF0aHMubGVuZ3RoID09PSAxIHx8IGNvbmZpZy5nZXQoJ2Z1enp5TWF0Y2gnKSkge1xuICAgICAgICAgICAgbGV0IG5ld1BhdGggPSBtYXRjaGluZ1BhdGhzWzBdO1xuICAgICAgICAgICAgaWYgKG5ld1BhdGguaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUGF0aChuZXdQYXRoLmFzRGlyZWN0b3J5KCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVBhdGgobmV3UGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgbmV3UGF0aCA9IFBhdGguY29tbW9uUHJlZml4KG1hdGNoaW5nUGF0aHMpO1xuICAgICAgICAgICAgaWYgKG5ld1BhdGguZXF1YWxzKHRoaXMuY3VycmVudFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgYXRvbS5iZWVwKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUGF0aChuZXdQYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRvZ2dsZSgpIHtcbiAgICAgICAgaWYgKHRoaXMucGFuZWwpIHtcbiAgICAgICAgICAgIHRoaXMuZGV0YWNoKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmF0dGFjaCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3BsaXRDb25maXJtKHNwbGl0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpcm0uYmluZCh0aGlzLCB1bmRlZmluZWQsIHNwbGl0KTtcbiAgICB9XG5cbiAgICBjb25maXJtKGV2ZW50LCBzcGxpdD1mYWxzZSkge1xuICAgICAgICBsZXQgc2VsZWN0ZWRQYXRoID0gdGhpcy52aWV3LnNlbGVjdGVkUGF0aCgpO1xuICAgICAgICBpZiAoc2VsZWN0ZWRQYXRoICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdFBhdGgoc2VsZWN0ZWRQYXRoLCBzcGxpdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdFBhdGgodGhpcy5jdXJyZW50UGF0aCwgc3BsaXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uZmlybVNlbGVjdGVkT3JGaXJzdCgpIHtcbiAgICAgICAgbGV0IHNlbGVjdGVkUGF0aCA9IHRoaXMudmlldy5zZWxlY3RlZFBhdGgoKTtcbiAgICAgICAgaWYgKHNlbGVjdGVkUGF0aCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RQYXRoKHNlbGVjdGVkUGF0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgZmlyc3RQYXRoID0gdGhpcy52aWV3LmZpcnN0UGF0aCgpO1xuICAgICAgICAgICAgaWYgKGZpcnN0UGF0aCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0UGF0aChmaXJzdFBhdGgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdFBhdGgodGhpcy5jdXJyZW50UGF0aClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVuZG8oKSB7XG4gICAgICAgIGlmICh0aGlzLnBhdGhIaXN0b3J5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlUGF0aCh0aGlzLnBhdGhIaXN0b3J5LnBvcCgpLCB7c2F2ZUhpc3Rvcnk6IGZhbHNlfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgaW5pdGlhbFBhdGggPSBQYXRoLmluaXRpYWwoKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5jdXJyZW50UGF0aC5lcXVhbHMoaW5pdGlhbFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVQYXRoKGluaXRpYWxQYXRoLCB7c2F2ZUhpc3Rvcnk6IGZhbHNlfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGF0b20uYmVlcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgbW92ZUN1cnNvckRvd24oKSB7XG4gICAgICAgIGxldCBpbmRleCA9IHRoaXMudmlldy5jdXJzb3JJbmRleDtcbiAgICAgICAgaWYgKGluZGV4ID09PSBudWxsIHx8IGluZGV4ID09PSB0aGlzLnZpZXcucGF0aExpc3RMZW5ndGgoKSAtIDEpIHtcbiAgICAgICAgICAgIGluZGV4ID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnZpZXcuc2V0Q3Vyc29ySW5kZXgoaW5kZXgpO1xuICAgIH1cblxuICAgIG1vdmVDdXJzb3JVcCgpIHtcbiAgICAgICAgbGV0IGluZGV4ID0gdGhpcy52aWV3LmN1cnNvckluZGV4O1xuICAgICAgICBpZiAoaW5kZXggPT09IG51bGwgfHwgaW5kZXggPT09IDApIHtcbiAgICAgICAgICAgIGluZGV4ID0gdGhpcy52aWV3LnBhdGhMaXN0TGVuZ3RoKCkgLSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW5kZXgtLTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudmlldy5zZXRDdXJzb3JJbmRleChpbmRleCk7XG4gICAgfVxuXG4gICAgbW92ZUN1cnNvclRvcCgpIHtcbiAgICAgICAgdGhpcy52aWV3LnNldEN1cnNvckluZGV4KDApO1xuICAgIH1cblxuICAgIG1vdmVDdXJzb3JCb3R0b20oKSB7XG4gICAgICAgIHRoaXMudmlldy5zZXRDdXJzb3JJbmRleCh0aGlzLnZpZXcucGF0aExpc3RMZW5ndGgoKSAtIDEpO1xuICAgIH1cblxuICAgIGRldGFjaCgpIHtcbiAgICAgICAgaWYgKHRoaXMucGFuZWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGFuZWwuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLnBhbmVsID0gbnVsbDtcbiAgICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlKCk7XG4gICAgfVxuXG4gICAgYXR0YWNoKCkge1xuICAgICAgICBpZiAodGhpcy5wYW5lbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGluaXRpYWxQYXRoID0gUGF0aC5pbml0aWFsKCk7XG4gICAgICAgIHRoaXMucGF0aEhpc3RvcnkgPSBbXTtcbiAgICAgICAgdGhpcy5jdXJyZW50UGF0aCA9IGluaXRpYWxQYXRoO1xuICAgICAgICB0aGlzLnVwZGF0ZVBhdGgoUGF0aC5pbml0aWFsKCksIHtzYXZlSGlzdG9yeTogZmFsc2V9KTtcbiAgICAgICAgdGhpcy5wYW5lbCA9IHRoaXMudmlldy5jcmVhdGVNb2RhbFBhbmVsKCk7XG4gICAgfVxufVxuIl19