Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createDecoratedClass = (function () { function defineProperties(target, descriptors, initializers) { for (var i = 0; i < descriptors.length; i++) { var descriptor = descriptors[i]; var decorators = descriptor.decorators; var key = descriptor.key; delete descriptor.key; delete descriptor.decorators; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor || descriptor.initializer) descriptor.writable = true; if (decorators) { for (var f = 0; f < decorators.length; f++) { var decorator = decorators[f]; if (typeof decorator === 'function') { descriptor = decorator(target, key, descriptor) || descriptor; } else { throw new TypeError('The decorator for method ' + descriptor.key + ' is of the invalid type ' + typeof decorator); } } if (descriptor.initializer !== undefined) { initializers[key] = descriptor; continue; } } Object.defineProperty(target, key, descriptor); } } return function (Constructor, protoProps, staticProps, protoInitializers, staticInitializers) { if (protoProps) defineProperties(Constructor.prototype, protoProps, protoInitializers); if (staticProps) defineProperties(Constructor, staticProps, staticInitializers); return Constructor; }; })();

exports.consumeElementIcons = consumeElementIcons;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */

var _atom = require('atom');

var _eventKit = require('event-kit');

var _config = require('./config');

var config = _interopRequireWildcard(_config);

var _models = require('./models');

var _utils = require('./utils');

var addIconToElement = null;

/**
 * Consumer for file-icons
 * https://github.com/DanBrooker/file-icons
 */

function consumeElementIcons(cb) {
    addIconToElement = cb;
    return new _atom.Disposable(function () {
        addIconToElement = null;
    });
}

var AdvancedOpenFileView = (function () {
    function AdvancedOpenFileView() {
        var _this = this;

        _classCallCheck(this, AdvancedOpenFileView);

        this.emitter = new _eventKit.Emitter();
        this.cursorIndex = null;
        this._updatingPath = false;

        // Element references
        this.pathInput = this.content.querySelector('.path-input');
        this.pathList = this.content.querySelector('.list-group');
        this.parentDirectoryListItem = this.content.querySelector('.parent-directory');

        // Initialize text editor
        this.pathEditor = this.pathInput.getModel();
        this.pathEditor.setPlaceholderText('/path/to/file.txt');
        this.pathEditor.setSoftWrapped(false);

        // Update the path list whenever the path changes.
        this.pathEditor.onDidChange(function () {
            var newPath = new _models.Path(_this.pathEditor.getText());

            _this.parentDirectoryListItem.dataset.fileName = newPath.parent().full;

            _this.setPathList(newPath.matchingPaths(), {
                hideParent: newPath.fragment !== '' || newPath.isRoot(),
                sort: !(config.get('fuzzyMatch') && newPath.fragment !== '')
            });
        });

        this.content.addEventListener('click', function (ev) {
            // Keep focus on the text input and do not propagate so that the
            // outside click handler doesn't pick up the event.
            ev.stopPropagation();
            _this.pathInput.focus();
        });

        this.content.addEventListener('click', function (ev) {
            var _context;

            if ((_context = ev.target, _utils.closest).call(_context, '.add-project-folder') !== null) {
                var _context2;

                var _listItem = (_context2 = ev.target, _utils.closest).call(_context2, '.list-item');
                _this.emitter.emit('did-click-add-project-folder', _listItem.dataset.fileName);
                return; // Don't try to enter the folder too!
            }

            var listItem = (_context = ev.target, _utils.closest).call(_context, '.list-item');
            if (listItem !== null) {
                _this.emitter.emit('did-click-file', listItem.dataset.fileName);
            }
        });
    }

    _createDecoratedClass(AdvancedOpenFileView, [{
        key: 'createPathListItem',
        value: function createPathListItem(path) {
            var icon = path.isDirectory() ? 'icon-file-directory' : 'icon-file-text';
            return '\n            <li class="list-item ' + (path.isDirectory() ? 'directory' : '') + '"\n                data-file-name="' + path.full + '">\n                <span class="filename icon ' + icon + '"\n                      data-name="' + path.fragment + '">\n                    ' + path.fragment + '\n                </span>\n                ' + (path.isDirectory() && !path.isProjectDirectory() ? this.addProjectButton() : '') + '\n            </li>\n        ';
        }
    }, {
        key: 'addProjectButton',
        value: function addProjectButton() {
            return '\n            <span class="add-project-folder icon icon-plus"\n                title="Open as project folder">\n            </span>\n        ';
        }
    }, {
        key: 'createModalPanel',
        value: function createModalPanel() {
            var _this2 = this;

            var panel = atom.workspace.addModalPanel({
                item: this.content
            });

            // Bind the outside click handler and destroy it when the panel is
            // destroyed.
            var outsideClickHandler = function outsideClickHandler(ev) {
                var _context3;

                if ((_context3 = ev.target, _utils.closest).call(_context3, '.advanced-open-file') === null) {
                    _this2.emitter.emit('did-click-outside');
                }
            };

            document.documentElement.addEventListener('click', outsideClickHandler);
            panel.onDidDestroy(function () {
                document.documentElement.removeEventListener('click', outsideClickHandler);
            });

            var modal = this.content.parentNode;
            modal.style.maxHeight = document.body.clientHeight - modal.offsetTop + 'px';
            modal.style.display = 'flex';
            modal.style.flexDirection = 'column';

            this.pathInput.focus();

            return panel;
        }

        /**
         * Re-render list item for the given path, if it exists.
         */
    }, {
        key: 'refreshPathListItem',
        value: function refreshPathListItem(path) {
            var listItem = this.content.querySelector('.list-item[data-file-name="' + path.full + '"]');
            if (listItem) {
                var newListItem = (0, _utils.dom)(this.createPathListItem(path));
                listItem.parentNode.replaceChild(newListItem, listItem);
            }
        }
    }, {
        key: 'onDidClickFile',
        value: function onDidClickFile(callback) {
            this.emitter.on('did-click-file', callback);
        }
    }, {
        key: 'onDidClickAddProjectFolder',
        value: function onDidClickAddProjectFolder(callback) {
            this.emitter.on('did-click-add-project-folder', callback);
        }
    }, {
        key: 'onDidClickOutside',
        value: function onDidClickOutside(callback) {
            this.emitter.on('did-click-outside', callback);
        }

        /**
         * Subscribe to user-initiated changes in the path.
         */
    }, {
        key: 'onDidPathChange',
        value: function onDidPathChange(callback) {
            var _this3 = this;

            this.pathEditor.onDidChange(function () {
                if (!_this3._updatingPath) {
                    callback(new _models.Path(_this3.pathEditor.getText()));
                }
            });
        }
    }, {
        key: 'selectedPath',
        value: function selectedPath() {
            if (this.cursorIndex !== null) {
                var selected = this.pathList.querySelector('.list-item.selected');
                if (selected !== null) {
                    return new _models.Path(selected.dataset.fileName);
                }
            }

            return null;
        }
    }, {
        key: 'firstPath',
        value: function firstPath() {
            var pathItems = this.pathList.querySelectorAll('.list-item:not(.parent-directory)');
            if (pathItems.length > 0) {
                return new _models.Path(pathItems[0].dataset.fileName);
            } else {
                return null;
            }
        }
    }, {
        key: 'pathListLength',
        value: function pathListLength() {
            return this.pathList.querySelectorAll('.list-item:not(.hidden)').length;
        }
    }, {
        key: 'setPath',
        value: function setPath(path) {
            this._updatingPath = true;

            this.pathEditor.setText(path.full);
            this.pathEditor.scrollToCursorPosition();

            this._updatingPath = false;
        }
    }, {
        key: 'forEachListItem',
        value: function forEachListItem(selector, callback) {
            var listItems = this.pathList.querySelectorAll(selector);
            for (var k = 0; k < listItems.length; k++) {
                callback(listItems[k]);
            }
        }
    }, {
        key: 'setPathList',
        value: function setPathList(paths) {
            var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            var _ref$hideParent = _ref.hideParent;
            var hideParent = _ref$hideParent === undefined ? false : _ref$hideParent;
            var _ref$sort = _ref.sort;
            var sort = _ref$sort === undefined ? true : _ref$sort;

            this.cursorIndex = null;

            this.forEachListItem('.list-item.selected', function (listItem) {
                listItem.classList.remove('selected');
            });

            this.forEachListItem('.list-item:not(.parent-directory)', function (listItem) {
                listItem.remove();
            });

            if (paths.length === 0 || hideParent) {
                this.parentDirectoryListItem.classList.add('hidden');
            } else {
                this.parentDirectoryListItem.classList.remove('hidden');
            }

            if (paths.length > 0) {
                if (sort) {
                    // Split list into directories and files and sort them.
                    paths = paths.sort(_models.Path.compare);
                    var directoryPaths = paths.filter(function (path) {
                        return path.isDirectory();
                    });
                    var filePaths = paths.filter(function (path) {
                        return path.isFile();
                    });
                    this._appendToPathList(directoryPaths);
                    this._appendToPathList(filePaths);
                } else {
                    this._appendToPathList(paths);
                }
            }
        }
    }, {
        key: '_appendToPathList',
        value: function _appendToPathList(paths) {
            for (var path of paths) {
                if (path.exists()) {
                    var listItem = (0, _utils.dom)(this.createPathListItem(path));
                    if (addIconToElement) {
                        var filenameElement = listItem.querySelector('.filename.icon');
                        filenameElement.classList.remove('icon-file-text', 'icon-file-directory');
                        addIconToElement(filenameElement, path.absolute);
                    }
                    this.pathList.appendChild(listItem);
                }
            }
        }
    }, {
        key: 'setCursorIndex',
        value: function setCursorIndex(index) {
            if (index < 0 || index >= this.pathListLength()) {
                index = null;
            }

            this.cursorIndex = index;
            this.forEachListItem('.list-item.selected', function (listItem) {
                listItem.classList.remove('selected');
            });

            if (this.cursorIndex !== null) {
                var listItems = this.pathList.querySelectorAll('.list-item:not(.hidden)');
                if (listItems.length > index) {
                    var selected = listItems[index];
                    selected.classList.add('selected');

                    // If the selected element is out of view, scroll it into view.
                    var parentElement = selected.parentElement;
                    var selectedTop = selected.offsetTop;
                    var parentScrollBottom = parentElement.scrollTop + parentElement.clientHeight;
                    if (selectedTop < parentElement.scrollTop) {
                        parentElement.scrollTop = selectedTop;
                    } else if (selectedTop >= parentScrollBottom) {
                        var selectedBottom = selectedTop + selected.clientHeight;
                        parentElement.scrollTop += selectedBottom - parentScrollBottom;
                    }
                }
            }
        }
    }, {
        key: 'content',
        decorators: [_utils.cachedProperty],
        get: function get() {
            return (0, _utils.dom)('\n            <div class="advanced-open-file">\n                <p class="info-message icon icon-file-add">\n                    Enter the path for the file to open or create.\n                </p>\n                <div class="path-input-container">\n                    <atom-text-editor class="path-input" mini></atom-text-editor>\n                </div>\n                <ul class="list-group">\n                    <li class="list-item parent-directory">\n                        <span class="icon icon-file-directory">..</span>\n                    </li>\n                </ul>\n            </div>\n        ');
        }
    }]);

    return AdvancedOpenFileView;
})();

exports['default'] = AdvancedOpenFileView;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3B5b3VuZy8uYXRvbS9wYWNrYWdlcy9hZHZhbmNlZC1vcGVuLWZpbGUvbGliL3ZpZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7b0JBQ3lCLE1BQU07O3dCQUNULFdBQVc7O3NCQUVULFVBQVU7O0lBQXRCLE1BQU07O3NCQUNDLFVBQVU7O3FCQUNjLFNBQVM7O0FBRXBELElBQUksZ0JBQWdCLEdBQUcsSUFBSSxDQUFDOzs7Ozs7O0FBTXJCLFNBQVMsbUJBQW1CLENBQUMsRUFBRSxFQUFFO0FBQ3BDLG9CQUFnQixHQUFHLEVBQUUsQ0FBQztBQUN0QixXQUFPLHFCQUFlLFlBQU07QUFDeEIsd0JBQWdCLEdBQUcsSUFBSSxDQUFDO0tBQzNCLENBQUMsQ0FBQztDQUNOOztJQUVvQixvQkFBb0I7QUFDMUIsYUFETSxvQkFBb0IsR0FDdkI7Ozs4QkFERyxvQkFBb0I7O0FBRWpDLFlBQUksQ0FBQyxPQUFPLEdBQUcsdUJBQWEsQ0FBQztBQUM3QixZQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztBQUN4QixZQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQzs7O0FBRzNCLFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDM0QsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUMxRCxZQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsQ0FBQzs7O0FBRy9FLFlBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUM1QyxZQUFJLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDeEQsWUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENB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a0IsRUFBRTtBQUMxQyw0QkFBSSxjQUFjLEdBQUcsV0FBVyxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUM7QUFDekQscUNBQWEsQ0FBQyxTQUFTLElBQUksY0FBYyxHQUFHLGtCQUFrQixDQUFDO3FCQUNsRTtpQkFDSjthQUNKO1NBQ0o7Ozs7YUF6TlUsZUFBRztBQUNWLG1CQUFPLHVuQkFjTCxDQUFDO1NBQ047OztXQWxFZ0Isb0JBQW9COzs7cUJBQXBCLG9CQUFvQiIsImZpbGUiOiIvaG9tZS9weW91bmcvLmF0b20vcGFja2FnZXMvYWR2YW5jZWQtb3Blbi1maWxlL2xpYi92aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuaW1wb3J0IHtEaXNwb3NhYmxlfSBmcm9tICdhdG9tJztcbmltcG9ydCB7RW1pdHRlcn0gZnJvbSAnZXZlbnQta2l0JztcblxuaW1wb3J0ICogYXMgY29uZmlnIGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB7UGF0aH0gZnJvbSAnLi9tb2RlbHMnO1xuaW1wb3J0IHtjYWNoZWRQcm9wZXJ0eSwgY2xvc2VzdCwgZG9tfSBmcm9tICcuL3V0aWxzJztcblxubGV0IGFkZEljb25Ub0VsZW1lbnQgPSBudWxsO1xuXG4vKipcbiAqIENvbnN1bWVyIGZvciBmaWxlLWljb25zXG4gKiBodHRwczovL2dpdGh1Yi5jb20vRGFuQnJvb2tlci9maWxlLWljb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lRWxlbWVudEljb25zKGNiKSB7XG4gICAgYWRkSWNvblRvRWxlbWVudCA9IGNiO1xuICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICAgIGFkZEljb25Ub0VsZW1lbnQgPSBudWxsO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBZHZhbmNlZE9wZW5GaWxlVmlldyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZW1pdHRlciA9IG5ldyBFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMuY3Vyc29ySW5kZXggPSBudWxsO1xuICAgICAgICB0aGlzLl91cGRhdGluZ1BhdGggPSBmYWxzZTtcblxuICAgICAgICAvLyBFbGVtZW50IHJlZmVyZW5jZXNcbiAgICAgICAgdGhpcy5wYXRoSW5wdXQgPSB0aGlzLmNvbnRlbnQucXVlcnlTZWxlY3RvcignLnBhdGgtaW5wdXQnKTtcbiAgICAgICAgdGhpcy5wYXRoTGlzdCA9IHRoaXMuY29udGVudC5xdWVyeVNlbGVjdG9yKCcubGlzdC1ncm91cCcpO1xuICAgICAgICB0aGlzLnBhcmVudERpcmVjdG9yeUxpc3RJdGVtID0gdGhpcy5jb250ZW50LnF1ZXJ5U2VsZWN0b3IoJy5wYXJlbnQtZGlyZWN0b3J5Jyk7XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSB0ZXh0IGVkaXRvclxuICAgICAgICB0aGlzLnBhdGhFZGl0b3IgPSB0aGlzLnBhdGhJbnB1dC5nZXRNb2RlbCgpO1xuICAgICAgICB0aGlzLnBhdGhFZGl0b3Iuc2V0UGxhY2Vob2xkZXJUZXh0KCcvcGF0aC90by9maWxlLnR4dCcpO1xuICAgICAgICB0aGlzLnBhdGhFZGl0b3Iuc2V0U29mdFdyYXBwZWQoZmFsc2UpO1xuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgcGF0aCBsaXN0IHdoZW5ldmVyIHRoZSBwYXRoIGNoYW5nZXMuXG4gICAgICAgIHRoaXMucGF0aEVkaXRvci5vbkRpZENoYW5nZSgoKSA9PiB7XG4gICAgICAgICAgICBsZXQgbmV3UGF0aCA9IG5ldyBQYXRoKHRoaXMucGF0aEVkaXRvci5nZXRUZXh0KCkpO1xuXG4gICAgICAgICAgICB0aGlzLnBhcmVudERpcmVjdG9yeUxpc3RJdGVtLmRhdGFzZXQuZmlsZU5hbWUgPSBuZXdQYXRoLnBhcmVudCgpLmZ1bGw7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0UGF0aExpc3QobmV3UGF0aC5tYXRjaGluZ1BhdGhzKCksIHtcbiAgICAgICAgICAgICAgICBoaWRlUGFyZW50OiBuZXdQYXRoLmZyYWdtZW50ICE9PSAnJyB8fCBuZXdQYXRoLmlzUm9vdCgpLFxuICAgICAgICAgICAgICAgIHNvcnQ6ICEoY29uZmlnLmdldCgnZnV6enlNYXRjaCcpICYmIG5ld1BhdGguZnJhZ21lbnQgIT09ICcnKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmNvbnRlbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXYpID0+IHtcbiAgICAgICAgICAgIC8vIEtlZXAgZm9jdXMgb24gdGhlIHRleHQgaW5wdXQgYW5kIGRvIG5vdCBwcm9wYWdhdGUgc28gdGhhdCB0aGVcbiAgICAgICAgICAgIC8vIG91dHNpZGUgY2xpY2sgaGFuZGxlciBkb2Vzbid0IHBpY2sgdXAgdGhlIGV2ZW50LlxuICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB0aGlzLnBhdGhJbnB1dC5mb2N1cygpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmNvbnRlbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXYpID0+IHtcbiAgICAgICAgICAgIGlmIChldi50YXJnZXQ6OmNsb3Nlc3QoJy5hZGQtcHJvamVjdC1mb2xkZXInKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGxldCBsaXN0SXRlbSA9IGV2LnRhcmdldDo6Y2xvc2VzdCgnLmxpc3QtaXRlbScpO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtY2xpY2stYWRkLXByb2plY3QtZm9sZGVyJywgbGlzdEl0ZW0uZGF0YXNldC5maWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuOyAvLyBEb24ndCB0cnkgdG8gZW50ZXIgdGhlIGZvbGRlciB0b28hXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBsaXN0SXRlbSA9IGV2LnRhcmdldDo6Y2xvc2VzdCgnLmxpc3QtaXRlbScpO1xuICAgICAgICAgICAgaWYgKGxpc3RJdGVtICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1jbGljay1maWxlJywgbGlzdEl0ZW0uZGF0YXNldC5maWxlTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIEBjYWNoZWRQcm9wZXJ0eVxuICAgIGdldCBjb250ZW50KCkge1xuICAgICAgICByZXR1cm4gZG9tKGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhZHZhbmNlZC1vcGVuLWZpbGVcIj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzcz1cImluZm8tbWVzc2FnZSBpY29uIGljb24tZmlsZS1hZGRcIj5cbiAgICAgICAgICAgICAgICAgICAgRW50ZXIgdGhlIHBhdGggZm9yIHRoZSBmaWxlIHRvIG9wZW4gb3IgY3JlYXRlLlxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGF0aC1pbnB1dC1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGF0b20tdGV4dC1lZGl0b3IgY2xhc3M9XCJwYXRoLWlucHV0XCIgbWluaT48L2F0b20tdGV4dC1lZGl0b3I+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPHVsIGNsYXNzPVwibGlzdC1ncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3M9XCJsaXN0LWl0ZW0gcGFyZW50LWRpcmVjdG9yeVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJpY29uIGljb24tZmlsZS1kaXJlY3RvcnlcIj4uLjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGNyZWF0ZVBhdGhMaXN0SXRlbShwYXRoKSB7XG4gICAgICAgIGxldCBpY29uID0gcGF0aC5pc0RpcmVjdG9yeSgpID8gJ2ljb24tZmlsZS1kaXJlY3RvcnknIDogJ2ljb24tZmlsZS10ZXh0JztcbiAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgIDxsaSBjbGFzcz1cImxpc3QtaXRlbSAke3BhdGguaXNEaXJlY3RvcnkoKSA/ICdkaXJlY3RvcnknIDogJyd9XCJcbiAgICAgICAgICAgICAgICBkYXRhLWZpbGUtbmFtZT1cIiR7cGF0aC5mdWxsfVwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiZmlsZW5hbWUgaWNvbiAke2ljb259XCJcbiAgICAgICAgICAgICAgICAgICAgICBkYXRhLW5hbWU9XCIke3BhdGguZnJhZ21lbnR9XCI+XG4gICAgICAgICAgICAgICAgICAgICR7cGF0aC5mcmFnbWVudH1cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgJHtwYXRoLmlzRGlyZWN0b3J5KCkgJiYgIXBhdGguaXNQcm9qZWN0RGlyZWN0b3J5KClcbiAgICAgICAgICAgICAgICAgICAgPyB0aGlzLmFkZFByb2plY3RCdXR0b24oKVxuICAgICAgICAgICAgICAgICAgICA6ICcnfVxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgYDtcbiAgICB9XG5cbiAgICBhZGRQcm9qZWN0QnV0dG9uKCkge1xuICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJhZGQtcHJvamVjdC1mb2xkZXIgaWNvbiBpY29uLXBsdXNcIlxuICAgICAgICAgICAgICAgIHRpdGxlPVwiT3BlbiBhcyBwcm9qZWN0IGZvbGRlclwiPlxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICBgO1xuICAgIH1cblxuICAgIGNyZWF0ZU1vZGFsUGFuZWwoKSB7XG4gICAgICAgIGxldCBwYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoe1xuICAgICAgICAgICAgaXRlbTogdGhpcy5jb250ZW50LFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBCaW5kIHRoZSBvdXRzaWRlIGNsaWNrIGhhbmRsZXIgYW5kIGRlc3Ryb3kgaXQgd2hlbiB0aGUgcGFuZWwgaXNcbiAgICAgICAgLy8gZGVzdHJveWVkLlxuICAgICAgICBsZXQgb3V0c2lkZUNsaWNrSGFuZGxlciA9IChldikgPT4ge1xuICAgICAgICAgICAgaWYgKGV2LnRhcmdldDo6Y2xvc2VzdCgnLmFkdmFuY2VkLW9wZW4tZmlsZScpID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1jbGljay1vdXRzaWRlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb3V0c2lkZUNsaWNrSGFuZGxlcik7XG4gICAgICAgIHBhbmVsLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvdXRzaWRlQ2xpY2tIYW5kbGVyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IG1vZGFsID0gdGhpcy5jb250ZW50LnBhcmVudE5vZGU7XG4gICAgICAgIG1vZGFsLnN0eWxlLm1heEhlaWdodCA9IGAke2RvY3VtZW50LmJvZHkuY2xpZW50SGVpZ2h0IC0gbW9kYWwub2Zmc2V0VG9wfXB4YDtcbiAgICAgICAgbW9kYWwuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgICAgbW9kYWwuc3R5bGUuZmxleERpcmVjdGlvbiA9ICdjb2x1bW4nO1xuXG4gICAgICAgIHRoaXMucGF0aElucHV0LmZvY3VzKCk7XG5cbiAgICAgICAgcmV0dXJuIHBhbmVsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlLXJlbmRlciBsaXN0IGl0ZW0gZm9yIHRoZSBnaXZlbiBwYXRoLCBpZiBpdCBleGlzdHMuXG4gICAgICovXG4gICAgcmVmcmVzaFBhdGhMaXN0SXRlbShwYXRoKSB7XG4gICAgICAgIGxldCBsaXN0SXRlbSA9IHRoaXMuY29udGVudC5xdWVyeVNlbGVjdG9yKGAubGlzdC1pdGVtW2RhdGEtZmlsZS1uYW1lPVwiJHtwYXRoLmZ1bGx9XCJdYCk7XG4gICAgICAgIGlmIChsaXN0SXRlbSkge1xuICAgICAgICAgICAgbGV0IG5ld0xpc3RJdGVtID0gZG9tKHRoaXMuY3JlYXRlUGF0aExpc3RJdGVtKHBhdGgpKTtcbiAgICAgICAgICAgIGxpc3RJdGVtLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld0xpc3RJdGVtLCBsaXN0SXRlbSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkRpZENsaWNrRmlsZShjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmVtaXR0ZXIub24oJ2RpZC1jbGljay1maWxlJywgY2FsbGJhY2spO1xuICAgIH1cblxuICAgIG9uRGlkQ2xpY2tBZGRQcm9qZWN0Rm9sZGVyKGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuZW1pdHRlci5vbignZGlkLWNsaWNrLWFkZC1wcm9qZWN0LWZvbGRlcicsIGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICBvbkRpZENsaWNrT3V0c2lkZShjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmVtaXR0ZXIub24oJ2RpZC1jbGljay1vdXRzaWRlJywgY2FsbGJhY2spO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZSB0byB1c2VyLWluaXRpYXRlZCBjaGFuZ2VzIGluIHRoZSBwYXRoLlxuICAgICAqL1xuICAgIG9uRGlkUGF0aENoYW5nZShjYWxsYmFjaykge1xuICAgICAgICB0aGlzLnBhdGhFZGl0b3Iub25EaWRDaGFuZ2UoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl91cGRhdGluZ1BhdGgpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXcgUGF0aCh0aGlzLnBhdGhFZGl0b3IuZ2V0VGV4dCgpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNlbGVjdGVkUGF0aCgpIHtcbiAgICAgICAgaWYgKHRoaXMuY3Vyc29ySW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgIGxldCBzZWxlY3RlZCA9IHRoaXMucGF0aExpc3QucXVlcnlTZWxlY3RvcignLmxpc3QtaXRlbS5zZWxlY3RlZCcpO1xuICAgICAgICAgICAgaWYgKHNlbGVjdGVkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQYXRoKHNlbGVjdGVkLmRhdGFzZXQuZmlsZU5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZmlyc3RQYXRoKCkge1xuICAgICAgICBsZXQgcGF0aEl0ZW1zID0gdGhpcy5wYXRoTGlzdC5xdWVyeVNlbGVjdG9yQWxsKCcubGlzdC1pdGVtOm5vdCgucGFyZW50LWRpcmVjdG9yeSknKTtcbiAgICAgICAgaWYgKHBhdGhJdGVtcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFBhdGgocGF0aEl0ZW1zWzBdLmRhdGFzZXQuZmlsZU5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwYXRoTGlzdExlbmd0aCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGF0aExpc3QucXVlcnlTZWxlY3RvckFsbCgnLmxpc3QtaXRlbTpub3QoLmhpZGRlbiknKS5sZW5ndGg7XG4gICAgfVxuXG4gICAgc2V0UGF0aChwYXRoKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0aW5nUGF0aCA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5wYXRoRWRpdG9yLnNldFRleHQocGF0aC5mdWxsKTtcbiAgICAgICAgdGhpcy5wYXRoRWRpdG9yLnNjcm9sbFRvQ3Vyc29yUG9zaXRpb24oKTtcblxuICAgICAgICB0aGlzLl91cGRhdGluZ1BhdGggPSBmYWxzZTtcbiAgICB9XG5cbiAgICBmb3JFYWNoTGlzdEl0ZW0oc2VsZWN0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGxldCBsaXN0SXRlbXMgPSB0aGlzLnBhdGhMaXN0LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IGxpc3RJdGVtcy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgY2FsbGJhY2sobGlzdEl0ZW1zW2tdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldFBhdGhMaXN0KHBhdGhzLCB7aGlkZVBhcmVudD1mYWxzZSwgc29ydD10cnVlfT17fSkge1xuICAgICAgICB0aGlzLmN1cnNvckluZGV4ID0gbnVsbDtcblxuICAgICAgICB0aGlzLmZvckVhY2hMaXN0SXRlbSgnLmxpc3QtaXRlbS5zZWxlY3RlZCcsIChsaXN0SXRlbSkgPT4ge1xuICAgICAgICAgICAgbGlzdEl0ZW0uY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5mb3JFYWNoTGlzdEl0ZW0oJy5saXN0LWl0ZW06bm90KC5wYXJlbnQtZGlyZWN0b3J5KScsIChsaXN0SXRlbSkgPT4ge1xuICAgICAgICAgICAgbGlzdEl0ZW0ucmVtb3ZlKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChwYXRocy5sZW5ndGggPT09IDAgfHwgaGlkZVBhcmVudCkge1xuICAgICAgICAgICAgdGhpcy5wYXJlbnREaXJlY3RvcnlMaXN0SXRlbS5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucGFyZW50RGlyZWN0b3J5TGlzdEl0ZW0uY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGF0aHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaWYgKHNvcnQpIHtcbiAgICAgICAgICAgICAgICAvLyBTcGxpdCBsaXN0IGludG8gZGlyZWN0b3JpZXMgYW5kIGZpbGVzIGFuZCBzb3J0IHRoZW0uXG4gICAgICAgICAgICAgICAgcGF0aHMgPSBwYXRocy5zb3J0KFBhdGguY29tcGFyZSk7XG4gICAgICAgICAgICAgICAgbGV0IGRpcmVjdG9yeVBhdGhzID0gcGF0aHMuZmlsdGVyKChwYXRoKSA9PiBwYXRoLmlzRGlyZWN0b3J5KCkpO1xuICAgICAgICAgICAgICAgIGxldCBmaWxlUGF0aHMgPSBwYXRocy5maWx0ZXIoKHBhdGgpID0+IHBhdGguaXNGaWxlKCkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FwcGVuZFRvUGF0aExpc3QoZGlyZWN0b3J5UGF0aHMpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FwcGVuZFRvUGF0aExpc3QoZmlsZVBhdGhzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYXBwZW5kVG9QYXRoTGlzdChwYXRocyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfYXBwZW5kVG9QYXRoTGlzdChwYXRocykge1xuICAgICAgICBmb3IgKGxldCBwYXRoIG9mIHBhdGhzKSB7XG4gICAgICAgICAgICBpZiAocGF0aC5leGlzdHMoKSkge1xuICAgICAgICAgICAgICAgIGxldCBsaXN0SXRlbSA9IGRvbSh0aGlzLmNyZWF0ZVBhdGhMaXN0SXRlbShwYXRoKSk7XG4gICAgICAgICAgICAgICAgaWYgKGFkZEljb25Ub0VsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZpbGVuYW1lRWxlbWVudCA9IGxpc3RJdGVtLnF1ZXJ5U2VsZWN0b3IoJy5maWxlbmFtZS5pY29uJyk7XG4gICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdpY29uLWZpbGUtdGV4dCcsICdpY29uLWZpbGUtZGlyZWN0b3J5Jyk7XG4gICAgICAgICAgICAgICAgICAgIGFkZEljb25Ub0VsZW1lbnQoZmlsZW5hbWVFbGVtZW50LCBwYXRoLmFic29sdXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5wYXRoTGlzdC5hcHBlbmRDaGlsZChsaXN0SXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRDdXJzb3JJbmRleChpbmRleCkge1xuICAgICAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHRoaXMucGF0aExpc3RMZW5ndGgoKSkge1xuICAgICAgICAgICAgaW5kZXggPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdXJzb3JJbmRleCA9IGluZGV4O1xuICAgICAgICB0aGlzLmZvckVhY2hMaXN0SXRlbSgnLmxpc3QtaXRlbS5zZWxlY3RlZCcsIChsaXN0SXRlbSkgPT4ge1xuICAgICAgICAgICAgbGlzdEl0ZW0uY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHRoaXMuY3Vyc29ySW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgIGxldCBsaXN0SXRlbXMgPSB0aGlzLnBhdGhMaXN0LnF1ZXJ5U2VsZWN0b3JBbGwoJy5saXN0LWl0ZW06bm90KC5oaWRkZW4pJyk7XG4gICAgICAgICAgICBpZiAobGlzdEl0ZW1zLmxlbmd0aCA+IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgbGV0IHNlbGVjdGVkID0gbGlzdEl0ZW1zW2luZGV4XTtcbiAgICAgICAgICAgICAgICBzZWxlY3RlZC5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpO1xuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIHNlbGVjdGVkIGVsZW1lbnQgaXMgb3V0IG9mIHZpZXcsIHNjcm9sbCBpdCBpbnRvIHZpZXcuXG4gICAgICAgICAgICAgICAgbGV0IHBhcmVudEVsZW1lbnQgPSBzZWxlY3RlZC5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgIGxldCBzZWxlY3RlZFRvcCA9IHNlbGVjdGVkLm9mZnNldFRvcDtcbiAgICAgICAgICAgICAgICBsZXQgcGFyZW50U2Nyb2xsQm90dG9tID0gcGFyZW50RWxlbWVudC5zY3JvbGxUb3AgKyBwYXJlbnRFbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0ZWRUb3AgPCBwYXJlbnRFbGVtZW50LnNjcm9sbFRvcCkge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnRFbGVtZW50LnNjcm9sbFRvcCA9IHNlbGVjdGVkVG9wO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsZWN0ZWRUb3AgPj0gcGFyZW50U2Nyb2xsQm90dG9tKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBzZWxlY3RlZEJvdHRvbSA9IHNlbGVjdGVkVG9wICsgc2VsZWN0ZWQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnRFbGVtZW50LnNjcm9sbFRvcCArPSBzZWxlY3RlZEJvdHRvbSAtIHBhcmVudFNjcm9sbEJvdHRvbTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=