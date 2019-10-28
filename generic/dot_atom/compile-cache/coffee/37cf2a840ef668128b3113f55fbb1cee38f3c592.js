(function() {
  var CompositeDisposable, Mark, Point, State, ref;

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Point = ref.Point;

  State = require('./state');

  Mark = (function() {
    Mark.deactivatable = [];

    Mark.deactivatePending = function() {
      var i, len, mark, ref1;
      ref1 = this.deactivatable;
      for (i = 0, len = ref1.length; i < len; i++) {
        mark = ref1[i];
        mark.deactivate();
      }
      return this.deactivatable.length = 0;
    };

    function Mark(cursor) {
      this.cursor = cursor;
      this.editor = cursor.editor;
      this.marker = this.editor.markBufferPosition(cursor.getBufferPosition());
      this.active = false;
      this.updating = false;
    }

    Mark.prototype.destroy = function() {
      if (this.active) {
        this.deactivate();
      }
      return this.marker.destroy();
    };

    Mark.prototype.set = function(point) {
      if (point == null) {
        point = this.cursor.getBufferPosition();
      }
      this.deactivate();
      this.marker.setHeadBufferPosition(point);
      this._updateSelection();
      return this;
    };

    Mark.prototype.getBufferPosition = function() {
      return this.marker.getHeadBufferPosition();
    };

    Mark.prototype.activate = function() {
      if (!this.active) {
        this.activeSubscriptions = new CompositeDisposable;
        this.activeSubscriptions.add(this.cursor.onDidChangePosition((function(_this) {
          return function(event) {
            return _this._updateSelection(event);
          };
        })(this)));
        this.activeSubscriptions.add(atom.commands.onDidDispatch((function(_this) {
          return function(event) {
            return _this._updateSelection(event);
          };
        })(this)));
        this.activeSubscriptions.add(this.editor.getBuffer().onDidChange((function(_this) {
          return function(event) {
            if (!(_this._isIndent(event) || _this._isOutdent(event))) {
              if (State.isDuringCommand) {
                return Mark.deactivatable.push(_this);
              } else {
                return _this.deactivate();
              }
            }
          };
        })(this)));
        return this.active = true;
      }
    };

    Mark.prototype.deactivate = function() {
      if (this.active) {
        this.activeSubscriptions.dispose();
        this.active = false;
      }
      if (!this.cursor.editor.isDestroyed()) {
        return this.cursor.clearSelection();
      }
    };

    Mark.prototype.isActive = function() {
      return this.active;
    };

    Mark.prototype.exchange = function() {
      var position;
      position = this.marker.getHeadBufferPosition();
      this.set().activate();
      return this.cursor.setBufferPosition(position);
    };

    Mark.prototype._updateSelection = function(event) {
      var head, tail;
      if (!this.updating) {
        this.updating = true;
        try {
          head = this.cursor.getBufferPosition();
          tail = this.marker.getHeadBufferPosition();
          return this.setSelectionRange(head, tail);
        } finally {
          this.updating = false;
        }
      }
    };

    Mark.prototype.getSelectionRange = function() {
      return this.cursor.selection.getBufferRange();
    };

    Mark.prototype.setSelectionRange = function(head, tail) {
      var reversed;
      reversed = Point.min(head, tail) === head;
      return this.cursor.selection.setBufferRange([head, tail], {
        reversed: reversed
      });
    };

    Mark.prototype._isIndent = function(event) {
      return this._isIndentOutdent(event.newRange, event.newText);
    };

    Mark.prototype._isOutdent = function(event) {
      return this._isIndentOutdent(event.oldRange, event.oldText);
    };

    Mark.prototype._isIndentOutdent = function(range, text) {
      var diff, tabLength;
      tabLength = this.editor.getTabLength();
      diff = range.end.column - range.start.column;
      if (diff === this.editor.getTabLength() && range.start.row === range.end.row && this._checkTextForSpaces(text, tabLength)) {
        return true;
      }
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

    return Mark;

  })();

  module.exports = Mark;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2F0b21pYy1lbWFjcy9saWIvbWFyay5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQStCLE9BQUEsQ0FBUSxNQUFSLENBQS9CLEVBQUMsNkNBQUQsRUFBc0I7O0VBQ3RCLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7RUFjRjtJQUNKLElBQUMsQ0FBQSxhQUFELEdBQWlCOztJQUVqQixJQUFDLENBQUEsaUJBQUQsR0FBb0IsU0FBQTtBQUNsQixVQUFBO0FBQUE7QUFBQSxXQUFBLHNDQUFBOztRQUNFLElBQUksQ0FBQyxVQUFMLENBQUE7QUFERjthQUVBLElBQUMsQ0FBQSxhQUFhLENBQUMsTUFBZixHQUF3QjtJQUhOOztJQUtQLGNBQUMsTUFBRDtNQUNYLElBQUMsQ0FBQSxNQUFELEdBQVU7TUFDVixJQUFDLENBQUEsTUFBRCxHQUFVLE1BQU0sQ0FBQztNQUNqQixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUMsQ0FBQSxNQUFNLENBQUMsa0JBQVIsQ0FBMkIsTUFBTSxDQUFDLGlCQUFQLENBQUEsQ0FBM0I7TUFDVixJQUFDLENBQUEsTUFBRCxHQUFVO01BQ1YsSUFBQyxDQUFBLFFBQUQsR0FBWTtJQUxEOzttQkFPYixPQUFBLEdBQVMsU0FBQTtNQUNQLElBQWlCLElBQUMsQ0FBQSxNQUFsQjtRQUFBLElBQUMsQ0FBQSxVQUFELENBQUEsRUFBQTs7YUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBQTtJQUZPOzttQkFJVCxHQUFBLEdBQUssU0FBQyxLQUFEOztRQUFDLFFBQU0sSUFBQyxDQUFBLE1BQU0sQ0FBQyxpQkFBUixDQUFBOztNQUNWLElBQUMsQ0FBQSxVQUFELENBQUE7TUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLHFCQUFSLENBQThCLEtBQTlCO01BQ0EsSUFBQyxDQUFBLGdCQUFELENBQUE7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UDs7QUFERjthQUVBO0lBTG1COzs7Ozs7RUFPdkIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUF0SGpCIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGUsIFBvaW50fSA9IHJlcXVpcmUgJ2F0b20nXG5TdGF0ZSA9IHJlcXVpcmUgJy4vc3RhdGUnXG5cbiMgUmVwcmVzZW50cyBhbiBFbWFjcy1zdHlsZSBtYXJrLlxuI1xuIyBFYWNoIGN1cnNvciBtYXkgaGF2ZSBhIE1hcmsuIE9uIGNvbnN0cnVjdGlvbiwgdGhlIG1hcmsgaXMgYXQgdGhlIGN1cnNvcidzXG4jIHBvc2l0aW9uLlxuI1xuIyBUaGUgbWFyayBjYW4gdGhlbiBiZSBzZXQoKSBhdCBhbnkgdGltZSwgd2hpY2ggd2lsbCBtb3ZlIGl0IHRvIHdoZXJlIHRoZSBjdXJzb3JcbiMgaXMuXG4jXG4jIEl0IGNhbiBhbHNvIGJlIGFjdGl2YXRlKClkIGFuZCBkZWFjdGl2YXRlKClkLiBXaGlsZSBhY3RpdmUsIHRoZSByZWdpb24gYmV0d2VlblxuIyB0aGUgbWFyayBhbmQgdGhlIGN1cnNvciBpcyBzZWxlY3RlZCwgYW5kIHRoaXMgc2VsZWN0aW9uIGlzIHVwZGF0ZWQgYXMgdGhlXG4jIGN1cnNvciBpcyBtb3ZlZC4gSWYgdGhlIGJ1ZmZlciBpcyBlZGl0ZWQsIHRoZSBtYXJrIGlzIGF1dG9tYXRpY2FsbHlcbiMgZGVhY3RpdmF0ZWQuXG5jbGFzcyBNYXJrXG4gIEBkZWFjdGl2YXRhYmxlID0gW11cblxuICBAZGVhY3RpdmF0ZVBlbmRpbmc6IC0+XG4gICAgZm9yIG1hcmsgaW4gQGRlYWN0aXZhdGFibGVcbiAgICAgIG1hcmsuZGVhY3RpdmF0ZSgpXG4gICAgQGRlYWN0aXZhdGFibGUubGVuZ3RoID0gMFxuXG4gIGNvbnN0cnVjdG9yOiAoY3Vyc29yKSAtPlxuICAgIEBjdXJzb3IgPSBjdXJzb3JcbiAgICBAZWRpdG9yID0gY3Vyc29yLmVkaXRvclxuICAgIEBtYXJrZXIgPSBAZWRpdG9yLm1hcmtCdWZmZXJQb3NpdGlvbihjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICBAYWN0aXZlID0gZmFsc2VcbiAgICBAdXBkYXRpbmcgPSBmYWxzZVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQGRlYWN0aXZhdGUoKSBpZiBAYWN0aXZlXG4gICAgQG1hcmtlci5kZXN0cm95KClcblxuICBzZXQ6IChwb2ludD1AY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpIC0+XG4gICAgQGRlYWN0aXZhdGUoKVxuICAgIEBtYXJrZXIuc2V0SGVhZEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuICAgIEBfdXBkYXRlU2VsZWN0aW9uKClcbiAgICBAXG5cbiAgZ2V0QnVmZmVyUG9zaXRpb246IC0+XG4gICAgQG1hcmtlci5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIGlmIG5vdCBAYWN0aXZlXG4gICAgICBAYWN0aXZlU3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgICBAYWN0aXZlU3Vic2NyaXB0aW9ucy5hZGQgQGN1cnNvci5vbkRpZENoYW5nZVBvc2l0aW9uIChldmVudCkgPT5cbiAgICAgICAgQF91cGRhdGVTZWxlY3Rpb24oZXZlbnQpXG4gICAgICAjIEN1cnNvciBtb3ZlbWVudCBjb21tYW5kcyBsaWtlIGN1cnNvci5tb3ZlRG93biBkZWFjdGl2YXRlIHRoZSBzZWxlY3Rpb25cbiAgICAgICMgdW5jb25kaXRpb25hbGx5LCBidXQgZG9uJ3QgdHJpZ2dlciBvbkRpZENoYW5nZVBvc2l0aW9uIGlmIHRoZSBwb3NpdGlvblxuICAgICAgIyBkb2Vzbid0IGNoYW5nZSAoZS5nLiBhdCBFT0YpLiBTbyB3ZSBhbHNvIHVwZGF0ZSB0aGUgc2VsZWN0aW9uIGFmdGVyIGFueVxuICAgICAgIyBjb21tYW5kLlxuICAgICAgQGFjdGl2ZVN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMub25EaWREaXNwYXRjaCAoZXZlbnQpID0+XG4gICAgICAgIEBfdXBkYXRlU2VsZWN0aW9uKGV2ZW50KVxuICAgICAgQGFjdGl2ZVN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRDaGFuZ2UgKGV2ZW50KSA9PlxuICAgICAgICB1bmxlc3MgQF9pc0luZGVudChldmVudCkgb3IgQF9pc091dGRlbnQoZXZlbnQpXG4gICAgICAgICAgIyBJZiB3ZSdyZSBpbiBhIGNvbW1hbmQgKGFzIG9wcG9zZWQgdG8gYSBzaW1wbGUgY2hhcmFjdGVyIGluc2VydCksXG4gICAgICAgICAgIyBkZWxheSB0aGUgZGVhY3RpdmF0aW9uIHVudGlsIHRoZSBlbmQgb2YgdGhlIGNvbW1hbmQuIE90aGVyd2lzZVxuICAgICAgICAgICMgdXBkYXRpbmcgb25lIHNlbGVjdGlvbiBtYXkgcHJlbWF0dXJlbHkgZGVhY3RpdmF0ZSB0aGUgbWFyayBhbmQgY2xlYXJcbiAgICAgICAgICAjIGEgc2Vjb25kIHNlbGVjdGlvbiBiZWZvcmUgaXQgaGFzIGEgY2hhbmNlIHRvIGJlIHVwZGF0ZWQuXG4gICAgICAgICAgaWYgU3RhdGUuaXNEdXJpbmdDb21tYW5kXG4gICAgICAgICAgICBNYXJrLmRlYWN0aXZhdGFibGUucHVzaCh0aGlzKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBkZWFjdGl2YXRlKClcbiAgICAgIEBhY3RpdmUgPSB0cnVlXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBpZiBAYWN0aXZlXG4gICAgICBAYWN0aXZlU3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICAgIEBhY3RpdmUgPSBmYWxzZVxuICAgIHVubGVzcyBAY3Vyc29yLmVkaXRvci5pc0Rlc3Ryb3llZCgpXG4gICAgICBAY3Vyc29yLmNsZWFyU2VsZWN0aW9uKClcblxuICBpc0FjdGl2ZTogLT5cbiAgICBAYWN0aXZlXG5cbiAgZXhjaGFuZ2U6IC0+XG4gICAgcG9zaXRpb24gPSBAbWFya2VyLmdldEhlYWRCdWZmZXJQb3NpdGlvbigpXG4gICAgQHNldCgpLmFjdGl2YXRlKClcbiAgICBAY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvc2l0aW9uKVxuXG4gIF91cGRhdGVTZWxlY3Rpb246IChldmVudCkgLT5cbiAgICAjIFVwZGF0aW5nIHRoZSBzZWxlY3Rpb24gdXBkYXRlcyB0aGUgY3Vyc29yIG1hcmtlciwgc28gZ3VhcmQgYWdhaW5zdCB0aGVcbiAgICAjIG5lc3RlZCBpbnZvY2F0aW9uLlxuICAgIGlmICFAdXBkYXRpbmdcbiAgICAgIEB1cGRhdGluZyA9IHRydWVcbiAgICAgIHRyeVxuICAgICAgICBoZWFkID0gQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICAgIHRhaWwgPSBAbWFya2VyLmdldEhlYWRCdWZmZXJQb3NpdGlvbigpXG4gICAgICAgIEBzZXRTZWxlY3Rpb25SYW5nZShoZWFkLCB0YWlsKVxuICAgICAgZmluYWxseVxuICAgICAgICBAdXBkYXRpbmcgPSBmYWxzZVxuXG4gIGdldFNlbGVjdGlvblJhbmdlOiAtPlxuICAgIEBjdXJzb3Iuc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcblxuICBzZXRTZWxlY3Rpb25SYW5nZTogKGhlYWQsIHRhaWwpIC0+XG4gICAgcmV2ZXJzZWQgPSBQb2ludC5taW4oaGVhZCwgdGFpbCkgaXMgaGVhZFxuICAgIEBjdXJzb3Iuc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlKFtoZWFkLCB0YWlsXSwgcmV2ZXJzZWQ6IHJldmVyc2VkKVxuXG4gIF9pc0luZGVudDogKGV2ZW50KS0+XG4gICAgQF9pc0luZGVudE91dGRlbnQoZXZlbnQubmV3UmFuZ2UsIGV2ZW50Lm5ld1RleHQpXG5cbiAgX2lzT3V0ZGVudDogKGV2ZW50KS0+XG4gICAgQF9pc0luZGVudE91dGRlbnQoZXZlbnQub2xkUmFuZ2UsIGV2ZW50Lm9sZFRleHQpXG5cbiAgX2lzSW5kZW50T3V0ZGVudDogKHJhbmdlLCB0ZXh0KS0+XG4gICAgdGFiTGVuZ3RoID0gQGVkaXRvci5nZXRUYWJMZW5ndGgoKVxuICAgIGRpZmYgPSByYW5nZS5lbmQuY29sdW1uIC0gcmFuZ2Uuc3RhcnQuY29sdW1uXG4gICAgdHJ1ZSBpZiBkaWZmID09IEBlZGl0b3IuZ2V0VGFiTGVuZ3RoKCkgYW5kIHJhbmdlLnN0YXJ0LnJvdyA9PSByYW5nZS5lbmQucm93IGFuZCBAX2NoZWNrVGV4dEZvclNwYWNlcyh0ZXh0LCB0YWJMZW5ndGgpXG5cbiAgX2NoZWNrVGV4dEZvclNwYWNlczogKHRleHQsIHRhYlNpemUpLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHRleHQgYW5kIHRleHQubGVuZ3RoIGlzIHRhYlNpemVcblxuICAgIGZvciBjaCBpbiB0ZXh0XG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIGNoIGlzIFwiIFwiXG4gICAgdHJ1ZVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1hcmtcbiJdfQ==
