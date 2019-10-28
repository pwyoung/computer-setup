Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.cachedProperty = cachedProperty;
exports.getProjectPath = getProjectPath;
exports.preferredSeparatorFor = preferredSeparatorFor;
exports.defineImmutable = defineImmutable;
exports.absolutify = absolutify;
exports.dom = dom;
exports.closest = closest;
exports.getOrUpdateStringMap = getOrUpdateStringMap;
exports.ignoredPatterns = ignoredPatterns;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/** @babel */

var _minimatch = require('minimatch');

var _minimatch2 = _interopRequireDefault(_minimatch);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _stringmap = require('stringmap');

var _stringmap2 = _interopRequireDefault(_stringmap);

var _osenv = require('osenv');

var _osenv2 = _interopRequireDefault(_osenv);

var _config = require('./config');

var config = _interopRequireWildcard(_config);

/**
 * Generates the return value for the wrapper property on first access
 * and caches it on the object. All future calls return the cached value
 * instead of re-calculating it.
 */

function cachedProperty(target, key, descriptor) {
    var getter = descriptor.get;
    var cached_key = Symbol(key + '_cached');

    descriptor.get = function () {
        if (this[cached_key] === undefined) {
            Object.defineProperty(this, cached_key, {
                value: getter.call(this),
                writable: false,
                enumerable: false
            });
        }
        return this[cached_key];
    };

    return descriptor;
}

/**
 * Get the path to the current project directory. For now this just uses
 * the first directory in the list. Return null if there are no project
 * directories.
 *
 * TODO: Support more than just the first.
 */

function getProjectPath() {
    var projectPaths = atom.project.getPaths();
    if (projectPaths.length > 0) {
        return projectPaths[0];
    } else {
        return null;
    }
}

/**
 * Get the preferred path separator for the given string based on the
 * first path separator detected.
 */

function preferredSeparatorFor(path) {
    var forwardIndex = path.indexOf('/');
    var backIndex = path.indexOf('\\');

    if (backIndex === -1 && forwardIndex === -1) {
        return _path2['default'].sep;
    } else if (forwardIndex === -1) {
        return '\\';
    } else if (backIndex === -1) {
        return '/';
    } else if (forwardIndex < backIndex) {
        return '/';
    } else {
        return '\\';
    }
}

/**
 * Define an immutable property on an object.
 */

function defineImmutable(obj, name, value) {
    Object.defineProperty(obj, name, {
        value: value,
        writable: false,
        enumerable: true
    });
}

/**
 * Turn the given path into an absolute path if necessary. Paths are
 * considered relative to the project root.
 */

function absolutify(path) {
    // If we start with a tilde, just replace it with the home dir.
    var sep = preferredSeparatorFor(path);
    if (path.startsWith('~' + sep)) {
        return _osenv2['default'].home() + sep + path.slice(2);
    }

    // If the path doesn't start with a separator, it's relative to the
    // project root.
    if (!path.startsWith(sep)) {
        var relativeBases = [];
        var projectPath = getProjectPath();
        if (projectPath) {
            relativeBases.push(projectPath);
        }

        return _path2['default'].resolve.apply(_path2['default'], relativeBases.concat([path]));
    }

    // Otherwise it was absolute already.
    return path;
}

/**
 * Parse the given string as HTML and return DOM nodes. Assumes a root
 * DOM node because, well, that's all I use it for.
 */

function dom(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.firstElementChild;
}

/**
 * Starts at the current DOM element and moves upward in the DOM tree
 * until an element matching the given selector is found.
 *
 * Intended to be bound to DOM elements like so:
 * domNode::closest('selector');
 */

function closest(selector) {
    if (this.matches && this.matches(selector)) {
        return this;
    } else if (this.parentNode) {
        var _context;

        return (_context = this.parentNode, closest).call(_context, selector);
    } else {
        return null;
    }
}

/**
 * Return value from StringMap if exists
 * otherwise generate value with getValue, set the StringMap and return
 */

function getOrUpdateStringMap(stringMap, key, getValue) {
    if (stringMap.has(key)) {
        return stringMap.get(key);
    }
    var value = getValue(key);
    stringMap.set(key, value);
    return value;
}

/**
 * Returns an array of Minimatch instances to test whether a filename
 * is ignored. Cache the Minimatch instances instead of re-compiling
 * the regexp.
 */
var _minimatchesCache = (0, _stringmap2['default'])();

function ignoredPatterns() {
    var ignoredGlobs = config.get('ignoredPatterns');
    return ignoredGlobs.map(function (glob) {
        return getOrUpdateStringMap(_minimatchesCache, glob, function (glob) {
            return new _minimatch2['default'].Minimatch(glob);
        });
    });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3B5b3VuZy8uYXRvbS9wYWNrYWdlcy9hZHZhbmNlZC1vcGVuLWZpbGUvbGliL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7eUJBRXNCLFdBQVc7Ozs7b0JBQ2IsTUFBTTs7Ozt5QkFDSixXQUFXOzs7O3FCQUVmLE9BQU87Ozs7c0JBRUQsVUFBVTs7SUFBdEIsTUFBTTs7Ozs7Ozs7QUFRWCxTQUFTLGNBQWMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRTtBQUNwRCxRQUFJLE1BQU0sR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDO0FBQzVCLFFBQUksVUFBVSxHQUFHLE1BQU0sQ0FBSSxHQUFHLGFBQVUsQ0FBQzs7QUFFekMsY0FBVSxDQUFDLEdBQUcsR0FBRyxZQUFXO0FBQ3hCLFlBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLFNBQVMsRUFBRTtBQUNoQyxrQkFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO0FBQ3BDLHFCQUFLLEVBQUUsQUFBTSxNQUFNLE1BQVosSUFBSSxDQUFVO0FBQ3JCLHdCQUFRLEVBQUUsS0FBSztBQUNmLDBCQUFVLEVBQUUsS0FBSzthQUNwQixDQUFDLENBQUM7U0FDTjtBQUNELGVBQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQzNCLENBQUM7O0FBRUYsV0FBTyxVQUFVLENBQUM7Q0FDckI7Ozs7Ozs7Ozs7QUFVTSxTQUFTLGNBQWMsR0FBRztBQUM3QixRQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQzNDLFFBQUksWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDekIsZUFBTyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDMUIsTUFBTTtBQUNILGVBQU8sSUFBSSxDQUFDO0tBQ2Y7Q0FDSjs7Ozs7OztBQU9NLFNBQVMscUJBQXFCLENBQUMsSUFBSSxFQUFFO0FB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TyxLQUFLLENBQUM7Q0FDZDs7Ozs7OztBQU9ELElBQUksaUJBQWlCLEdBQUcsNkJBQVcsQ0FBQzs7QUFDN0IsU0FBUyxlQUFlLEdBQUc7QUFDOUIsUUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO0FBQ2xELFdBQU8sWUFBWSxDQUFDLEdBQUcsQ0FBQyxVQUFDLElBQUk7ZUFBSyxvQkFBb0IsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsVUFBQyxJQUFJO21CQUNsRixJQUFJLHVCQUFVLFNBQVMsQ0FBQyxJQUFJLENBQUM7U0FBQSxDQUFDO0tBQUEsQ0FBQyxDQUFBO0NBQ3JDIiwiZmlsZSI6Ii9ob21lL3B5b3VuZy8uYXRvbS9wYWNrYWdlcy9hZHZhbmNlZC1vcGVuLWZpbGUvbGliL3V0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuXG5pbXBvcnQgbWluaW1hdGNoIGZyb20gJ21pbmltYXRjaCc7XG5pbXBvcnQgc3RkUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBTdHJpbmdNYXAgZnJvbSAnc3RyaW5nbWFwJztcblxuaW1wb3J0IG9zZW52IGZyb20gJ29zZW52JztcblxuaW1wb3J0ICogYXMgY29uZmlnIGZyb20gJy4vY29uZmlnJztcblxuXG4vKipcbiAqIEdlbmVyYXRlcyB0aGUgcmV0dXJuIHZhbHVlIGZvciB0aGUgd3JhcHBlciBwcm9wZXJ0eSBvbiBmaXJzdCBhY2Nlc3NcbiAqIGFuZCBjYWNoZXMgaXQgb24gdGhlIG9iamVjdC4gQWxsIGZ1dHVyZSBjYWxscyByZXR1cm4gdGhlIGNhY2hlZCB2YWx1ZVxuICogaW5zdGVhZCBvZiByZS1jYWxjdWxhdGluZyBpdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhY2hlZFByb3BlcnR5KHRhcmdldCwga2V5LCBkZXNjcmlwdG9yKSB7XG4gICAgbGV0IGdldHRlciA9IGRlc2NyaXB0b3IuZ2V0O1xuICAgIGxldCBjYWNoZWRfa2V5ID0gU3ltYm9sKGAke2tleX1fY2FjaGVkYCk7XG5cbiAgICBkZXNjcmlwdG9yLmdldCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpc1tjYWNoZWRfa2V5XSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgY2FjaGVkX2tleSwge1xuICAgICAgICAgICAgICAgIHZhbHVlOiB0aGlzOjpnZXR0ZXIoKSxcbiAgICAgICAgICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpc1tjYWNoZWRfa2V5XTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGRlc2NyaXB0b3I7XG59XG5cblxuLyoqXG4gKiBHZXQgdGhlIHBhdGggdG8gdGhlIGN1cnJlbnQgcHJvamVjdCBkaXJlY3RvcnkuIEZvciBub3cgdGhpcyBqdXN0IHVzZXNcbiAqIHRoZSBmaXJzdCBkaXJlY3RvcnkgaW4gdGhlIGxpc3QuIFJldHVybiBudWxsIGlmIHRoZXJlIGFyZSBubyBwcm9qZWN0XG4gKiBkaXJlY3Rvcmllcy5cbiAqXG4gKiBUT0RPOiBTdXBwb3J0IG1vcmUgdGhhbiBqdXN0IHRoZSBmaXJzdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFByb2plY3RQYXRoKCkge1xuICAgIGxldCBwcm9qZWN0UGF0aHMgPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKTtcbiAgICBpZiAocHJvamVjdFBhdGhzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIHByb2plY3RQYXRoc1swXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5cblxuLyoqXG4gKiBHZXQgdGhlIHByZWZlcnJlZCBwYXRoIHNlcGFyYXRvciBmb3IgdGhlIGdpdmVuIHN0cmluZyBiYXNlZCBvbiB0aGVcbiAqIGZpcnN0IHBhdGggc2VwYXJhdG9yIGRldGVjdGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJlZmVycmVkU2VwYXJhdG9yRm9yKHBhdGgpIHtcbiAgICBsZXQgZm9yd2FyZEluZGV4ID0gcGF0aC5pbmRleE9mKCcvJyk7XG4gICAgbGV0IGJhY2tJbmRleCA9IHBhdGguaW5kZXhPZignXFxcXCcpO1xuXG4gICAgaWYgKGJhY2tJbmRleCA9PT0gLTEgJiYgZm9yd2FyZEluZGV4ID09PSAtMSkge1xuICAgICAgICByZXR1cm4gc3RkUGF0aC5zZXA7XG4gICAgfSBlbHNlIGlmIChmb3J3YXJkSW5kZXggPT09IC0xKSB7XG4gICAgICAgIHJldHVybiAnXFxcXCc7XG4gICAgfSBlbHNlIGlmIChiYWNrSW5kZXggPT09IC0xKSB7XG4gICAgICAgIHJldHVybiAnLyc7XG4gICAgfSBlbHNlIGlmIChmb3J3YXJkSW5kZXggPCBiYWNrSW5kZXgpIHtcbiAgICAgICAgcmV0dXJuICcvJztcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJ1xcXFwnO1xuICAgIH1cbn1cblxuXG4vKipcbiAqIERlZmluZSBhbiBpbW11dGFibGUgcHJvcGVydHkgb24gYW4gb2JqZWN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVmaW5lSW1tdXRhYmxlKG9iaiwgbmFtZSwgdmFsdWUpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBuYW1lLCB7XG4gICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIH0pO1xufVxuXG5cbi8qKlxuICogVHVybiB0aGUgZ2l2ZW4gcGF0aCBpbnRvIGFuIGFic29sdXRlIHBhdGggaWYgbmVjZXNzYXJ5LiBQYXRocyBhcmVcbiAqIGNvbnNpZGVyZWQgcmVsYXRpdmUgdG8gdGhlIHByb2plY3Qgcm9vdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFic29sdXRpZnkocGF0aCkge1xuICAgIC8vIElmIHdlIHN0YXJ0IHdpdGggYSB0aWxkZSwganVzdCByZXBsYWNlIGl0IHdpdGggdGhlIGhvbWUgZGlyLlxuICAgIGxldCBzZXAgPSBwcmVmZXJyZWRTZXBhcmF0b3JGb3IocGF0aCk7XG4gICAgaWYgKHBhdGguc3RhcnRzV2l0aCgnficgKyBzZXApKSB7XG4gICAgICAgIHJldHVybiBvc2Vudi5ob21lKCkgKyBzZXAgKyBwYXRoLnNsaWNlKDIpO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBwYXRoIGRvZXNuJ3Qgc3RhcnQgd2l0aCBhIHNlcGFyYXRvciwgaXQncyByZWxhdGl2ZSB0byB0aGVcbiAgICAvLyBwcm9qZWN0IHJvb3QuXG4gICAgaWYgKCFwYXRoLnN0YXJ0c1dpdGgoc2VwKSkge1xuICAgICAgICBsZXQgcmVsYXRpdmVCYXNlcyA9IFtdO1xuICAgICAgICBsZXQgcHJvamVjdFBhdGggPSBnZXRQcm9qZWN0UGF0aCgpO1xuICAgICAgICBpZiAocHJvamVjdFBhdGgpIHtcbiAgICAgICAgICAgIHJlbGF0aXZlQmFzZXMucHVzaChwcm9qZWN0UGF0aCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RkUGF0aC5yZXNvbHZlKC4uLnJlbGF0aXZlQmFzZXMsIHBhdGgpO1xuICAgIH1cblxuICAgIC8vIE90aGVyd2lzZSBpdCB3YXMgYWJzb2x1dGUgYWxyZWFkeS5cbiAgICByZXR1cm4gcGF0aDtcbn1cblxuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBzdHJpbmcgYXMgSFRNTCBhbmQgcmV0dXJuIERPTSBub2Rlcy4gQXNzdW1lcyBhIHJvb3RcbiAqIERPTSBub2RlIGJlY2F1c2UsIHdlbGwsIHRoYXQncyBhbGwgSSB1c2UgaXQgZm9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZG9tKGh0bWwpIHtcbiAgICBsZXQgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZGl2LmlubmVySFRNTCA9IGh0bWw7XG4gICAgcmV0dXJuIGRpdi5maXJzdEVsZW1lbnRDaGlsZDtcbn1cblxuXG4vKipcbiAqIFN0YXJ0cyBhdCB0aGUgY3VycmVudCBET00gZWxlbWVudCBhbmQgbW92ZXMgdXB3YXJkIGluIHRoZSBET00gdHJlZVxuICogdW50aWwgYW4gZWxlbWVudCBtYXRjaGluZyB0aGUgZ2l2ZW4gc2VsZWN0b3IgaXMgZm91bmQuXG4gKlxuICogSW50ZW5kZWQgdG8gYmUgYm91bmQgdG8gRE9NIGVsZW1lbnRzIGxpa2Ugc286XG4gKiBkb21Ob2RlOjpjbG9zZXN0KCdzZWxlY3RvcicpO1xuICovXG5leHBvcnQgZnVuY3Rpb24gY2xvc2VzdChzZWxlY3Rvcikge1xuICAgIGlmICh0aGlzLm1hdGNoZXMgJiYgdGhpcy5tYXRjaGVzKHNlbGVjdG9yKSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9IGVsc2UgaWYgKHRoaXMucGFyZW50Tm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnROb2RlOjpjbG9zZXN0KHNlbGVjdG9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5cblxuLyoqXG4gKiBSZXR1cm4gdmFsdWUgZnJvbSBTdHJpbmdNYXAgaWYgZXhpc3RzXG4gKiBvdGhlcndpc2UgZ2VuZXJhdGUgdmFsdWUgd2l0aCBnZXRWYWx1ZSwgc2V0IHRoZSBTdHJpbmdNYXAgYW5kIHJldHVyblxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JVcGRhdGVTdHJpbmdNYXAoc3RyaW5nTWFwLCBrZXksIGdldFZhbHVlKSB7XG4gIGlmIChzdHJpbmdNYXAuaGFzKGtleSkgKSB7XG4gICAgcmV0dXJuIHN0cmluZ01hcC5nZXQoa2V5KTtcbiAgfVxuICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKGtleSk7XG4gIHN0cmluZ01hcC5zZXQoa2V5LCB2YWx1ZSk7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGFycmF5IG9mIE1pbmltYXRjaCBpbnN0YW5jZXMgdG8gdGVzdCB3aGV0aGVyIGEgZmlsZW5hbWVcbiAqIGlzIGlnbm9yZWQuIENhY2hlIHRoZSBNaW5pbWF0Y2ggaW5zdGFuY2VzIGluc3RlYWQgb2YgcmUtY29tcGlsaW5nXG4gKiB0aGUgcmVnZXhwLlxuICovXG5sZXQgX21pbmltYXRjaGVzQ2FjaGUgPSBTdHJpbmdNYXAoKTtcbmV4cG9ydCBmdW5jdGlvbiBpZ25vcmVkUGF0dGVybnMoKSB7XG4gICAgY29uc3QgaWdub3JlZEdsb2JzID0gY29uZmlnLmdldCgnaWdub3JlZFBhdHRlcm5zJylcbiAgICByZXR1cm4gaWdub3JlZEdsb2JzLm1hcCgoZ2xvYikgPT4gZ2V0T3JVcGRhdGVTdHJpbmdNYXAoX21pbmltYXRjaGVzQ2FjaGUsIGdsb2IsIChnbG9iKSA9PlxuICAgICAgIG5ldyBtaW5pbWF0Y2guTWluaW1hdGNoKGdsb2IpKSlcbn1cbiJdfQ==