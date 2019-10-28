Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.get = get;
/** @babel */

var DEFAULT_ACTIVE_FILE_DIR = 'Active file\'s directory';
exports.DEFAULT_ACTIVE_FILE_DIR = DEFAULT_ACTIVE_FILE_DIR;
var DEFAULT_PROJECT_ROOT = 'Project root';
exports.DEFAULT_PROJECT_ROOT = DEFAULT_PROJECT_ROOT;
var DEFAULT_EMPTY = 'Empty';

exports.DEFAULT_EMPTY = DEFAULT_EMPTY;

function get(key) {
    return atom.config.get('advanced-open-file.' + key);
}

var config = {
    createDirectories: {
        title: 'Create directories',
        description: 'When opening a path to a directory that doesn\'t\n                      exist, create the directory instead of beeping.',
        type: 'boolean',
        'default': false
    },
    createFileInstantly: {
        title: 'Create files instantly',
        description: 'When opening files that don\'t exist, create them\n                      immediately instead of on save.',
        type: 'boolean',
        'default': false
    },
    helmDirSwitch: {
        title: 'Shortcuts for fast directory switching',
        description: 'See README for details.',
        type: 'boolean',
        'default': false
    },
    defaultInputValue: {
        title: 'Default input value',
        description: 'What should the path input default to when the dialog\n                      is opened?',
        type: 'string',
        'enum': [DEFAULT_ACTIVE_FILE_DIR, DEFAULT_PROJECT_ROOT, DEFAULT_EMPTY],
        'default': DEFAULT_ACTIVE_FILE_DIR
    },
    fuzzyMatch: {
        title: 'Use fuzzy matching for matching filenames',
        description: 'Replaces default prefix-based matching. See README for\n                      details.',
        type: 'boolean',
        'default': false
    },
    ignoredPatterns: {
        title: 'Ignore patterns',
        description: 'Array of glob patterns to hide matching filenames.',
        type: 'array',
        'default': ['*.pyc', '*.pyo'],
        items: {
            type: 'string'
        }
    }
};
exports.config = config;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3B5b3VuZy8uYXRvbS9wYWNrYWdlcy9hZHZhbmNlZC1vcGVuLWZpbGUvbGliL2NvbmZpZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFTyxJQUFNLHVCQUF1QixHQUFHLDBCQUEwQixDQUFDOztBQUMzRCxJQUFNLG9CQUFvQixHQUFHLGNBQWMsQ0FBQzs7QUFDNUMsSUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDOzs7O0FBRzlCLFNBQVMsR0FBRyxDQUFDLEdBQUcsRUFBRTtBQUNyQixXQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyx5QkFBdUIsR0FBRyxDQUFHLENBQUM7Q0FDdkQ7O0FBR00sSUFBSSxNQUFNLEdBQUc7QUFDaEIscUJBQWlCLEVBQUU7QUFDZixhQUFLLEVBQUUsb0JBQW9CO0FBQzNCLG1CQUFXLDJIQUNtRDtBQUM5RCxZQUFJLEVBQUUsU0FBUztBQUNmLG1CQUFTLEtBQUs7S0FDakI7QUFDRCx1QkFBbUIsRUFBRTtBQUNqQixhQUFLLEVBQUUsd0JBQXdCO0FBQy9CLG1CQUFXLDRHQUNtQztBQUM5QyxZQUFJLEVBQUUsU0FBUztBQUNmLG1CQUFTLEtBQUs7S0FDakI7QUFDRCxpQkFBYSxFQUFFO0FBQ1gsYUFBSyxFQUFFLHdDQUF3QztBQUMvQyxtQkFBVyxFQUFFLHlCQUF5QjtBQUN0QyxZQUFJLEVBQUUsU0FBUztBQUNmLG1CQUFTLEtBQUs7S0FDakI7QUFDRCxxQkFBaUIsRUFBRTtBQUNmLGFBQUssRUFBRSxxQkFBcUI7QUFDNUIsbUJBQVcsMkZBQ2M7QUFDekIsWUFBSSxFQUFFLFFBQVE7QUFDZCxnQkFBTSxDQUFDLHVCQUF1QixFQUFFLG9CQUFvQixFQUFFLGFBQWEsQ0FBQztBQUNwRSxtQkFBUyx1QkFBdUI7S0FDbkM7QUFDRCxjQUFVLEVBQUU7QUFDUixhQUFLLEVBQUUsMkNBQTJDO0FBQ2xELG1CQUFXLDBGQUNZO0FBQ3ZCLFlBQUksRUFBRSxTQUFTO0FBQ2YsbUJBQVMsS0FBSztLQUNqQjtBQUNELG1CQUFlLEVBQUU7QUFDZixhQUFLLEVBQUUsaUJBQWlCO0FBQ3hCLG1CQUFXLEVBQUUsb0RBQW9EO0FBQ2pFLFlBQUksRUFBRSxPQUFPO0FBQ2IsbUJBQVMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDO0FBQzNCLGFBQUssRUFBRTtBQUNILGdCQUFJLEVBQUUsUUFBUTtTQUNqQjtLQUNGO0NBQ0osQ0FBQyIsImZpbGUiOiIvaG9tZS9weW91bmcvLmF0b20vcGFja2FnZXMvYWR2YW5jZWQtb3Blbi1maWxlL2xpYi9jb25maWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0FDVElWRV9GSUxFX0RJUiA9ICdBY3RpdmUgZmlsZVxcJ3MgZGlyZWN0b3J5JztcbmV4cG9ydCBjb25zdCBERUZBVUxUX1BST0pFQ1RfUk9PVCA9ICdQcm9qZWN0IHJvb3QnO1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfRU1QVFkgPSAnRW1wdHknO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXQoa2V5KSB7XG4gICAgcmV0dXJuIGF0b20uY29uZmlnLmdldChgYWR2YW5jZWQtb3Blbi1maWxlLiR7a2V5fWApO1xufVxuXG5cbmV4cG9ydCBsZXQgY29uZmlnID0ge1xuICAgIGNyZWF0ZURpcmVjdG9yaWVzOiB7XG4gICAgICAgIHRpdGxlOiAnQ3JlYXRlIGRpcmVjdG9yaWVzJyxcbiAgICAgICAgZGVzY3JpcHRpb246IGBXaGVuIG9wZW5pbmcgYSBwYXRoIHRvIGEgZGlyZWN0b3J5IHRoYXQgZG9lc24ndFxuICAgICAgICAgICAgICAgICAgICAgIGV4aXN0LCBjcmVhdGUgdGhlIGRpcmVjdG9yeSBpbnN0ZWFkIG9mIGJlZXBpbmcuYCxcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIGNyZWF0ZUZpbGVJbnN0YW50bHk6IHtcbiAgICAgICAgdGl0bGU6ICdDcmVhdGUgZmlsZXMgaW5zdGFudGx5JyxcbiAgICAgICAgZGVzY3JpcHRpb246IGBXaGVuIG9wZW5pbmcgZmlsZXMgdGhhdCBkb24ndCBleGlzdCwgY3JlYXRlIHRoZW1cbiAgICAgICAgICAgICAgICAgICAgICBpbW1lZGlhdGVseSBpbnN0ZWFkIG9mIG9uIHNhdmUuYCxcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICB9LFxuICAgIGhlbG1EaXJTd2l0Y2g6IHtcbiAgICAgICAgdGl0bGU6ICdTaG9ydGN1dHMgZm9yIGZhc3QgZGlyZWN0b3J5IHN3aXRjaGluZycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VlIFJFQURNRSBmb3IgZGV0YWlscy4nLFxuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIH0sXG4gICAgZGVmYXVsdElucHV0VmFsdWU6IHtcbiAgICAgICAgdGl0bGU6ICdEZWZhdWx0IGlucHV0IHZhbHVlJyxcbiAgICAgICAgZGVzY3JpcHRpb246IGBXaGF0IHNob3VsZCB0aGUgcGF0aCBpbnB1dCBkZWZhdWx0IHRvIHdoZW4gdGhlIGRpYWxvZ1xuICAgICAgICAgICAgICAgICAgICAgIGlzIG9wZW5lZD9gLFxuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgZW51bTogW0RFRkFVTFRfQUNUSVZFX0ZJTEVfRElSLCBERUZBVUxUX1BST0pFQ1RfUk9PVCwgREVGQVVMVF9FTVBUWV0sXG4gICAgICAgIGRlZmF1bHQ6IERFRkFVTFRfQUNUSVZFX0ZJTEVfRElSLFxuICAgIH0sXG4gICAgZnV6enlNYXRjaDoge1xuICAgICAgICB0aXRsZTogJ1VzZSBmdXp6eSBtYXRjaGluZyBmb3IgbWF0Y2hpbmcgZmlsZW5hbWVzJyxcbiAgICAgICAgZGVzY3JpcHRpb246IGBSZXBsYWNlcyBkZWZhdWx0IHByZWZpeC1iYXNlZCBtYXRjaGluZy4gU2VlIFJFQURNRSBmb3JcbiAgICAgICAgICAgICAgICAgICAgICBkZXRhaWxzLmAsXG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgfSxcbiAgICBpZ25vcmVkUGF0dGVybnM6IHtcbiAgICAgIHRpdGxlOiAnSWdub3JlIHBhdHRlcm5zJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQXJyYXkgb2YgZ2xvYiBwYXR0ZXJucyB0byBoaWRlIG1hdGNoaW5nIGZpbGVuYW1lcy4nLFxuICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgIGRlZmF1bHQ6IFsnKi5weWMnLCAnKi5weW8nXSxcbiAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICB9LFxuICAgIH1cbn07XG4iXX0=