Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.activate = activate;
exports.deactivate = deactivate;
exports.provideEventService = provideEventService;
/** @babel */

var _controller = require('./controller');

// Instance of the controller, constructed on activation.
var controller = null;

var _config = require('./config');

Object.defineProperty(exports, 'config', {
    enumerable: true,
    get: function get() {
        return _config.config;
    }
});

var _view = require('./view');

Object.defineProperty(exports, 'consumeElementIcons', {
    enumerable: true,
    get: function get() {
        return _view.consumeElementIcons;
    }
});

function activate(state) {
    controller = new _controller.AdvancedOpenFileController();
}

function deactivate() {
    controller.detach();
    controller.destroy();
    controller = null;
}

/**
 * Provide a service object allowing other packages to subscribe to our
 * events.
 */

function provideEventService() {
    return {
        onDidOpenPath: function onDidOpenPath(callback) {
            return _controller.emitter.on('did-open-path', callback);
        },

        onDidCreatePath: function onDidCreatePath(callback) {
            return _controller.emitter.on('did-create-path', callback);
        }
    };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3B5b3VuZy8uYXRvbS9wYWNrYWdlcy9hZHZhbmNlZC1vcGVuLWZpbGUvbGliL2FkdmFuY2VkLW9wZW4tZmlsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OzswQkFDa0QsY0FBYzs7O0FBSWhFLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQTs7c0JBRUEsVUFBVTs7Ozs7dUJBQXZCLE1BQU07Ozs7b0JBQ29CLFFBQVE7Ozs7O3FCQUFsQyxtQkFBbUI7Ozs7QUFFcEIsU0FBUyxRQUFRLENBQUMsS0FBSyxFQUFFO0FBQzVCLGNBQVUsR0FBRyw0Q0FBZ0MsQ0FBQztDQUNqRDs7QUFFTSxTQUFTLFVBQVUsR0FBRztBQUN6QixjQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDcEIsY0FBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3JCLGNBQVUsR0FBRyxJQUFJLENBQUM7Q0FDckI7Ozs7Ozs7QUFNTSxTQUFTLG1CQUFtQixHQUFHO0FBQ2xDLFdBQU87QUFDSCxxQkFBYSxFQUFBLHVCQUFDLFFBQVEsRUFBRTtBQUNwQixtQkFBTyxvQkFBUSxFQUFFLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ2hEOztBQUVELHVCQUFlLEVBQUEseUJBQUMsUUFBUSxFQUFFO0FBQ3RCLG1CQUFPLG9CQUFRLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUNsRDtLQUNKLENBQUM7Q0FDTCIsImZpbGUiOiIvaG9tZS9weW91bmcvLmF0b20vcGFja2FnZXMvYWR2YW5jZWQtb3Blbi1maWxlL2xpYi9hZHZhbmNlZC1vcGVuLWZpbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5pbXBvcnQge0FkdmFuY2VkT3BlbkZpbGVDb250cm9sbGVyLCBlbWl0dGVyfSBmcm9tICcuL2NvbnRyb2xsZXInO1xuXG5cbi8vIEluc3RhbmNlIG9mIHRoZSBjb250cm9sbGVyLCBjb25zdHJ1Y3RlZCBvbiBhY3RpdmF0aW9uLlxubGV0IGNvbnRyb2xsZXIgPSBudWxsXG5cbmV4cG9ydCB7Y29uZmlnfSBmcm9tICcuL2NvbmZpZyc7XG5leHBvcnQge2NvbnN1bWVFbGVtZW50SWNvbnN9IGZyb20gJy4vdmlldyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBhY3RpdmF0ZShzdGF0ZSkge1xuICAgIGNvbnRyb2xsZXIgPSBuZXcgQWR2YW5jZWRPcGVuRmlsZUNvbnRyb2xsZXIoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlYWN0aXZhdGUoKSB7XG4gICAgY29udHJvbGxlci5kZXRhY2goKTtcbiAgICBjb250cm9sbGVyLmRlc3Ryb3koKTtcbiAgICBjb250cm9sbGVyID0gbnVsbDtcbn1cblxuLyoqXG4gKiBQcm92aWRlIGEgc2VydmljZSBvYmplY3QgYWxsb3dpbmcgb3RoZXIgcGFja2FnZXMgdG8gc3Vic2NyaWJlIHRvIG91clxuICogZXZlbnRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUV2ZW50U2VydmljZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBvbkRpZE9wZW5QYXRoKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gZW1pdHRlci5vbignZGlkLW9wZW4tcGF0aCcsIGNhbGxiYWNrKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvbkRpZENyZWF0ZVBhdGgoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBlbWl0dGVyLm9uKCdkaWQtY3JlYXRlLXBhdGgnLCBjYWxsYmFjayk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cbiJdfQ==