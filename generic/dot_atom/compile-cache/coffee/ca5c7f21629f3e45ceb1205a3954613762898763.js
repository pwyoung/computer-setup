(function() {
  var CompositeDisposable, Disposable, JsDiff, Mark, Point, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ref = require('atom'), Point = ref.Point, CompositeDisposable = ref.CompositeDisposable, Disposable = ref.Disposable;

  JsDiff = require('diff');

  Mark = (function() {
    var MARK_MODE_CLASS, _marks;

    MARK_MODE_CLASS = 'mark-mode';

    _marks = new WeakMap;

    Mark["for"] = function(editor) {
      var mark;
      mark = _marks.get(editor);
      if (!mark) {
        mark = new Mark(editor);
        _marks.set(editor, mark);
      }
      return mark;
    };

    function Mark(editor1) {
      this.editor = editor1;
      this._addClickEventListener = bind(this._addClickEventListener, this);
      this._onModified = bind(this._onModified, this);
      this._clearSelection = bind(this._clearSelection, this);
      this._addClass = bind(this._addClass, this);
      this.destroy = bind(this.destroy, this);
      this.deactivate = bind(this.deactivate, this);
      this.activate = bind(this.activate, this);
      this.active = false;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(this.editor.onDidDestroy(this.destroy));
    }

    Mark.prototype.activate = function(keepSelection) {
      if (keepSelection == null) {
        keepSelection = false;
      }
      if (!keepSelection) {
        this._clearSelection();
      }
      if (this.active) {
        return;
      }
      this.activateSubscriptions = new CompositeDisposable;
      this.activateSubscriptions.add(this.editor.getBuffer().onDidChange(this._onModified));
      this.activateSubscriptions.add(this._addClickEventListener());
      this.activateSubscriptions.add(this._addClass());
      return this.active = true;
    };

    Mark.prototype.deactivate = function(options) {
      var ref1;
      if (options == null) {
        options = {};
      }
      this.active = false;
      if ((ref1 = this.activateSubscriptions) != null) {
        ref1.dispose();
      }
      this.activateSubscriptions = null;
      if (options.immediate) {
        return setImmediate(this._clearSelection);
      } else {
        return this._clearSelection();
      }
    };

    Mark.prototype.destroy = function() {
      var ref1;
      if (this.destroyed) {
        return;
      }
      this.destroyed = true;
      if (this.active) {
        this.deactivate();
      }
      if ((ref1 = this.subscriptions) != null) {
        ref1.dispose();
      }
      this.subscriptions = null;
      return this.editor = null;
    };

    Mark.prototype.isActive = function() {
      return this.active;
    };

    Mark.prototype.exchange = function() {
      if (!this.isActive()) {
        return;
      }
      return this.editor.getCursors().forEach(this._exchange);
    };

    Mark.prototype._exchange = function(cursor) {
      var a, b;
      if (cursor.selection == null) {
        return;
      }
      b = cursor.selection.getTailBufferPosition();
      a = cursor.getBufferPosition();
      return cursor.selection.setBufferRange([a, b], {
        reversed: Point.min(a, b) === b,
        autoscroll: false
      });
    };

    Mark.prototype._addClass = function() {
      var editorElement;
      editorElement = atom.views.getView(this.editor);
      editorElement.classList.add(MARK_MODE_CLASS);
      return new Disposable(function() {
        return editorElement.classList.remove(MARK_MODE_CLASS);
      });
    };

    Mark.prototype._clearSelection = function() {
      if (this.editor == null) {
        return;
      }
      if (this.editor.isDestroyed()) {
        return;
      }
      return this.editor.getCursors().forEach(function(cursor) {
        return cursor.clearSelection();
      });
    };

    Mark.prototype._onModified = function(arg) {
      var newText, oldText;
      oldText = arg.oldText, newText = arg.newText;
      if (this._isDiffTrimmedLines(oldText, newText)) {
        return this.deactivate({
          immediate: true
        });
      }
    };

    Mark.prototype._isDiffTrimmedLines = function(oldText, newText) {
      return JsDiff.diffTrimmedLines(oldText, newText).some(function(arg) {
        var added, removed;
        added = arg.added, removed = arg.removed;
        return !!added || !!removed;
      });
    };

    Mark.prototype._checkTextForSpaces = function(text, tabSize) {
      var ch, i, len;
      if (!(text && text.length === tabSize)) {
        return false;
      }
      for (i = 0, len = text.length; i < len; i++) {
        ch = text[i];
        if (ch !== " ") {
          return false;
        }
      }
      return true;
    };

    Mark.prototype._addClickEventListener = function() {
      var callback, editorElement;
      callback = (function(_this) {
        return function(arg) {
          var which;
          which = arg.which;
          if (which === 1) {
            return _this.deactivate();
          }
        };
      })(this);
      editorElement = atom.views.getView(this.editor);
      editorElement.addEventListener('mousedown', callback);
      return new Disposable(function() {
        return editorElement.removeEventListener('mousedown', callback);
      });
    };

    return Mark;

  })();

  module.exports = Mark;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2VtYWNzLXBsdXMvbGliL21hcmsuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx5REFBQTtJQUFBOztFQUFBLE1BQTJDLE9BQUEsQ0FBUSxNQUFSLENBQTNDLEVBQUMsaUJBQUQsRUFBUSw2Q0FBUixFQUE2Qjs7RUFDN0IsTUFBQSxHQUFTLE9BQUEsQ0FBUSxNQUFSOztFQUVIO0FBQ0osUUFBQTs7SUFBQSxlQUFBLEdBQWtCOztJQUVsQixNQUFBLEdBQVMsSUFBSTs7SUFFYixJQUFDLEVBQUEsR0FBQSxFQUFELEdBQU0sU0FBQyxNQUFEO0FBQ0osVUFBQTtNQUFBLElBQUEsR0FBTyxNQUFNLENBQUMsR0FBUCxDQUFXLE1BQVg7TUFDUCxJQUFBLENBQU8sSUFBUDtRQUNFLElBQUEsR0FBTyxJQUFJLElBQUosQ0FBUyxNQUFUO1FBQ1AsTUFBTSxDQUFDLEdBQVAsQ0FBVyxNQUFYLEVBQW1CLElBQW5CLEVBRkY7O2FBR0E7SUFMSTs7SUFPTyxjQUFDLE9BQUQ7TUFBQyxJQUFDLENBQUEsU0FBRDs7Ozs7Ozs7TUFDWixJQUFDLENBQUEsTUFBRCxHQUFVO01BQ1YsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUNyQixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFSLENBQXFCLElBQUMsQ0FBQSxPQUF0QixDQUFuQjtJQUhXOzttQkFLYixRQUFBLEdBQVUsU0FBQyxhQUFEOztRQUFDLGdCQUFnQjs7TUFDekIsSUFBQSxDQUEwQixhQUExQjtRQUFBLElBQUMsQ0FBQSxlQUFELENBQUEsRUFBQTs7TUFDQSxJQUFVLElBQUMsQ0FBQSxNQUFYO0FBQUEsZUFBQTs7TUFDQSxJQUFDLENBQUEscUJBQUQsR0FBeUIsSUFBSTtNQUM3QixJQUFDLENBQUEscUJBQXFCLENBQUMsR0FBdkIsQ0FBMkIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFSLENBQUEsQ0FBbUIsQ0FBQyxXQUFwQixDQUFnQyxJQUFDLENBQUEsV0FBakMsQ0FBM0I7TUFDQSxJQUFDLENBQUEscUJBQXFCLENBQUMsR0FBdkIsQ0FBMkIsSUFBQyxDQUFBLHNCQUFELENBQUEsQ0FBM0I7TUFDQSxJQUFDLENBQUEscUJBQXFCLENBQUMsR0FBdkIsQ0FBMkIsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUEzQjthQUNBLElBQUMsQ0FBQSxNQUFELEdBQVU7SUFQRjs7bUJBU1YsVUFBQSxHQUFZLFNBQUMsT0FBRDtBQUNWLFVBQUE7O1FBRFcsVUFBVTs7TUFDckIsSUFBQyxDQUFBLE1BQUQsR0FBVTs7WUFDWSxDQUFFLE9BQXhCLENBQUE7O01BQ0EsSUFBQyxDQUFBLHFCQUFELEdBQXlCO01BQ3pCLElBQUcsT0FBTyxDQUFDLFNBQVg7ZUFDRSxZQUFBLENBQWEsSUFBQyxDQUFBLGVBQWQsRUFERjtPQUFBLE1BQUE7ZUFHRSxJQUFDLENBQUEsZUFBRCxDQUFBLEVBSEY7O0lBSlU7O21CQVNaLE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTtNQUFBLElBQVUsSUFBQyxDQUFBLFNBQVg7QUFBQSxlQUFBOztNQUNBLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFDYixJQUFpQixJQUFDLENBQUEsTUFBbEI7UUFBQSxJQUFDLENBQUEsVUFBRCxDQUFBLEVBQUE7OztZQUNjLENBQUUsT0FBaEIsQ0FBQTs7TUFDQSxJQUFDLENBQUEsYUFBRCxHQUFpQjthQUNqQixJQUFDLENBQUEsTUFBRCxHQUFVO0lBTkg7O21CQVFULFFBQUEsR0FBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBO0lBRE87O21CQUdWLFFBQUEsR0FBVSxTQUFBO01BQ1IsSUFBQSxDQUFjLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBZDtBQUFBLGVBQUE7O2FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUEsQ0FBb0IsQ0FBQyxPQUFyQixDQUE2QixJQUFDLENBQUEsU0FBOUI7SUFGUTs7bUJBSVYsU0FBQSxHQUFXLFNBQUMsTUFBRDtBQUNULFVBQUE7TUFBQSxJQUFjLHdCQUFkO0FBQUEsZUFBQTs7TUFDQSxDQUFBLEdBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxxQkFBakIsQ0FBQTtNQUNKLENBQUEsR0FBSSxNQUFNLENBQUMsaUJBQVAsQ0FBQTthQUNKLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBakIsQ0FBZ0MsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFoQyxFQUF3QztRQUN0QyxRQUFBLEVBQVUsS0FBSyxDQUFDLEdBQU4sQ0FBVSxDQUFWLEVBQWEsQ0FBYixDQUFBLEtBQW1CLENBRFM7UUFFdEMsVUFBQSxFQUFZLEtBRjBCO09BQXhDO0lBSlM7O21CQVNYLFNBQUEsR0FBVyxTQUFBO0FBQ1QsVUFBQTtNQUFBLGFBQUEsR0FBZ0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFYLENBQW1CLElBQUMsQ0FBQSxNQUFwQjtNQUNoQixhQUFhLENBQUMsU0FBUyxDQUFDLEdBQXhCLENBQTRCLGVBQTVCO2FBQ0EsSUFBSSxVQUFKLENBQWUsU0FBQTtlQUNiLGFBQWEsQ0FBQyxTQUFTLENBQUMsTUFBeEIsQ0FBK0IsZUFBL0I7TUFEYSxDQUFmO0lBSFM7O21CQU1YLGVBQUEsR0FBaUIsU0FBQTtNQUNmLElBQWMsbUJBQWQ7QUFBQSxlQUFBOztNQUNBLElBQVUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFSLENBQUEsQ0FBVjtBQUFBLGVBQUE7O2FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUEsQ0FBb0IsQ0FBQyxPQUFyQixDQUE2QixTQUFDLE1BQUQ7ZUFDM0IsTUFBTSxDQUFDLGNBQVAsQ0FBQTtNQUQyQixDQUE3QjtJQUhlOzttQkFPakIsV0FBQSxHQUFhLFNBQUMsR0FBRDtBQUNYLFVBQUE7TUFEYSx1QkFBUztNQUN0QixJQUFnQyxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsT0FBckIsRUFBOEIsT0FBOUIsQ0FBaEM7ZUFBQSxJQUFDLENBQUEsVUFBRCxDQUFZO1VBQUEsU0FBQSxFQUFXLElBQVg7U0FBWixFQUFBOztJQURXOzttQkFHYixtQkFBQSxHQUFxQixTQUFDLE9BQUQsRUFBVSxPQUFWO2FBQ25CLE1BQU0sQ0FBQyxnQkFBUCxDQUF3QixPQUF4QixFQUFpQyxPQUFqQyxDQUF5QyxDQUFDLElBQTFDLENBQStDLFNBQUMsR0FBRDtBQUM3QyxZQUFBO1FBRCtDLG1CQUFPO2VBQ3RELENBQUMsQ0FBQyxLQUFGLElBQVcsQ0FBQyxDQUFDO01BRGdDLENBQS9DO0lBRG1COzttQkFLckIsbUJBQUEsR0FBcUIsU0FBQyxJQUFELEVBQU8sT0FBUDtBQUNuQixVQUFBO01BQUEsSUFBQSxDQUFBLENBQW9CLElBQUEsSUFBUyxJQUFJLENBQUMsTUFBTCxLQUFlLE9BQTVDLENBQUE7QUFBQSxlQUFPLE1BQVA7O0FBRUEsV0FBQSxzQ0FBQTs7UUFDRSxJQUFvQixFQUFBLEtBQU0sR0FBMUI7QUFBQSxpQkFBTyxNQUFQOztBQURGO2FBRUE7SUFMbUI7O21CQU9yQixzQkFBQSxHQUF3QixTQUFBO0FBQ3RCLFVBQUE7TUFBQSxRQUFBLEdBQVcsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7QUFFVCxjQUFBO1VBRlcsUUFBRDtVQUVWLElBQWlCLEtBQUEsS0FBUyxDQUExQjttQkFBQSxLQUFDLENBQUEsVUFBRCxDQUFBLEVBQUE7O1FBRlM7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO01BR1gsYUFBQSxHQUFnQixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQVgsQ0FBbUIsSUFBQyxDQUFBLE1BQXBCO01BQ2hCLGFBQWEsQ0FBQyxnQkFBZCxDQUErQixXQUEvQixFQUE0QyxRQUE1QzthQUNBLElBQUksVUFBSixDQUFlLFNBQUE7ZUFDYixhQUFhLENBQUMsbUJBQWQsQ0FBa0MsV0FBbEMsRUFBK0MsUUFBL0M7TUFEYSxDQUFmO0lBTnNCOzs7Ozs7RUFTMUIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUFuR2pCIiwic291cmNlc0NvbnRlbnQiOlsie1BvaW50LCBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSA9IHJlcXVpcmUoJ2F0b20nKVxuSnNEaWZmID0gcmVxdWlyZSgnZGlmZicpXG5cbmNsYXNzIE1hcmtcbiAgTUFSS19NT0RFX0NMQVNTID0gJ21hcmstbW9kZSdcblxuICBfbWFya3MgPSBuZXcgV2Vha01hcFxuXG4gIEBmb3I6IChlZGl0b3IpIC0+XG4gICAgbWFyayA9IF9tYXJrcy5nZXQoZWRpdG9yKVxuICAgIHVubGVzcyBtYXJrXG4gICAgICBtYXJrID0gbmV3IE1hcmsoZWRpdG9yKVxuICAgICAgX21hcmtzLnNldChlZGl0b3IsIG1hcmspXG4gICAgbWFya1xuXG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvcikgLT5cbiAgICBAYWN0aXZlID0gZmFsc2VcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkKEBlZGl0b3Iub25EaWREZXN0cm95KEBkZXN0cm95KSlcblxuICBhY3RpdmF0ZTogKGtlZXBTZWxlY3Rpb24gPSBmYWxzZSkgPT5cbiAgICBAX2NsZWFyU2VsZWN0aW9uKCkgdW5sZXNzIGtlZXBTZWxlY3Rpb25cbiAgICByZXR1cm4gaWYgQGFjdGl2ZVxuICAgIEBhY3RpdmF0ZVN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBhY3RpdmF0ZVN1YnNjcmlwdGlvbnMuYWRkKEBlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRDaGFuZ2UoQF9vbk1vZGlmaWVkKSlcbiAgICBAYWN0aXZhdGVTdWJzY3JpcHRpb25zLmFkZChAX2FkZENsaWNrRXZlbnRMaXN0ZW5lcigpKVxuICAgIEBhY3RpdmF0ZVN1YnNjcmlwdGlvbnMuYWRkKEBfYWRkQ2xhc3MoKSlcbiAgICBAYWN0aXZlID0gdHJ1ZVxuXG4gIGRlYWN0aXZhdGU6IChvcHRpb25zID0ge30pID0+XG4gICAgQGFjdGl2ZSA9IGZhbHNlXG4gICAgQGFjdGl2YXRlU3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgQGFjdGl2YXRlU3Vic2NyaXB0aW9ucyA9IG51bGxcbiAgICBpZiBvcHRpb25zLmltbWVkaWF0ZVxuICAgICAgc2V0SW1tZWRpYXRlKEBfY2xlYXJTZWxlY3Rpb24pXG4gICAgZWxzZVxuICAgICAgQF9jbGVhclNlbGVjdGlvbigpXG5cbiAgZGVzdHJveTogPT5cbiAgICByZXR1cm4gaWYgQGRlc3Ryb3llZFxuICAgIEBkZXN0cm95ZWQgPSB0cnVlXG4gICAgQGRlYWN0aXZhdGUoKSBpZiBAYWN0aXZlXG4gICAgQHN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIEBzdWJzY3JpcHRpb25zID0gbnVsbFxuICAgIEBlZGl0b3IgPSBudWxsXG5cbiAgaXNBY3RpdmU6IC0+XG4gICAgQGFjdGl2ZVxuXG4gIGV4Y2hhbmdlOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGlzQWN0aXZlKClcbiAgICBAZWRpdG9yLmdldEN1cnNvcnMoKS5mb3JFYWNoKEBfZXhjaGFuZ2UpXG5cbiAgX2V4Y2hhbmdlOiAoY3Vyc29yKSAtPlxuICAgIHJldHVybiB1bmxlc3MgY3Vyc29yLnNlbGVjdGlvbj9cbiAgICBiID0gY3Vyc29yLnNlbGVjdGlvbi5nZXRUYWlsQnVmZmVyUG9zaXRpb24oKVxuICAgIGEgPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIGN1cnNvci5zZWxlY3Rpb24uc2V0QnVmZmVyUmFuZ2UoW2EsIGJdLCB7XG4gICAgICByZXZlcnNlZDogUG9pbnQubWluKGEsIGIpIGlzIGJcbiAgICAgIGF1dG9zY3JvbGw6IGZhbHNlXG4gICAgfSlcblxuICBfYWRkQ2xhc3M6ID0+XG4gICAgZWRpdG9yRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhAZWRpdG9yKVxuICAgIGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZChNQVJLX01PREVfQ0xBU1MpXG4gICAgbmV3IERpc3Bvc2FibGUgLT5cbiAgICAgIGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShNQVJLX01PREVfQ0xBU1MpXG5cbiAgX2NsZWFyU2VsZWN0aW9uOiA9PlxuICAgIHJldHVybiB1bmxlc3MgQGVkaXRvcj9cbiAgICByZXR1cm4gaWYgQGVkaXRvci5pc0Rlc3Ryb3llZCgpXG4gICAgQGVkaXRvci5nZXRDdXJzb3JzKCkuZm9yRWFjaCgoY3Vyc29yKSAtPlxuICAgICAgY3Vyc29yLmNsZWFyU2VsZWN0aW9uKClcbiAgICApXG5cbiAgX29uTW9kaWZpZWQ6ICh7b2xkVGV4dCwgbmV3VGV4dH0pID0+XG4gICAgQGRlYWN0aXZhdGUoaW1tZWRpYXRlOiB0cnVlKSBpZiBAX2lzRGlmZlRyaW1tZWRMaW5lcyhvbGRUZXh0LCBuZXdUZXh0KVxuXG4gIF9pc0RpZmZUcmltbWVkTGluZXM6IChvbGRUZXh0LCBuZXdUZXh0KSAtPlxuICAgIEpzRGlmZi5kaWZmVHJpbW1lZExpbmVzKG9sZFRleHQsIG5ld1RleHQpLnNvbWUoKHthZGRlZCwgcmVtb3ZlZH0pIC0+XG4gICAgICAhIWFkZGVkIHx8ICEhcmVtb3ZlZFxuICAgIClcblxuICBfY2hlY2tUZXh0Rm9yU3BhY2VzOiAodGV4dCwgdGFiU2l6ZSkgLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHRleHQgYW5kIHRleHQubGVuZ3RoIGlzIHRhYlNpemVcblxuICAgIGZvciBjaCBpbiB0ZXh0XG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIGNoIGlzIFwiIFwiXG4gICAgdHJ1ZVxuXG4gIF9hZGRDbGlja0V2ZW50TGlzdGVuZXI6ID0+XG4gICAgY2FsbGJhY2sgPSAoe3doaWNofSkgPT5cbiAgICAgICMgbGVmdCBjbGlja1xuICAgICAgQGRlYWN0aXZhdGUoKSBpZiB3aGljaCBpcyAxXG4gICAgZWRpdG9yRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhAZWRpdG9yKVxuICAgIGVkaXRvckVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgY2FsbGJhY2spXG4gICAgbmV3IERpc3Bvc2FibGUgLT5cbiAgICAgIGVkaXRvckVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgY2FsbGJhY2spXG5cbm1vZHVsZS5leHBvcnRzID0gTWFya1xuIl19
