Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createDecoratedClass = (function () { function defineProperties(target, descriptors, initializers) { for (var i = 0; i < descriptors.length; i++) { var descriptor = descriptors[i]; var decorators = descriptor.decorators; var key = descriptor.key; delete descriptor.key; delete descriptor.decorators; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor || descriptor.initializer) descriptor.writable = true; if (decorators) { for (var f = 0; f < decorators.length; f++) { var decorator = decorators[f]; if (typeof decorator === 'function') { descriptor = decorator(target, key, descriptor) || descriptor; } else { throw new TypeError('The decorator for method ' + descriptor.key + ' is of the invalid type ' + typeof decorator); } } if (descriptor.initializer !== undefined) { initializers[key] = descriptor; continue; } } Object.defineProperty(target, key, descriptor); } } return function (Constructor, protoProps, staticProps, protoInitializers, staticInitializers) { if (protoProps) defineProperties(Constructor.prototype, protoProps, protoInitializers); if (staticProps) defineProperties(Constructor, staticProps, staticInitializers); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fuzzaldrinPlus = require('fuzzaldrin-plus');

var _fuzzaldrinPlus2 = _interopRequireDefault(_fuzzaldrinPlus);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _touch = require('touch');

var _touch2 = _interopRequireDefault(_touch);

var _config = require('./config');

var config = _interopRequireWildcard(_config);

var _utils = require('./utils');

/**
 * Wrapper for dealing with filesystem paths.
 */

var Path = (function () {
    function Path() {
        var path = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

        _classCallCheck(this, Path);

        // The last path segment is the "fragment". Paths that end in a
        // separator have a blank fragment.
        var sep = (0, _utils.preferredSeparatorFor)(path);
        var parts = path.split(sep);
        var fragment = parts[parts.length - 1];
        var directory = path.substring(0, path.length - fragment.length);

        // Set non-writable properties.
        (0, _utils.defineImmutable)(this, 'directory', directory);
        (0, _utils.defineImmutable)(this, 'fragment', fragment);
        (0, _utils.defineImmutable)(this, 'full', path);
        (0, _utils.defineImmutable)(this, 'sep', sep);
    }

    /**
     * Return whether the filename matches the given path fragment.
     */

    _createDecoratedClass(Path, [{
        key: 'isDirectory',
        value: function isDirectory() {
            return this.stat ? this.stat.isDirectory() : null;
        }
    }, {
        key: 'isFile',
        value: function isFile() {
            return this.stat ? !this.stat.isDirectory() : null;
        }
    }, {
        key: 'isProjectDirectory',
        value: function isProjectDirectory() {
            return atom.project.getPaths().indexOf(this.absolute) !== -1;
        }
    }, {
        key: 'isRoot',
        value: function isRoot() {
            return _path2['default'].dirname(this.absolute) === this.absolute;
        }
    }, {
        key: 'hasCaseSensitiveFragment',
        value: function hasCaseSensitiveFragment() {
            return this.fragment !== '' && this.fragment !== this.fragment.toLowerCase();
        }
    }, {
        key: 'exists',
        value: function exists() {
            return this.stat !== null;
        }
    }, {
        key: 'asDirectory',
        value: function asDirectory() {
            return new Path(this.full + (this.fragment ? this.sep : ''));
        }
    }, {
        key: 'parent',
        value: function parent() {
            if (this.isRoot()) {
                return this;
            } else if (this.fragment) {
                return new Path(this.directory);
            } else {
                return new Path(_path2['default'].dirname(this.directory) + this.sep);
            }
        }

        /**
         * Return path for the root directory for the drive this path is on.
         */
    }, {
        key: 'root',
        value: function root() {
            var last = null;
            var current = this.absolute;
            while (current !== last) {
                last = current;
                current = _path2['default'].dirname(current);
            }

            return new Path(current);
        }

        /**
         * Create an empty file at the given path if it doesn't already exist.
         */
    }, {
        key: 'createFile',
        value: function createFile() {
            _touch2['default'].sync(this.absolute);
        }

        /**
         * Create directories for the file this path points to, or do nothing
         * if they already exist.
         */
    }, {
        key: 'createDirectories',
        value: function createDirectories() {
            try {
                _mkdirp2['default'].sync((0, _utils.absolutify)(this.directory));
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    throw err;
                }
            }
        }
    }, {
        key: 'matchingPaths',
        value: function matchingPaths() {
            var _this = this;

            var caseSensitive = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

            var absoluteDir = (0, _utils.absolutify)(this.directory);
            var filenames = null;

            try {
                filenames = _fs2['default'].readdirSync(absoluteDir);
            } catch (err) {
                return []; // TODO: Catch permissions error and display a message.
            }

            if (this.fragment) {
                if (config.get('fuzzyMatch')) {
                    filenames = _fuzzaldrinPlus2['default'].filter(filenames, this.fragment);
                } else {
                    if (caseSensitive === null) {
                        caseSensitive = this.hasCaseSensitiveFragment();
                    }

                    filenames = filenames.filter(function (fn) {
                        return matchFragment(_this.fragment, fn, caseSensitive);
                    });
                }
            }

            filenames = filenames.filter(isVisible);
            return filenames.map(function (fn) {
                return new Path(_this.directory + fn);
            });
        }

        /**
         * Check if the last path fragment in this path is equal to the given
         * shortcut string, and the path ends in a separator.
         *
         * For example, ':/' and '/foo/bar/:/' have the ':' shortcut, but
         * '/foo/bar:/' and '/blah/:' do not.
         */
    }, {
        key: 'hasShortcut',
        value: function hasShortcut(shortcut) {
            shortcut = shortcut + this.sep;
            return !this.fragment && (this.directory.endsWith(this.sep + shortcut) || this.directory === shortcut);
        }
    }, {
        key: 'equals',
        value: function equals(otherPath) {
            return this.full === otherPath.full;
        }

        /**
         * Return the path to show initially in the path input.
         */
    }, {
        key: 'absolute',
        decorators: [_utils.cachedProperty],
        get: function get() {
            return (0, _utils.absolutify)(this.full);
        }
    }, {
        key: 'stat',
        decorators: [_utils.cachedProperty],
        get: function get() {
            try {
                return _fs2['default'].statSync(this.absolute);
            } catch (err) {
                return null;
            }
        }
    }], [{
        key: 'initial',
        value: function initial() {
            switch (config.get('defaultInputValue')) {
                case config.DEFAULT_ACTIVE_FILE_DIR:
                    var editor = atom.workspace.getActiveTextEditor();
                    if (editor && editor.getPath()) {
                        return new Path(_path2['default'].dirname(editor.getPath()) + _path2['default'].sep);
                    }
                // No break so that we fall back to project root.
                case config.DEFAULT_PROJECT_ROOT:
                    var projectPath = (0, _utils.getProjectPath)();
                    if (projectPath) {
                        return new Path(projectPath + _path2['default'].sep);
                    }
            }

            return new Path('');
        }

        /**
         * Compare two paths lexicographically.
         */
    }, {
        key: 'compare',
        value: function compare(path1, path2) {
            return path1.full.localeCompare(path2.full);
        }

        /**
         * Return a new path instance with the common prefix of all the
         * given paths.
         */
    }, {
        key: 'commonPrefix',
        value: function commonPrefix(paths) {
            var caseSensitive = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

            if (paths.length < 2) {
                throw new Error('Cannot find common prefix for lists shorter than two elements.');
            }

            paths = paths.map(function (path) {
                return path.full;
            }).sort();
            var first = paths[0];
            var last = paths[paths.length - 1];

            var prefix = '';
            var prefixMaxLength = Math.min(first.length, last.length);
            for (var k = 0; k < prefixMaxLength; k++) {
                if (first[k] === last[k]) {
                    prefix += first[k];
                } else if (!caseSensitive && first[k].toLowerCase() === last[k].toLowerCase()) {
                    prefix += first[k].toLowerCase();
                } else {
                    break;
                }
            }

            return new Path(prefix);
        }
    }]);

    return Path;
})();

exports.Path = Path;
function matchFragment(fragment, filename) {
    var caseSensitive = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

    if (!caseSensitive) {
        fragment = fragment.toLowerCase();
        filename = filename.toLowerCase();
    }

    return filename.startsWith(fragment);
}

/**
 * Return whether the filename is not hidden by the ignoredPatterns config.
 */
function isVisible(filename) {
    for (var ignoredPattern of (0, _utils.ignoredPatterns)()) {
        if (ignoredPattern.match(filename)) return false;
    }
    return true;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3B5b3VuZy8uYXRvbS9wYWNrYWdlcy9hZHZhbmNlZC1vcGVuLWZpbGUvbGliL21vZGVscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztrQkFFZSxJQUFJOzs7O29CQUNDLE1BQU07Ozs7OEJBRUgsaUJBQWlCOzs7O3NCQUNyQixRQUFROzs7O3FCQUNULE9BQU87Ozs7c0JBRUQsVUFBVTs7SUFBdEIsTUFBTTs7cUJBUVgsU0FBUzs7Ozs7O0lBTUgsSUFBSTtBQUNGLGFBREYsSUFBSSxHQUNRO1lBQVQsSUFBSSx5REFBQyxFQUFFOzs4QkFEVixJQUFJOzs7O0FBSVQsWUFBSSxHQUFHLEdBQUcsa0NBQXNCLElBQUksQ0FBQyxDQUFDO0FBQ3RDLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDNUIsWUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDdkMsWUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7OztBQUdqRSxvQ0FBZ0IsSUFBSSxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUM5QyxvQ0FBZ0IsSUFBSSxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUM1QyxvQ0FBZ0IsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNwQyxvQ0FBZ0IsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztLQUNyQzs7Ozs7OzBCQWRRLElBQUk7O2VBOEJGLHVCQUFHO0FBQ1YsbUJBQU8sSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQztTQUNyRDs7O2VBRUssa0JBQUc7QUFDTCxtQkFBTyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUM7U0FDdEQ7OztlQUVpQiw4QkFBRztBQUNqQixtQkFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDaEU7OztlQUVLLGtCQUFHO0FBQ0wsbUJBQU8sa0JBQVEsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDO1NBQzNEOzs7ZUFFdUIsb0NBQUc7QUFDdkIsbUJBQU8sSUFBSSxDQUFDLFFBQVEsS0FBSyxFQUFFLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO1NBQ2hGOzs7ZUFFSyxrQkFBRztBQUNMLG1CQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDO1NBQzdCOzs7ZUFFVSx1QkFBRztBQUNWLG1CQUFPLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUMsQ0FBQztTQUNoRTs7O2VBRUssa0JBQUc7QUFDTCxnQkFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUU7QUFDZix1QkFBTyxJQUFJLENBQUM7YUFDZixNQUFNLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtBQUN0Qix1QkFBTyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDbkMsTUFBTTtBQUNILHVCQUFPLElBQUksSUFBSSxDQUFDLGtCQUFRLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQy9EO1NBQ0o7Ozs7Ozs7ZUFLRyxnQkFBRztBQUNILGdCQUFJLElBQUksR0FBRyxJQUFJLENBQUM7QUFDaEIsZ0JBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDNUIsbUJBQU8sT0FBTyxLQUFLLElBQUksRUFBRTtBQUNyQixvQkFBSSxHQUFHLE9BQU8sQ0FBQztBQUNmLHVCQUFPLEdBQUcsa0JBQVEsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3RDOztBQUVELG1CQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzVCOzs7Ozs7O2VBS1Msc0JBQUc7QUFDVCwrQkFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQzdCOzs7Ozs7OztlQU1nQiw2QkFBRztBQUNoQixnQkFBSTtBQUNBLG9DQUFPLElBQUksQ0FBQyx1QkFBVyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQzthQUMzQyxDQUFDLE9BQU8sR0FBRyxFQUFFO0FBQ1Ysb0JBQUksR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7QUFDdkIsMEJBQU0sR0FBRyxDQUFDO2lCQUNiO2FBQ0o7U0FDSjs7O2VBRVkseUJBQXFCOzs7Z0JBQXBCLGFBQWEseURBQUMsSUFBSTs7QUFDNUIsZ0JBQUksV0FBVyxHQUFHLHVCQUFXLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM3QyxnQkFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDOztBQUVyQixnQkFBSTtBQUNBLHlCQUFTLEdBQUcsZ0JBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2FBQzNDLENBQUMsT0FBTyxHQUFHLEVBQUU7QUFDVix1QkFBTyxFQUFFLENBQUM7YUFDYjs7QUFFRCxnQkFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO0FBQ2Ysb0JBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRTtBQUMxQiw2QkFBUyxHQUFHLDRCQUFXLE1BQU0sQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUMzRCxNQUFNO0FBQ0gsd0JBQUksYUFBYSxLQUFLLElBQUksRUFBRTtBQUN4QixxQ0FBYSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO3FCQUNuRDs7QUFFRCw2QkFBUyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQ3hCLFVBQUMsRUFBRTsrQkFBSyxhQUFhLENBQUMsTUFBSyxRQUFRLEVBQUUsRUFBRSxFQUFFLGFBQWEsQ0FBQztxQkFBQSxDQUMxRCxDQUFDO2lCQUNMO2FBQ0o7O0FBRUQscUJBQVMsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0FBQ3ZDLG1CQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBQyxFQUFFO3VCQUFLLElBQUksSUFBSSxDQUFDLE1BQUssU0FBUyxHQUFHLEVBQUUsQ0FBQzthQUFBLENBQUMsQ0FBQztTQUMvRDs7Ozs7Ozs7Ozs7ZUFTVSxxQkFBQyxRQUFRLEVBQUU7QUFDbEIsb0JBQVEsR0FBRyxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUMvQixtQkFBTyxDQUFDLElBQUksQ0FBQyxRQUFRLEtBQ2pCLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQ3pDLElBQUksQ0FBQyxTQUFTLEtBQUssUUFBUSxDQUFBLEFBQ2pDLENBQUE7U0FDSjs7O2VBRUssZ0JBQUMsU0FBUyxFQUFFO0FBQ2QsbUJBQU8sSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsSUFBSSxDQUFDO1NBQ3ZDOzs7Ozs7OzthQW5JVyxlQUFHO0FBQ1gsbUJBQU8sdUJBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2hDOzs7O2FBR08sZUFBRztBQUNQLGdCQUFJO0FBQ0EsdUJBQU8sZ0JBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUNyQyxDQUFDLE9BQU8sR0FBRyxFQUFFO0FBQ1YsdUJBQU8sSUFBSSxDQUFDO2FBQ2Y7U0FDSjs7O2VBNkhhLG1CQUFHO0FBQ2Isb0JBQVEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQztBQUNuQyxxQkFBSyxNQUFNLENBQUMsdUJBQXVCO0FBQy9CLHdCQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFDbEQsd0JBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUUsRUFBRTtBQUM1QiwrQkFBTyxJQUFJLElBQUksQ0FBQyxrQkFBUSxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsa0JBQVEsR0FBRyxDQUFDLENBQUM7cUJBQ3BFO0FBQUE7QUFFTCxxQkFBSyxNQUFNLENBQUMsb0JBQW9CO0FBQzVCLHdCQUFJLFdBQVcsR0FBRyw0QkFBZ0IsQ0FBQztBQUNuQyx3QkFBSSxXQUFXLEVBQUU7QUFDYiwrQkFBTyxJQUFJLElBQUksQ0FBQyxXQUFXLEdBQUcsa0JBQVEsR0FBRyxDQUFDLENBQUM7cUJBQzlDO0FBQUEsYUFDUjs7QUFFRCxtQkFBTyxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUN2Qjs7Ozs7OztlQUthLGlCQUFDLEtBQUssRUFBRSxLQUFLLEVBQUU7QUFDekIsbUJBQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQy9DOzs7Ozs7OztlQU1rQixzQkFBQyxLQUFLLEVBQXVCO2dCQUFyQixhQUFhLHlEQUFDLEtBQUs7O0FBQzFDLGdCQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQ2xCLHNCQUFNLElBQUksS0FBSyxDQUNYLGdFQUFnRSxDQUNuRSxDQUFDO2FBQ0w7O0FBRUQsaUJBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQUMsSUFBSTt1QkFBSyxJQUFJLENBQUMsSUFBSTthQUFBLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUM5QyxnQkFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLGdCQUFJLElBQUksR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQzs7QUFFbkMsZ0JBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNoQixnQkFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMxRCxpQkFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGVBQWUsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0QyxvQkFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQ3RCLDBCQUFNLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUN0QixNQUFNLElBQUksQ0FBQyxhQUFhLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRTtBQUMzRSwwQkFBTSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztpQkFDcEMsTUFBTTtBQUNILDBCQUFNO2lCQUNUO2FBQ0o7O0FBRUQsbUJBQU8sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDM0I7OztXQTlNUSxJQUFJOzs7O0FBb05qQixTQUFTLGFBQWEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUF1QjtRQUFyQixhQUFhLHlEQUFDLEtBQUs7O0FBQzFELFFBQUksQ0FBQyxhQUFhLEVBQUU7QUFDaEIsZ0JBQVEsR0FBRyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDbEMsZ0JBQVEsR0FBRyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7S0FDckM7O0FBRUQsV0FBTyxRQUFRLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0NBQ3hDOzs7OztBQUtELFNBQVMsU0FBUyxDQUFDLFFBQVEsRUFBRTtBQUN6QixTQUFLLElBQU0sY0FBYyxJQUFJLDZCQUFpQixFQUFFO0FBQzVDLFlBQUksY0FBYyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxPQUFPLEtBQUssQ0FBQztLQUNwRDtBQUNELFdBQU8sSUFBSSxDQUFDO0NBQ2YiLCJmaWxlIjoiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2FkdmFuY2VkLW9wZW4tZmlsZS9saWIvbW9kZWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHN0ZFBhdGggZnJvbSAncGF0aCc7XG5cbmltcG9ydCBmdXp6YWxkcmluIGZyb20gJ2Z1enphbGRyaW4tcGx1cyc7XG5pbXBvcnQgbWtkaXJwIGZyb20gJ21rZGlycCc7XG5pbXBvcnQgdG91Y2ggZnJvbSAndG91Y2gnO1xuXG5pbXBvcnQgKiBhcyBjb25maWcgZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHtcbiAgICBhYnNvbHV0aWZ5LFxuICAgIGNhY2hlZFByb3BlcnR5LFxuICAgIGRlZmluZUltbXV0YWJsZSxcbiAgICBnZXRQcm9qZWN0UGF0aCxcbiAgICBpZ25vcmVkUGF0dGVybnMsXG4gICAgcHJlZmVycmVkU2VwYXJhdG9yRm9yXG59IGZyb20gJy4vdXRpbHMnO1xuXG5cbi8qKlxuICogV3JhcHBlciBmb3IgZGVhbGluZyB3aXRoIGZpbGVzeXN0ZW0gcGF0aHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBQYXRoIHtcbiAgICBjb25zdHJ1Y3RvcihwYXRoPScnKSB7XG4gICAgICAgIC8vIFRoZSBsYXN0IHBhdGggc2VnbWVudCBpcyB0aGUgXCJmcmFnbWVudFwiLiBQYXRocyB0aGF0IGVuZCBpbiBhXG4gICAgICAgIC8vIHNlcGFyYXRvciBoYXZlIGEgYmxhbmsgZnJhZ21lbnQuXG4gICAgICAgIGxldCBzZXAgPSBwcmVmZXJyZWRTZXBhcmF0b3JGb3IocGF0aCk7XG4gICAgICAgIGxldCBwYXJ0cyA9IHBhdGguc3BsaXQoc2VwKTtcbiAgICAgICAgbGV0IGZyYWdtZW50ID0gcGFydHNbcGFydHMubGVuZ3RoIC0gMV07XG4gICAgICAgIGxldCBkaXJlY3RvcnkgPSBwYXRoLnN1YnN0cmluZygwLCBwYXRoLmxlbmd0aCAtIGZyYWdtZW50Lmxlbmd0aCk7XG5cbiAgICAgICAgLy8gU2V0IG5vbi13cml0YWJsZSBwcm9wZXJ0aWVzLlxuICAgICAgICBkZWZpbmVJbW11dGFibGUodGhpcywgJ2RpcmVjdG9yeScsIGRpcmVjdG9yeSk7XG4gICAgICAgIGRlZmluZUltbXV0YWJsZSh0aGlzLCAnZnJhZ21lbnQnLCBmcmFnbWVudCk7XG4gICAgICAgIGRlZmluZUltbXV0YWJsZSh0aGlzLCAnZnVsbCcsIHBhdGgpO1xuICAgICAgICBkZWZpbmVJbW11dGFibGUodGhpcywgJ3NlcCcsIHNlcCk7XG4gICAgfVxuXG4gICAgQGNhY2hlZFByb3BlcnR5XG4gICAgZ2V0IGFic29sdXRlKCkge1xuICAgICAgICByZXR1cm4gYWJzb2x1dGlmeSh0aGlzLmZ1bGwpO1xuICAgIH1cblxuICAgIEBjYWNoZWRQcm9wZXJ0eVxuICAgIGdldCBzdGF0KCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGZzLnN0YXRTeW5jKHRoaXMuYWJzb2x1dGUpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNEaXJlY3RvcnkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXQgPyB0aGlzLnN0YXQuaXNEaXJlY3RvcnkoKSA6IG51bGw7XG4gICAgfVxuXG4gICAgaXNGaWxlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ID8gIXRoaXMuc3RhdC5pc0RpcmVjdG9yeSgpIDogbnVsbDtcbiAgICB9XG5cbiAgICBpc1Byb2plY3REaXJlY3RvcnkoKSB7XG4gICAgICAgIHJldHVybiBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKS5pbmRleE9mKHRoaXMuYWJzb2x1dGUpICE9PSAtMTtcbiAgICB9XG5cbiAgICBpc1Jvb3QoKSB7XG4gICAgICAgIHJldHVybiBzdGRQYXRoLmRpcm5hbWUodGhpcy5hYnNvbHV0ZSkgPT09IHRoaXMuYWJzb2x1dGU7XG4gICAgfVxuXG4gICAgaGFzQ2FzZVNlbnNpdGl2ZUZyYWdtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5mcmFnbWVudCAhPT0gJycgJiYgdGhpcy5mcmFnbWVudCAhPT0gdGhpcy5mcmFnbWVudC50b0xvd2VyQ2FzZSgpO1xuICAgIH1cblxuICAgIGV4aXN0cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdCAhPT0gbnVsbDtcbiAgICB9XG5cbiAgICBhc0RpcmVjdG9yeSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQYXRoKHRoaXMuZnVsbCArICh0aGlzLmZyYWdtZW50ID8gdGhpcy5zZXAgOiAnJykpO1xuICAgIH1cblxuICAgIHBhcmVudCgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNSb290KCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZnJhZ21lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUGF0aCh0aGlzLmRpcmVjdG9yeSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFBhdGgoc3RkUGF0aC5kaXJuYW1lKHRoaXMuZGlyZWN0b3J5KSArIHRoaXMuc2VwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiBwYXRoIGZvciB0aGUgcm9vdCBkaXJlY3RvcnkgZm9yIHRoZSBkcml2ZSB0aGlzIHBhdGggaXMgb24uXG4gICAgICovXG4gICAgcm9vdCgpIHtcbiAgICAgICAgbGV0IGxhc3QgPSBudWxsO1xuICAgICAgICBsZXQgY3VycmVudCA9IHRoaXMuYWJzb2x1dGU7XG4gICAgICAgIHdoaWxlIChjdXJyZW50ICE9PSBsYXN0KSB7XG4gICAgICAgICAgICBsYXN0ID0gY3VycmVudDtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBzdGRQYXRoLmRpcm5hbWUoY3VycmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFBhdGgoY3VycmVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGFuIGVtcHR5IGZpbGUgYXQgdGhlIGdpdmVuIHBhdGggaWYgaXQgZG9lc24ndCBhbHJlYWR5IGV4aXN0LlxuICAgICAqL1xuICAgIGNyZWF0ZUZpbGUoKSB7XG4gICAgICAgIHRvdWNoLnN5bmModGhpcy5hYnNvbHV0ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGRpcmVjdG9yaWVzIGZvciB0aGUgZmlsZSB0aGlzIHBhdGggcG9pbnRzIHRvLCBvciBkbyBub3RoaW5nXG4gICAgICogaWYgdGhleSBhbHJlYWR5IGV4aXN0LlxuICAgICAqL1xuICAgIGNyZWF0ZURpcmVjdG9yaWVzKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbWtkaXJwLnN5bmMoYWJzb2x1dGlmeSh0aGlzLmRpcmVjdG9yeSkpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtYXRjaGluZ1BhdGhzKGNhc2VTZW5zaXRpdmU9bnVsbCkge1xuICAgICAgICBsZXQgYWJzb2x1dGVEaXIgPSBhYnNvbHV0aWZ5KHRoaXMuZGlyZWN0b3J5KTtcbiAgICAgICAgbGV0IGZpbGVuYW1lcyA9IG51bGw7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZpbGVuYW1lcyA9IGZzLnJlYWRkaXJTeW5jKGFic29sdXRlRGlyKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gW107IC8vIFRPRE86IENhdGNoIHBlcm1pc3Npb25zIGVycm9yIGFuZCBkaXNwbGF5IGEgbWVzc2FnZS5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmZyYWdtZW50KSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLmdldCgnZnV6enlNYXRjaCcpKSB7XG4gICAgICAgICAgICAgICAgZmlsZW5hbWVzID0gZnV6emFsZHJpbi5maWx0ZXIoZmlsZW5hbWVzLCB0aGlzLmZyYWdtZW50KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhc2VTZW5zaXRpdmUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZVNlbnNpdGl2ZSA9IHRoaXMuaGFzQ2FzZVNlbnNpdGl2ZUZyYWdtZW50KCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZmlsZW5hbWVzID0gZmlsZW5hbWVzLmZpbHRlcihcbiAgICAgICAgICAgICAgICAgICAgKGZuKSA9PiBtYXRjaEZyYWdtZW50KHRoaXMuZnJhZ21lbnQsIGZuLCBjYXNlU2Vuc2l0aXZlKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmaWxlbmFtZXMgPSBmaWxlbmFtZXMuZmlsdGVyKGlzVmlzaWJsZSlcbiAgICAgICAgcmV0dXJuIGZpbGVuYW1lcy5tYXAoKGZuKSA9PiBuZXcgUGF0aCh0aGlzLmRpcmVjdG9yeSArIGZuKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGxhc3QgcGF0aCBmcmFnbWVudCBpbiB0aGlzIHBhdGggaXMgZXF1YWwgdG8gdGhlIGdpdmVuXG4gICAgICogc2hvcnRjdXQgc3RyaW5nLCBhbmQgdGhlIHBhdGggZW5kcyBpbiBhIHNlcGFyYXRvci5cbiAgICAgKlxuICAgICAqIEZvciBleGFtcGxlLCAnOi8nIGFuZCAnL2Zvby9iYXIvOi8nIGhhdmUgdGhlICc6JyBzaG9ydGN1dCwgYnV0XG4gICAgICogJy9mb28vYmFyOi8nIGFuZCAnL2JsYWgvOicgZG8gbm90LlxuICAgICAqL1xuICAgIGhhc1Nob3J0Y3V0KHNob3J0Y3V0KSB7XG4gICAgICAgIHNob3J0Y3V0ID0gc2hvcnRjdXQgKyB0aGlzLnNlcDtcbiAgICAgICAgcmV0dXJuICF0aGlzLmZyYWdtZW50ICYmIChcbiAgICAgICAgICAgIHRoaXMuZGlyZWN0b3J5LmVuZHNXaXRoKHRoaXMuc2VwICsgc2hvcnRjdXQpXG4gICAgICAgICAgICB8fCB0aGlzLmRpcmVjdG9yeSA9PT0gc2hvcnRjdXRcbiAgICAgICAgKVxuICAgIH1cblxuICAgIGVxdWFscyhvdGhlclBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZnVsbCA9PT0gb3RoZXJQYXRoLmZ1bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBwYXRoIHRvIHNob3cgaW5pdGlhbGx5IGluIHRoZSBwYXRoIGlucHV0LlxuICAgICAqL1xuICAgIHN0YXRpYyBpbml0aWFsKCkge1xuICAgICAgICBzd2l0Y2ggKGNvbmZpZy5nZXQoJ2RlZmF1bHRJbnB1dFZhbHVlJykpIHtcbiAgICAgICAgICAgIGNhc2UgY29uZmlnLkRFRkFVTFRfQUNUSVZFX0ZJTEVfRElSOlxuICAgICAgICAgICAgICAgIGxldCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgICAgICAgICAgICAgaWYgKGVkaXRvciAmJiBlZGl0b3IuZ2V0UGF0aCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUGF0aChzdGRQYXRoLmRpcm5hbWUoZWRpdG9yLmdldFBhdGgoKSkgKyBzdGRQYXRoLnNlcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIE5vIGJyZWFrIHNvIHRoYXQgd2UgZmFsbCBiYWNrIHRvIHByb2plY3Qgcm9vdC5cbiAgICAgICAgICAgIGNhc2UgY29uZmlnLkRFRkFVTFRfUFJPSkVDVF9ST09UOlxuICAgICAgICAgICAgICAgIGxldCBwcm9qZWN0UGF0aCA9IGdldFByb2plY3RQYXRoKCk7XG4gICAgICAgICAgICAgICAgaWYgKHByb2plY3RQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUGF0aChwcm9qZWN0UGF0aCArIHN0ZFBhdGguc2VwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFBhdGgoJycpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbXBhcmUgdHdvIHBhdGhzIGxleGljb2dyYXBoaWNhbGx5LlxuICAgICAqL1xuICAgIHN0YXRpYyBjb21wYXJlKHBhdGgxLCBwYXRoMikge1xuICAgICAgICByZXR1cm4gcGF0aDEuZnVsbC5sb2NhbGVDb21wYXJlKHBhdGgyLmZ1bGwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiBhIG5ldyBwYXRoIGluc3RhbmNlIHdpdGggdGhlIGNvbW1vbiBwcmVmaXggb2YgYWxsIHRoZVxuICAgICAqIGdpdmVuIHBhdGhzLlxuICAgICAqL1xuICAgIHN0YXRpYyBjb21tb25QcmVmaXgocGF0aHMsIGNhc2VTZW5zaXRpdmU9ZmFsc2UpIHtcbiAgICAgICAgaWYgKHBhdGhzLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICAnQ2Fubm90IGZpbmQgY29tbW9uIHByZWZpeCBmb3IgbGlzdHMgc2hvcnRlciB0aGFuIHR3byBlbGVtZW50cy4nXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcGF0aHMgPSBwYXRocy5tYXAoKHBhdGgpID0+IHBhdGguZnVsbCkuc29ydCgpO1xuICAgICAgICBsZXQgZmlyc3QgPSBwYXRoc1swXTtcbiAgICAgICAgbGV0IGxhc3QgPSBwYXRoc1twYXRocy5sZW5ndGggLSAxXTtcblxuICAgICAgICBsZXQgcHJlZml4ID0gJyc7XG4gICAgICAgIGxldCBwcmVmaXhNYXhMZW5ndGggPSBNYXRoLm1pbihmaXJzdC5sZW5ndGgsIGxhc3QubGVuZ3RoKTtcbiAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBwcmVmaXhNYXhMZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgaWYgKGZpcnN0W2tdID09PSBsYXN0W2tdKSB7XG4gICAgICAgICAgICAgICAgcHJlZml4ICs9IGZpcnN0W2tdO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghY2FzZVNlbnNpdGl2ZSAmJiBmaXJzdFtrXS50b0xvd2VyQ2FzZSgpID09PSBsYXN0W2tdLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICBwcmVmaXggKz0gZmlyc3Rba10udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFBhdGgocHJlZml4KTtcbiAgICB9XG59XG5cbi8qKlxuICogUmV0dXJuIHdoZXRoZXIgdGhlIGZpbGVuYW1lIG1hdGNoZXMgdGhlIGdpdmVuIHBhdGggZnJhZ21lbnQuXG4gKi9cbmZ1bmN0aW9uIG1hdGNoRnJhZ21lbnQoZnJhZ21lbnQsIGZpbGVuYW1lLCBjYXNlU2Vuc2l0aXZlPWZhbHNlKSB7XG4gICAgaWYgKCFjYXNlU2Vuc2l0aXZlKSB7XG4gICAgICAgIGZyYWdtZW50ID0gZnJhZ21lbnQudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgZmlsZW5hbWUgPSBmaWxlbmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBmaWxlbmFtZS5zdGFydHNXaXRoKGZyYWdtZW50KTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gd2hldGhlciB0aGUgZmlsZW5hbWUgaXMgbm90IGhpZGRlbiBieSB0aGUgaWdub3JlZFBhdHRlcm5zIGNvbmZpZy5cbiAqL1xuZnVuY3Rpb24gaXNWaXNpYmxlKGZpbGVuYW1lKSB7XG4gICAgZm9yIChjb25zdCBpZ25vcmVkUGF0dGVybiBvZiBpZ25vcmVkUGF0dGVybnMoKSkge1xuICAgICAgICBpZiAoaWdub3JlZFBhdHRlcm4ubWF0Y2goZmlsZW5hbWUpKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuIl19