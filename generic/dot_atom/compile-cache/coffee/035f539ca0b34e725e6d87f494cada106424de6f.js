(function() {
  var Point, Range, Search, SearchManager, SearchResults, SearchView, Utils, ref;

  ref = require('atom'), Point = ref.Point, Range = ref.Range;

  Search = require('./search');

  SearchResults = require('./search-results');

  SearchView = require('./search-view');

  Utils = require('./utils');

  module.exports = SearchManager = (function() {
    function SearchManager(atomicEmacs) {
      this.atomicEmacs = atomicEmacs;
      this.emacsEditor = null;
      this.searchView = null;
      this.originCursors = null;
      this.checkpointCursors = null;
      this.search = null;
      this.results = null;
    }

    SearchManager.prototype.destroy = function() {
      var ref1, ref2, ref3;
      this.exit();
      if ((ref1 = this.results) != null) {
        ref1.clear();
      }
      if ((ref2 = this.search) != null) {
        ref2.stop();
      }
      return (ref3 = this.searchView) != null ? ref3.destroy() : void 0;
    };

    SearchManager.prototype.start = function(emacsEditor, arg) {
      var direction;
      this.emacsEditor = emacsEditor;
      direction = arg.direction;
      if (this.searchView == null) {
        this.searchView = new SearchView(this);
      }
      this.searchView.start({
        direction: direction
      });
      this.originCursors = this.emacsEditor.saveCursors();
      return this.checkpointCursors = this.originCursors;
    };

    SearchManager.prototype.exit = function() {
      if (this.searchView != null) {
        this.searchView.exit();
        return this.emacsEditor.editor.element.focus();
      }
    };

    SearchManager.prototype.cancel = function() {
      this.searchView.cancel();
      return this.emacsEditor.editor.element.focus();
    };

    SearchManager.prototype.repeat = function(direction) {
      if (this.searchView.isEmpty()) {
        this.searchView.repeatLastQuery(direction);
        return;
      }
      if (this.results != null) {
        this.checkpointCursors = this.emacsEditor.saveCursors();
        return this._advanceCursors(direction);
      }
    };

    SearchManager.prototype.toggleCaseSensitivity = function() {
      return this.searchView.toggleCaseSensitivity();
    };

    SearchManager.prototype.toggleIsRegExp = function() {
      return this.searchView.toggleIsRegExp();
    };

    SearchManager.prototype.yankWordOrCharacter = function() {
      var emacsCursor, range, text;
      if (this.emacsEditor.editor.hasMultipleCursors()) {
        atom.notifications.addInfo("Can't yank into search when using multiple cursors");
      }
      emacsCursor = this.emacsEditor.getEmacsCursors()[0];
      range = this._wordOrCharacterRangeFrom(emacsCursor);
      text = this.emacsEditor.editor.getTextInBufferRange(range);
      return this.searchView.append(text);
    };

    SearchManager.prototype.isRunning = function() {
      var ref1;
      return (ref1 = this.search) != null ? ref1.isRunning() : void 0;
    };

    SearchManager.prototype._wordOrCharacterRangeFrom = function(emacsCursor) {
      var alphanumPattern, doWord, eob, nextChar, point, range, target;
      eob = this.emacsEditor.editor.getBuffer().getEndPosition();
      point = emacsCursor.cursor.getBufferPosition();
      alphanumPattern = /[a-z0-9]/i;
      nextChar = this.emacsEditor.characterAfter(point);
      doWord = alphanumPattern.test(nextChar) || alphanumPattern.test(this.emacsEditor.characterAfter(this.emacsEditor.positionAfter(point)));
      target = doWord ? (range = emacsCursor.locateForward(alphanumPattern), range ? range = this.emacsEditor.locateForwardFrom(range.start, /[^a-z0-9]/i) : void 0, range ? range.start : eob) : /[ \t]/.test(nextChar) ? (range = emacsCursor.locateForward(/[^ \t]/), range ? range.start : eob) : this.emacsEditor.positionAfter(point) || eob;
      return new Range(point, target);
    };

    SearchManager.prototype.changed = function(text, arg) {
      var canMove, caseSensitive, direction, e, isRegExp, moved, ref1, ref2, ref3, regExp, sortedCursors, wrapped;
      caseSensitive = arg.caseSensitive, isRegExp = arg.isRegExp, direction = arg.direction;
      if ((ref1 = this.results) != null) {
        ref1.clear();
      }
      if ((ref2 = this.search) != null) {
        ref2.stop();
      }
      this.results = SearchResults["for"](this.emacsEditor);
      this.results.clear();
      this.searchView.resetProgress();
      if (text === '') {
        return;
      }
      caseSensitive = caseSensitive || (!isRegExp && /[A-Z]/.test(text));
      sortedCursors = this.checkpointCursors.sort(function(a, b) {
        var headComparison;
        return headComparison = a.head.compare(b.head);
      });
      wrapped = false;
      moved = false;
      canMove = (function(_this) {
        return function() {
          var firstCursorPosition, lastCursorPosition;
          if (direction === 'forward') {
            lastCursorPosition = sortedCursors[sortedCursors.length - 1].head;
            return _this.results.findResultAfter(lastCursorPosition);
          } else {
            firstCursorPosition = sortedCursors[0].head;
            return _this.results.findResultBefore(firstCursorPosition);
          }
        };
      })(this);
      try {
        regExp = new RegExp(isRegExp ? text : Utils.escapeForRegExp(text), caseSensitive ? 'g' : 'ig');
      } catch (error) {
        e = error;
        this.searchView.setError(e);
        return;
      }
      this.search = new Search({
        emacsEditor: this.emacsEditor,
        startPosition: direction === 'forward' ? sortedCursors[0].head : sortedCursors[sortedCursors.length - 1].head,
        direction: direction,
        regExp: regExp,
        onMatch: (function(_this) {
          return function(range) {
            if (_this.results == null) {
              return;
            }
            _this.results.add(range, wrapped);
            if (!moved && (canMove() || wrapped)) {
              _this.emacsEditor.restoreCursors(_this.checkpointCursors);
              _this._advanceCursors(direction);
              return moved = true;
            }
          };
        })(this),
        onWrapped: function() {
          return wrapped = true;
        },
        onBlockFinished: (function(_this) {
          return function() {
            return _this._updateSearchView();
          };
        })(this),
        onFinished: (function(_this) {
          return function() {
            if (_this.results == null) {
              return;
            }
            if (!moved) {
              _this.emacsEditor.restoreCursors(_this.checkpointCursors);
              if (_this.results.numMatches() > 0) {
                _this._advanceCursors(direction);
                moved = true;
              }
            }
            return _this.searchView.scanningDone();
          };
        })(this)
      });
      return (ref3 = this.search) != null ? ref3.start() : void 0;
    };

    SearchManager.prototype._updateSearchView = function() {
      var point;
      point = this.emacsEditor.editor.getCursors()[0].getBufferPosition();
      return this.searchView.setProgress(this.results.numMatchesBefore(point), this.results.numMatches());
    };

    SearchManager.prototype._advanceCursors = function(direction) {
      var markers, pos;
      if (this.results == null) {
        return;
      }
      if (this.results.numMatches() === 0) {
        return;
      }
      markers = [];
      if (direction === 'forward') {
        this.emacsEditor.moveEmacsCursors((function(_this) {
          return function(emacsCursor) {
            var marker;
            marker = _this.results.findResultAfter(emacsCursor.cursor.getBufferPosition());
            if (marker === null) {
              _this.searchView.showWrapIcon(direction);
              marker = _this.results.findResultAfter(new Point(0, 0));
            }
            emacsCursor.cursor.setBufferPosition(marker.getEndBufferPosition());
            return markers.push(marker);
          };
        })(this));
      } else {
        this.emacsEditor.moveEmacsCursors((function(_this) {
          return function(emacsCursor) {
            var marker;
            marker = _this.results.findResultBefore(emacsCursor.cursor.getBufferPosition());
            if (marker === null) {
              _this.searchView.showWrapIcon(direction);
              marker = _this.results.findResultBefore(_this.emacsEditor.editor.getBuffer().getEndPosition());
            }
            emacsCursor.cursor.setBufferPosition(marker.getStartBufferPosition());
            return markers.push(marker);
          };
        })(this));
      }
      pos = this.emacsEditor.editor.getCursors()[0].getBufferPosition();
      this.emacsEditor.editor.scrollToBufferPosition(pos, {
        center: true
      });
      this.results.setCurrent(markers);
      return this._updateSearchView();
    };

    SearchManager.prototype.exited = function() {
      return this._deactivate();
    };

    SearchManager.prototype.canceled = function() {
      this.emacsEditor.restoreCursors(this.originCursors);
      return this._deactivate();
    };

    SearchManager.prototype._deactivate = function() {
      var ref1, ref2;
      if ((ref1 = this.search) != null) {
        ref1.stop();
      }
      this.search = null;
      if ((ref2 = this.results) != null) {
        ref2.clear();
      }
      this.results = null;
      return this.originCursors = null;
    };

    return SearchManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2F0b21pYy1lbWFjcy9saWIvc2VhcmNoLW1hbmFnZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFpQixPQUFBLENBQVEsTUFBUixDQUFqQixFQUFDLGlCQUFELEVBQVE7O0VBQ1IsTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztFQUNULGFBQUEsR0FBZ0IsT0FBQSxDQUFRLGtCQUFSOztFQUNoQixVQUFBLEdBQWEsT0FBQSxDQUFRLGVBQVI7O0VBQ2IsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSOztFQUVSLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyx1QkFBQyxXQUFEO01BQUMsSUFBQyxDQUFBLGNBQUQ7TUFDWixJQUFDLENBQUEsV0FBRCxHQUFlO01BRWYsSUFBQyxDQUFBLFVBQUQsR0FBYztNQUNkLElBQUMsQ0FBQSxhQUFELEdBQWlCO01BQ2pCLElBQUMsQ0FBQSxpQkFBRCxHQUFxQjtNQUVyQixJQUFDLENBQUEsTUFBRCxHQUFVO01BQ1YsSUFBQyxDQUFBLE9BQUQsR0FBVztJQVJBOzs0QkFVYixPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7TUFBQSxJQUFDLENBQUEsSUFBRCxDQUFBOztZQUNRLENBQUUsS0FBVixDQUFBOzs7WUFDTyxDQUFFLElBQVQsQ0FBQTs7b0RBQ1csQ0FBRSxPQUFiLENBQUE7SUFKTzs7NEJBTVQsS0FBQSxHQUFPLFNBQUMsV0FBRCxFQUFlLEdBQWY7QUFDTCxVQUFBO01BRE0sSUFBQyxDQUFBLGNBQUQ7TUFBZSxZQUFEOztRQUNwQixJQUFDLENBQUEsYUFBYyxJQUFJLFVBQUosQ0FBZSxJQUFmOztNQUNmLElBQUMsQ0FBQSxVQUFVLENBQUMsS0FBWixDQUFrQjtRQUFDLFdBQUEsU0FBRDtPQUFsQjtNQUNBLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUMsQ0FBQSxXQUFX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LE1BQU0sQ0FBQyxzQkFBUCxDQUFBLENBQXJDO21CQUNBLE9BQU8sQ0FBQyxJQUFSLENBQWEsTUFBYjtVQU40QjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBOUIsRUFURjs7TUFpQkEsR0FBQSxHQUFNLElBQUMsQ0FBQSxXQUFXLENBQUMsTUFBTSxDQUFDLFVBQXBCLENBQUEsQ0FBaUMsQ0FBQSxDQUFBLENBQUUsQ0FBQyxpQkFBcEMsQ0FBQTtNQUNOLElBQUMsQ0FBQSxXQUFXLENBQUMsTUFBTSxDQUFDLHNCQUFwQixDQUEyQyxHQUEzQyxFQUFnRDtRQUFBLE1BQUEsRUFBUSxJQUFSO09BQWhEO01BQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxVQUFULENBQW9CLE9BQXBCO2FBQ0EsSUFBQyxDQUFBLGlCQUFELENBQUE7SUF6QmU7OzRCQTJCakIsTUFBQSxHQUFRLFNBQUE7YUFDTixJQUFDLENBQUEsV0FBRCxDQUFBO0lBRE07OzRCQUdSLFFBQUEsR0FBVSxTQUFBO01BQ1IsSUFBQyxDQUFBLFdBQVcsQ0FBQyxjQUFiLENBQTRCLElBQUMsQ0FBQSxhQUE3QjthQUNBLElBQUMsQ0FBQSxXQUFELENBQUE7SUFGUTs7NEJBSVYsV0FBQSxHQUFhLFNBQUE7QUFDWCxVQUFBOztZQUFPLENBQUUsSUFBVCxDQUFBOztNQUNBLElBQUMsQ0FBQSxNQUFELEdBQVU7O1lBQ0YsQ0FBRSxLQUFWLENBQUE7O01BQ0EsSUFBQyxDQUFBLE9BQUQsR0FBVzthQUNYLElBQUMsQ0FBQSxhQUFELEdBQWlCO0lBTE47Ozs7O0FBaE1mIiwic291cmNlc0NvbnRlbnQiOlsie1BvaW50LCBSYW5nZX0gPSByZXF1aXJlICdhdG9tJ1xuU2VhcmNoID0gcmVxdWlyZSAnLi9zZWFyY2gnXG5TZWFyY2hSZXN1bHRzID0gcmVxdWlyZSAnLi9zZWFyY2gtcmVzdWx0cydcblNlYXJjaFZpZXcgPSByZXF1aXJlICcuL3NlYXJjaC12aWV3J1xuVXRpbHMgPSByZXF1aXJlICcuL3V0aWxzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTZWFyY2hNYW5hZ2VyXG4gIGNvbnN0cnVjdG9yOiAoQGF0b21pY0VtYWNzKSAtPlxuICAgIEBlbWFjc0VkaXRvciA9IG51bGxcblxuICAgIEBzZWFyY2hWaWV3ID0gbnVsbFxuICAgIEBvcmlnaW5DdXJzb3JzID0gbnVsbFxuICAgIEBjaGVja3BvaW50Q3Vyc29ycyA9IG51bGxcblxuICAgIEBzZWFyY2ggPSBudWxsXG4gICAgQHJlc3VsdHMgPSBudWxsXG5cbiAgZGVzdHJveTogLT5cbiAgICBAZXhpdCgpXG4gICAgQHJlc3VsdHM/LmNsZWFyKClcbiAgICBAc2VhcmNoPy5zdG9wKClcbiAgICBAc2VhcmNoVmlldz8uZGVzdHJveSgpXG5cbiAgc3RhcnQ6IChAZW1hY3NFZGl0b3IsIHtkaXJlY3Rpb259KSAtPlxuICAgIEBzZWFyY2hWaWV3ID89IG5ldyBTZWFyY2hWaWV3KHRoaXMpXG4gICAgQHNlYXJjaFZpZXcuc3RhcnQoe2RpcmVjdGlvbn0pXG4gICAgQG9yaWdpbkN1cnNvcnMgPSBAZW1hY3NFZGl0b3Iuc2F2ZUN1cnNvcnMoKVxuICAgIEBjaGVja3BvaW50Q3Vyc29ycyA9IEBvcmlnaW5DdXJzb3JzXG5cbiAgZXhpdDogLT5cbiAgICBpZiBAc2VhcmNoVmlldz9cbiAgICAgIEBzZWFyY2hWaWV3LmV4aXQoKVxuICAgICAgQGVtYWNzRWRpdG9yLmVkaXRvci5lbGVtZW50LmZvY3VzKClcblxuICBjYW5jZWw6IC0+XG4gICAgQHNlYXJjaFZpZXcuY2FuY2VsKClcbiAgICBAZW1hY3NFZGl0b3IuZWRpdG9yLmVsZW1lbnQuZm9jdXMoKVxuXG4gIHJlcGVhdDogKGRpcmVjdGlvbikgLT5cbiAgICBpZiBAc2VhcmNoVmlldy5pc0VtcHR5KClcbiAgICAgIEBzZWFyY2hWaWV3LnJlcGVhdExhc3RRdWVyeShkaXJlY3Rpb24pXG4gICAgICByZXR1cm5cblxuICAgIGlmIEByZXN1bHRzP1xuICAgICAgQGNoZWNrcG9pbnRDdXJzb3JzID0gQGVtYWNzRWRpdG9yLnNhdmVDdXJzb3JzKClcbiAgICAgIEBfYWR2YW5jZUN1cnNvcnMoZGlyZWN0aW9uKVxuXG4gIHRvZ2dsZUNhc2VTZW5zaXRpdml0eTogLT5cbiAgICBAc2VhcmNoVmlldy50b2dnbGVDYXNlU2Vuc2l0aXZpdHkoKVxuXG4gIHRvZ2dsZUlzUmVnRXhwOiAtPlxuICAgIEBzZWFyY2hWaWV3LnRvZ2dsZUlzUmVnRXhwKClcblxuICB5YW5rV29yZE9yQ2hhcmFjdGVyOiAtPlxuICAgIGlmIEBlbWFjc0VkaXRvci5lZGl0b3IuaGFzTXVsdGlwbGVDdXJzb3JzKClcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvIFwiQ2FuJ3QgeWFuayBpbnRvIHNlYXJjaCB3aGVuIHVzaW5nIG11bHRpcGxlIGN1cnNvcnNcIlxuXG4gICAgZW1hY3NDdXJzb3IgPSBAZW1hY3NFZGl0b3IuZ2V0RW1hY3NDdXJzb3JzKClbMF1cbiAgICByYW5nZSA9IEBfd29yZE9yQ2hhcmFjdGVyUmFuZ2VGcm9tKGVtYWNzQ3Vyc29yKVxuICAgIHRleHQgPSBAZW1hY3NFZGl0b3IuZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlKVxuICAgIEBzZWFyY2hWaWV3LmFwcGVuZCh0ZXh0KVxuXG4gIGlzUnVubmluZzogLT5cbiAgICBAc2VhcmNoPy5pc1J1bm5pbmcoKVxuXG4gIF93b3JkT3JDaGFyYWN0ZXJSYW5nZUZyb206IChlbWFjc0N1cnNvcikgLT5cbiAgICBlb2IgPSBAZW1hY3NFZGl0b3IuZWRpdG9yLmdldEJ1ZmZlcigpLmdldEVuZFBvc2l0aW9uKClcbiAgICBwb2ludCA9IGVtYWNzQ3Vyc29yLmN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgYWxwaGFudW1QYXR0ZXJuID0gL1thLXowLTldL2lcblxuICAgIG5leHRDaGFyID0gQGVtYWNzRWRpdG9yLmNoYXJhY3RlckFmdGVyKHBvaW50KVxuICAgIGRvV29yZCA9IGFscGhhbnVtUGF0dGVybi50ZXN0KG5leHRDaGFyKSBvclxuICAgICAgYWxwaGFudW1QYXR0ZXJuLnRlc3QoQGVtYWNzRWRpdG9yLmNoYXJhY3RlckFmdGVyKEBlbWFjc0VkaXRvci5wb3NpdGlvbkFmdGVyKHBvaW50KSkpXG5cbiAgICB0YXJnZXQgPVxuICAgICAgaWYgZG9Xb3JkXG4gICAgICAgIHJhbmdlID0gZW1hY3NDdXJzb3IubG9jYXRlRm9yd2FyZChhbHBoYW51bVBhdHRlcm4pXG4gICAgICAgIGlmIHJhbmdlXG4gICAgICAgICAgcmFuZ2UgPSBAZW1hY3NFZGl0b3IubG9jYXRlRm9yd2FyZEZyb20ocmFuZ2Uuc3RhcnQsIC9bXmEtejAtOV0vaSlcbiAgICAgICAgaWYgcmFuZ2UgdGhlbiByYW5nZS5zdGFydCBlbHNlIGVvYlxuICAgICAgZWxzZVxuICAgICAgICBpZiAvWyBcXHRdLy50ZXN0KG5leHRDaGFyKVxuICAgICAgICAgIHJhbmdlID0gZW1hY3NDdXJzb3IubG9jYXRlRm9yd2FyZCgvW14gXFx0XS8pXG4gICAgICAgICAgaWYgcmFuZ2UgdGhlbiByYW5nZS5zdGFydCBlbHNlIGVvYlxuICAgICAgICBlbHNlXG4gICAgICAgICAgQGVtYWNzRWRpdG9yLnBvc2l0aW9uQWZ0ZXIocG9pbnQpIG9yIGVvYlxuICAgIG5ldyBSYW5nZShwb2ludCwgdGFyZ2V0KVxuXG4gIGNoYW5nZWQ6ICh0ZXh0LCB7Y2FzZVNlbnNpdGl2ZSwgaXNSZWdFeHAsIGRpcmVjdGlvbn0pIC0+XG4gICAgQHJlc3VsdHM/LmNsZWFyKClcbiAgICBAc2VhcmNoPy5zdG9wKClcblxuICAgIEByZXN1bHRzID0gU2VhcmNoUmVzdWx0cy5mb3IoQGVtYWNzRWRpdG9yKVxuICAgIEByZXN1bHRzLmNsZWFyKClcbiAgICBAc2VhcmNoVmlldy5yZXNldFByb2dyZXNzKClcblxuICAgIHJldHVybiBpZiB0ZXh0ID09ICcnXG5cbiAgICBjYXNlU2Vuc2l0aXZlID0gY2FzZVNlbnNpdGl2ZSBvciAobm90IGlzUmVnRXhwIGFuZCAvW0EtWl0vLnRlc3QodGV4dCkpXG5cbiAgICBzb3J0ZWRDdXJzb3JzID0gQGNoZWNrcG9pbnRDdXJzb3JzLnNvcnQgKGEsIGIpIC0+XG4gICAgICBoZWFkQ29tcGFyaXNvbiA9IGEuaGVhZC5jb21wYXJlKGIuaGVhZClcblxuICAgIHdyYXBwZWQgPSBmYWxzZVxuICAgIG1vdmVkID0gZmFsc2VcbiAgICBjYW5Nb3ZlID0gPT5cbiAgICAgIGlmIGRpcmVjdGlvbiA9PSAnZm9yd2FyZCdcbiAgICAgICAgbGFzdEN1cnNvclBvc2l0aW9uID0gc29ydGVkQ3Vyc29yc1tzb3J0ZWRDdXJzb3JzLmxlbmd0aCAtIDFdLmhlYWRcbiAgICAgICAgQHJlc3VsdHMuZmluZFJlc3VsdEFmdGVyKGxhc3RDdXJzb3JQb3NpdGlvbilcbiAgICAgIGVsc2VcbiAgICAgICAgZmlyc3RDdXJzb3JQb3NpdGlvbiA9IHNvcnRlZEN1cnNvcnNbMF0uaGVhZFxuICAgICAgICBAcmVzdWx0cy5maW5kUmVzdWx0QmVmb3JlKGZpcnN0Q3Vyc29yUG9zaXRpb24pXG5cbiAgICB0cnlcbiAgICAgIHJlZ0V4cCA9IG5ldyBSZWdFeHAoXG4gICAgICAgIGlmIGlzUmVnRXhwIHRoZW4gdGV4dCBlbHNlIFV0aWxzLmVzY2FwZUZvclJlZ0V4cCh0ZXh0KVxuICAgICAgICBpZiBjYXNlU2Vuc2l0aXZlIHRoZW4gJ2cnIGVsc2UgJ2lnJ1xuICAgICAgKVxuICAgIGNhdGNoIGVcbiAgICAgIEBzZWFyY2hWaWV3LnNldEVycm9yKGUpXG4gICAgICByZXR1cm5cblxuICAgIEBzZWFyY2ggPSBuZXcgU2VhcmNoXG4gICAgICBlbWFjc0VkaXRvcjogQGVtYWNzRWRpdG9yXG4gICAgICBzdGFydFBvc2l0aW9uOlxuICAgICAgICBpZiBkaXJlY3Rpb24gPT0gJ2ZvcndhcmQnXG4gICAgICAgICAgc29ydGVkQ3Vyc29yc1swXS5oZWFkXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBzb3J0ZWRDdXJzb3JzW3NvcnRlZEN1cnNvcnMubGVuZ3RoIC0gMV0uaGVhZFxuICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb25cbiAgICAgIHJlZ0V4cDogcmVnRXhwXG4gICAgICBvbk1hdGNoOiAocmFuZ2UpID0+XG4gICAgICAgIHJldHVybiBpZiBub3QgQHJlc3VsdHM/XG4gICAgICAgIEByZXN1bHRzLmFkZChyYW5nZSwgd3JhcHBlZClcbiAgICAgICAgaWYgbm90IG1vdmVkIGFuZCAoY2FuTW92ZSgpIG9yIHdyYXBwZWQpXG4gICAgICAgICAgQGVtYWNzRWRpdG9yLnJlc3RvcmVDdXJzb3JzKEBjaGVja3BvaW50Q3Vyc29ycylcbiAgICAgICAgICBAX2FkdmFuY2VDdXJzb3JzKGRpcmVjdGlvbilcbiAgICAgICAgICBtb3ZlZCA9IHRydWVcbiAgICAgIG9uV3JhcHBlZDogLT5cbiAgICAgICAgd3JhcHBlZCA9IHRydWVcbiAgICAgIG9uQmxvY2tGaW5pc2hlZDogPT5cbiAgICAgICAgQF91cGRhdGVTZWFyY2hWaWV3KClcbiAgICAgIG9uRmluaXNoZWQ6ID0+XG4gICAgICAgIHJldHVybiBpZiBub3QgQHJlc3VsdHM/XG4gICAgICAgIGlmIG5vdCBtb3ZlZFxuICAgICAgICAgIEBlbWFjc0VkaXRvci5yZXN0b3JlQ3Vyc29ycyhAY2hlY2twb2ludEN1cnNvcnMpXG4gICAgICAgICAgaWYgQHJlc3VsdHMubnVtTWF0Y2hlcygpID4gMFxuICAgICAgICAgICAgQF9hZHZhbmNlQ3Vyc29ycyhkaXJlY3Rpb24pXG4gICAgICAgICAgICBtb3ZlZCA9IHRydWVcbiAgICAgICAgQHNlYXJjaFZpZXcuc2Nhbm5pbmdEb25lKClcblxuICAgIEBzZWFyY2g/LnN0YXJ0KClcblxuICBfdXBkYXRlU2VhcmNoVmlldzogLT5cbiAgICBwb2ludCA9IEBlbWFjc0VkaXRvci5lZGl0b3IuZ2V0Q3Vyc29ycygpWzBdLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBAc2VhcmNoVmlldy5zZXRQcm9ncmVzcyhAcmVzdWx0cy5udW1NYXRjaGVzQmVmb3JlKHBvaW50KSwgQHJlc3VsdHMubnVtTWF0Y2hlcygpKVxuXG4gIF9hZHZhbmNlQ3Vyc29yczogKGRpcmVjdGlvbikgLT5cbiAgICByZXR1cm4gaWYgbm90IEByZXN1bHRzP1xuICAgIHJldHVybiBpZiBAcmVzdWx0cy5udW1NYXRjaGVzKCkgPT0gMFxuXG4gICAgbWFya2VycyA9IFtdXG4gICAgaWYgZGlyZWN0aW9uID09ICdmb3J3YXJkJ1xuICAgICAgQGVtYWNzRWRpdG9yLm1vdmVFbWFjc0N1cnNvcnMgKGVtYWNzQ3Vyc29yKSA9PlxuICAgICAgICBtYXJrZXIgPSBAcmVzdWx0cy5maW5kUmVzdWx0QWZ0ZXIoZW1hY3NDdXJzb3IuY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICAgIGlmIG1hcmtlciA9PSBudWxsXG4gICAgICAgICAgQHNlYXJjaFZpZXcuc2hvd1dyYXBJY29uKGRpcmVjdGlvbilcbiAgICAgICAgICBtYXJrZXIgPSBAcmVzdWx0cy5maW5kUmVzdWx0QWZ0ZXIobmV3IFBvaW50KDAsIDApKVxuICAgICAgICBlbWFjc0N1cnNvci5jdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24obWFya2VyLmdldEVuZEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICAgIG1hcmtlcnMucHVzaChtYXJrZXIpXG4gICAgZWxzZVxuICAgICAgQGVtYWNzRWRpdG9yLm1vdmVFbWFjc0N1cnNvcnMgKGVtYWNzQ3Vyc29yKSA9PlxuICAgICAgICBtYXJrZXIgPSBAcmVzdWx0cy5maW5kUmVzdWx0QmVmb3JlKGVtYWNzQ3Vyc29yLmN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuICAgICAgICBpZiBtYXJrZXIgPT0gbnVsbFxuICAgICAgICAgIEBzZWFyY2hWaWV3LnNob3dXcmFwSWNvbihkaXJlY3Rpb24pXG4gICAgICAgICAgbWFya2VyID0gQHJlc3VsdHMuZmluZFJlc3VsdEJlZm9yZShAZW1hY3NFZGl0b3IuZWRpdG9yLmdldEJ1ZmZlcigpLmdldEVuZFBvc2l0aW9uKCkpXG4gICAgICAgIGVtYWNzQ3Vyc29yLmN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihtYXJrZXIuZ2V0U3RhcnRCdWZmZXJQb3NpdGlvbigpKVxuICAgICAgICBtYXJrZXJzLnB1c2gobWFya2VyKVxuXG4gICAgcG9zID0gQGVtYWNzRWRpdG9yLmVkaXRvci5nZXRDdXJzb3JzKClbMF0uZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIEBlbWFjc0VkaXRvci5lZGl0b3Iuc2Nyb2xsVG9CdWZmZXJQb3NpdGlvbihwb3MsIGNlbnRlcjogdHJ1ZSlcbiAgICBAcmVzdWx0cy5zZXRDdXJyZW50KG1hcmtlcnMpXG4gICAgQF91cGRhdGVTZWFyY2hWaWV3KClcblxuICBleGl0ZWQ6IC0+XG4gICAgQF9kZWFjdGl2YXRlKClcblxuICBjYW5jZWxlZDogLT5cbiAgICBAZW1hY3NFZGl0b3IucmVzdG9yZUN1cnNvcnMoQG9yaWdpbkN1cnNvcnMpXG4gICAgQF9kZWFjdGl2YXRlKClcblxuICBfZGVhY3RpdmF0ZTogLT5cbiAgICBAc2VhcmNoPy5zdG9wKClcbiAgICBAc2VhcmNoID0gbnVsbFxuICAgIEByZXN1bHRzPy5jbGVhcigpXG4gICAgQHJlc3VsdHMgPSBudWxsXG4gICAgQG9yaWdpbkN1cnNvcnMgPSBudWxsXG4iXX0=
