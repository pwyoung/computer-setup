(function() {
  var BOB, CursorTools, escapeRegExp;

  CursorTools = (function() {
    function CursorTools(cursor) {
      this.cursor = cursor;
      this.editor = this.cursor.editor;
    }

    CursorTools.prototype.locateBackward = function(regExp) {
      var result;
      result = null;
      this.editor.backwardsScanInBufferRange(regExp, [BOB, this.cursor.getBufferPosition()], function(hit) {
        return result = hit.range;
      });
      return result;
    };

    CursorTools.prototype.locateForward = function(regExp) {
      var eof, result;
      result = null;
      eof = this.editor.getEofBufferPosition();
      this.editor.scanInBufferRange(regExp, [this.cursor.getBufferPosition(), eof], function(hit) {
        return result = hit.range;
      });
      return result;
    };

    CursorTools.prototype.locateWordCharacterBackward = function() {
      return this.locateBackward(this._getWordCharacterRegExp());
    };

    CursorTools.prototype.locateWordCharacterForward = function() {
      return this.locateForward(this._getWordCharacterRegExp());
    };

    CursorTools.prototype.locateNonWordCharacterBackward = function() {
      return this.locateBackward(this._getNonWordCharacterRegExp());
    };

    CursorTools.prototype.locateNonWordCharacterForward = function() {
      return this.locateForward(this._getNonWordCharacterRegExp());
    };

    CursorTools.prototype.goToMatchStartBackward = function(regExp) {
      var ref;
      return this._goTo((ref = this.locateBackward(regExp)) != null ? ref.start : void 0);
    };

    CursorTools.prototype.goToMatchStartForward = function(regExp) {
      var ref;
      return this._goTo((ref = this.locateForward(regExp)) != null ? ref.start : void 0);
    };

    CursorTools.prototype.goToMatchEndBackward = function(regExp) {
      var ref;
      return this._goTo((ref = this.locateBackward(regExp)) != null ? ref.end : void 0);
    };

    CursorTools.prototype.goToMatchEndForward = function(regExp) {
      var ref;
      return this._goTo((ref = this.locateForward(regExp)) != null ? ref.end : void 0);
    };

    CursorTools.prototype.skipCharactersBackward = function(characters) {
      var regexp;
      regexp = new RegExp("[^" + (escapeRegExp(characters)) + "]");
      return this.skipBackwardUntil(regexp);
    };

    CursorTools.prototype.skipCharactersForward = function(characters) {
      var regexp;
      regexp = new RegExp("[^" + (escapeRegExp(characters)) + "]");
      return this.skipForwardUntil(regexp);
    };

    CursorTools.prototype.skipWordCharactersBackward = function() {
      return this.skipBackwardUntil(this._getNonWordCharacterRegExp());
    };

    CursorTools.prototype.skipWordCharactersForward = function() {
      return this.skipForwardUntil(this._getNonWordCharacterRegExp());
    };

    CursorTools.prototype.skipNonWordCharactersBackward = function() {
      return this.skipBackwardUntil(this._getWordCharacterRegExp());
    };

    CursorTools.prototype.skipNonWordCharactersForward = function() {
      return this.skipForwardUntil(this._getWordCharacterRegExp());
    };

    CursorTools.prototype.skipBackwardUntil = function(regexp) {
      if (!this.goToMatchEndBackward(regexp)) {
        return this._goTo(BOB);
      }
    };

    CursorTools.prototype.skipForwardUntil = function(regexp) {
      if (!this.goToMatchStartForward(regexp)) {
        return this._goTo(this.editor.getEofBufferPosition());
      }
    };

    CursorTools.prototype.extractWord = function(cursorTools) {
      var range, word, wordEnd, wordRange;
      this.skipWordCharactersBackward();
      range = this.locateNonWordCharacterForward();
      wordEnd = range ? range.start : this.editor.getEofBufferPosition();
      wordRange = [this.cursor.getBufferPosition(), wordEnd];
      word = this.editor.getTextInBufferRange(wordRange);
      this.editor.setTextInBufferRange(wordRange, '');
      return word;
    };

    CursorTools.prototype.horizontalSpaceRange = function() {
      var end, start;
      this.skipCharactersBackward(' \t');
      start = this.cursor.getBufferPosition();
      this.skipCharactersForward(' \t');
      end = this.cursor.getBufferPosition();
      return [start, end];
    };

    CursorTools.prototype.endLineIfNecessary = function() {
      var length, row;
      row = this.cursor.getBufferPosition().row;
      if (row === this.editor.getLineCount() - 1) {
        length = this.cursor.getCurrentBufferLine().length;
        return this.editor.setTextInBufferRange([[row, length], [row, length]], "\n");
      }
    };

    CursorTools.prototype._getWordCharacterRegExp = function() {
      var nonWordCharacters;
      nonWordCharacters = atom.config.get('editor.nonWordCharacters');
      return new RegExp('[^\\s' + escapeRegExp(nonWordCharacters) + ']');
    };

    CursorTools.prototype._getNonWordCharacterRegExp = function() {
      var nonWordCharacters;
      nonWordCharacters = atom.config.get('editor.nonWordCharacters');
      return new RegExp('[\\s' + escapeRegExp(nonWordCharacters) + ']');
    };

    CursorTools.prototype._goTo = function(point) {
      if (point) {
        this.cursor.setBufferPosition(point);
        return true;
      } else {
        return false;
      }
    };

    return CursorTools;

  })();

  escapeRegExp = function(string) {
    if (string) {
      return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    } else {
      return '';
    }
  };

  BOB = {
    row: 0,
    column: 0
  };

  module.exports = CursorTools;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2VtYWNzLXBsdXMvbGliL2N1cnNvci10b29scy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7QUFBQSxNQUFBOztFQUFNO0lBQ1MscUJBQUMsTUFBRDtNQUFDLElBQUMsQ0FBQSxTQUFEO01BQ1osSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFDLENBQUEsTUFBTSxDQUFDO0lBRFA7OzBCQU1iLGNBQUEsR0FBZ0IsU0FBQyxNQUFEO0FBQ2QsVUFBQTtNQUFBLE1BQUEsR0FBUztNQUNULElBQUMsQ0FBQSxNQUFNLENBQUMsMEJBQVIsQ0FBbUMsTUFBbkMsRUFBMkMsQ0FBQyxHQUFELEVBQU0sSUFBQyxDQUFBLE1BQU0sQ0FBQyxpQkFBUixDQUFBLENBQU4sQ0FBM0MsRUFBK0UsU0FBQyxHQUFEO2VBQzdFLE1BQUEsR0FBUyxHQUFHLENBQUM7TUFEZ0UsQ0FBL0U7YUFFQTtJQUpjOzswQkFTaEIsYUFBQSxHQUFlLFNBQUMsTUFBRDtBQUNiLFVBQUE7TUFBQSxNQUFBLEdBQVM7TUFDVCxHQUFBLEdBQU0sSUFBQyxDQUFBLE1BQU0sQ0FBQyxvQkFBUixDQUFBO01BQ04sSUFBQyxDQUFBLE1BQU0sQ0FBQyxpQkFBUixDQUEwQixNQUExQixFQUFrQyxDQUFDLElBQUMsQ0FBQSxNQUFNLENBQUMsaUJBQVIsQ0FBQSxDQUFELEVBQThCLEdBQTlCLENBQWxDLEVBQXNFLFNBQUMsR0FBRDtlQUNwRSxNQUFBLEdBQVMsR0FBRyxDQUFDO01BRHVELENBQXRFO2FBRUE7SUFMYTs7MEJBVWYsMkJBQUEsR0FBNkIsU0FBQTthQUMzQixJQUFDLENBQUEsY0FBRCxDQUFnQixJQUFDLENBQUEsdUJBQUQsQ0FBQSxDQUFoQjtJQUQyQjs7MEJBTTdCLDBCQUFBLEdBQTRCLFNBQUE7YUFDMUIsSUFBQyxDQUFBLGFBQUQsQ0FBZSxJQUFDLENBQUEsdUJBQUQsQ0FBQSxDQUFmO0lBRDBCOzswQkFNNUIsOEJBQUEsR0FBZ0MsU0FBQTthQUM5QixJQUFDLENBQUEsY0FBRCxDQUFnQixJQUFDLENBQUEsMEJBQUQsQ0FBQSxDQUFoQjtJQUQ4Qjs7MEJBTWhDLDZCQUFBLEdBQStCLFNBQUE7YUFDN0IsSUFBQyxDQUFBLGFBQUQsQ0FBZSxJQUFDLENBQUEsMEJBQUQsQ0FBQSxDQUFmO0lBRDZCOzswQkFNL0Isc0JBQUEsR0FBd0IsU0FBQyxNQUFEO0FBQ3RCLFVBQUE7YUFBQSxJQUFDLENBQUEsS0FBRCxrREFBOEIsQ0FBRSxjQUFoQztJQURzQjs7MEJBTXhCLHFCQUFBLEdBQXVCLFNBQUMsTUFBRDtBQUNyQixVQUFBO2FBQUEsSUFBQyxDQUFBLEtBQUQsaURBQTZCLENBQUUsY0FBL0I7SUFEcUI7OzBCQU12QixvQkFBQSxHQUFzQixTQUFDLE1BQUQ7QUFDcEIsVUFBQTthQUFBLElBQUMsQ0FBQSxLQUFELGtEQUE4QixDQUFFLFlBQWhDO0lBRG9COzswQkFNdEIsbUJBQUEsR0FBcUIsU0FBQyxNQUFEO0FBQ25CLFVBQUE7YUFBQSxJQUFDLENBQUEsS0FBRCxpREFBNkIsQ0FBRSxZQUEvQjtJQURtQjs7MEJBTXJCLHNCQUFBLEdBQXdCLFNBQUMsVUFBRDtBQUN0QixVQUFBO01BQUEsTUFBQSxHQUFTLElBQUksTUFBSixDQUFXLElBQUEsR0FBSSxDQUFDLFlBQUEsQ0FBYSxVQUFiLENBQUQsQ0FBSixHQUE4QixHQUF6QzthQUNULElBQUMsQ0FBQSxpQkFBRCxDQUFtQixNQUFuQjtJQUZzQjs7MEJBT3hCLHFCQUFBLEdBQXVCLFNBQUMsVUFBRDtBQUNyQixVQUFBO01BQUEsTUFBQSxHQUFTLElBQUksTUFBSixDQUFXLElBQUEsR0FBSSxDQUFDLFlBQUEsQ0FBYSxVQUFiLENBQUQsQ0FBSixHQUE4QixHQUF6QzthQUNULElBQUMsQ0FBQSxnQkFBRCxDQUFrQixNQUFsQjtJQUZxQjs7MEJBT3ZCLDBCQUFBLEdBQTRCLFNBQUE7YUFDMUIsSUFBQyxDQUFBLGlCQUFELENBQW1CLElBQUMsQ0FBQSwwQkFBRCxDQUFBLENBQW5CO0lBRDBCOzswQkFNNUIseUJBQUEsR0FBMkIsU0FBQTthQUN6QixJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsSUFBQyxDQUFBLDBCQUFELENBQUEsQ0FBbEI7SUFEeUI7OzBCQU0zQiw2QkFBQSxHQUErQixTQUFBO2FBQzdCLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixJQUFDLENBQUEsdUJBQUQsQ0FBQSxDQUFuQjtJQUQ2Qjs7MEJBTS9CLDRCQUFBLEdBQThCLFNBQUE7YUFDNUIsSUFBQyxDQUFBLGdCQUFELENBQWtCLElBQUMsQ0FBQSx1QkFBRCxDQUFBLENBQWxCO0lBRDRCOzswQkFNOUIsaUJBQUEsR0FBbUIsU0FBQyxNQUFEO01BQ2pCLElBQUcsQ0FBSSxJQUFDLENBQUEsb0JBQUQsQ0FBc0IsTUFBdEIsQ0FBUDtlQUNFLElBQUMsQ0FBQSxLQUFELENBQU8sR0FBUCxFQURGOztJQURpQjs7MEJBT25CLGdCQUFBLEdBQWtCLFNBQUMsTUFBRDtNQUNoQixJQUFHLENBQUksSUFBQyxDQUFBLHFCQUFELENBQXVCLE1BQXZCLENBQVA7ZUFDRSxJQUFDLENBQUEsS0FBRCxDQUFPLElBQUMsQ0FBQSxNQUFNLENBQUMsb0JBQVIsQ0FBQSxDQUFQLEVBREY7O0lBRGdCOzswQkFRbEIsV0FBQSxHQUFhLFNBQUMsV0FBRDtBQUNYLFVBQUE7TUFBQSxJQUFDLENBQUEsMEJBQUQsQ0FBQTtNQUNBLEtBQUEsR0FBUSxJQUFDLENBQUEsNkJBQUQsQ0FBQTtNQUNSLE9BQUEsR0FBYSxLQUFILEdBQWMsS0FBSyxDQUFDLEtBQXBCLEdBQStCLElBQUMsQ0FBQSxNQUFNLENBQUMsb0JBQVIsQ0FBQTtNQUN6QyxTQUFBLEdBQVksQ0FBQyxJQUFDLENBQUEsTUFBTSxDQUFDLGlCQUFSLENBQUEsQ0FBRCxFQUE4QixPQUE5QjtNQUNaLElBQUEsR0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDLG9CQUFSLENBQTZCLFNBQTdCO01BQ1AsSUFBQyxDQUFBLE1BQU0sQ0FBQyxvQkFBUixDQUE2QixTQUE3QixFQUF3QyxFQUF4QzthQUNBO0lBUFc7OzBCQVNiLG9CQUFBLEdBQXNCLFNBQUE7QUFDcEIsVUFBQTtNQUFBLElBQUMsQ0FBQSxzQkFBRCxDQUF3QixLQUF4QjtNQUNBLEtBQUEsR0FBUSxJQUFDLENBQUEsTUFBTSxDQUFDLGlCQUFSLENBQUE7TUFDUixJQUFDLENBQUEscUJBQUQsQ0FBdUIsS0FBdkI7TUFDQSxHQUFBLEdBQU0sSUFBQyxDQUFBLE1BQU0sQ0FBQyxpQkFBUixDQUFBO2FBQ04sQ0FBQyxLQUFELEVBQVEsR0FBUjtJQUxvQjs7MEJBT3RCLGtCQUFBLEdBQW9CLFNBQUE7QUFDbEIsVUFBQTtNQUFBLEdBQUEsR0FBTSxJQUFDLENBQUEsTUFBTSxDQUFDLGlCQUFSLENBQUEsQ0FBMkIsQ0FBQztNQUNsQyxJQUFHLEdBQUEsS0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBQSxDQUFBLEdBQXlCLENBQW5DO1FBQ0UsTUFBQSxHQUFTLElBQUMsQ0FBQSxNQUFNLENBQUMsb0JBQVIsQ0FBQSxDQUE4QixDQUFDO2VBQ3hDLElBQUMsQ0FBQSxNQUFNLENBQUMsb0JBQVIsQ0FBNkIsQ0FBQyxDQUFDLEdBQUQsRUFBTSxNQUFOLENBQUQsRUFBZ0IsQ0FBQyxHQUFELEVBQU0sTUFBTixDQUFoQixDQUE3QixFQUE2RCxJQUE3RCxFQUZGOztJQUZrQjs7MEJBTXBCLHVCQUFBLEdBQXlCLFNBQUE7QUFDdkIsVUFBQTtNQUFBLGlCQUFBLEdBQW9CLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiwwQkFBaEI7YUFDcEIsSUFBSSxNQUFKLENBQVcsT0FBQSxHQUFVLFlBQUEsQ0FBYSxpQkFBYixDQUFWLEdBQTRDLEdBQXZEO0lBRnVCOzswQkFJekIsMEJBQUEsR0FBNEIsU0FBQTtBQUMxQixVQUFBO01BQUEsaUJBQUEsR0FBb0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLDBCQUFoQjthQUNwQixJQUFJLE1BQUosQ0FBVyxNQUFBLEdBQVMsWUFBQSxDQUFhLGlCQUFiLENBQVQsR0FBMkMsR0FBdEQ7SUFGMEI7OzBCQUk1QixLQUFBLEdBQU8sU0FBQyxLQUFEO01BQ0wsSUFBRyxLQUFIO1FBQ0UsSUFBQyxDQUFBLE1BQU0sQ0FBQyxpQkFBUixDQUEwQixLQUExQjtlQUNBLEtBRkY7T0FBQSxNQUFBO2VBSUUsTUFKRjs7SUFESzs7Ozs7O0VBU1QsWUFBQSxHQUFlLFNBQUMsTUFBRDtJQUNiLElBQUcsTUFBSDthQUNFLE1BQU0sQ0FBQyxPQUFQLENBQWUsd0JBQWYsRUFBeUMsTUFBekMsRUFERjtLQUFBLE1BQUE7YUFHRSxHQUhGOztFQURhOztFQU1mLEdBQUEsR0FBTTtJQUFDLEdBQUEsRUFBSyxDQUFOO0lBQVMsTUFBQSxFQUFRLENBQWpCOzs7RUFFTixNQUFNLENBQUMsT0FBUCxHQUFpQjtBQTlLakIiLCJzb3VyY2VzQ29udGVudCI6WyIjIFdyYXBzIGEgQ3Vyc29yIHRvIHByb3ZpZGUgYSBuaWNlciBBUEkgZm9yIGNvbW1vbiBvcGVyYXRpb25zLlxuY2xhc3MgQ3Vyc29yVG9vbHNcbiAgY29uc3RydWN0b3I6IChAY3Vyc29yKSAtPlxuICAgIEBlZGl0b3IgPSBAY3Vyc29yLmVkaXRvclxuXG4gICMgTG9vayBmb3IgdGhlIHByZXZpb3VzIG9jY3VycmVuY2Ugb2YgdGhlIGdpdmVuIHJlZ2V4cC5cbiAgI1xuICAjIFJldHVybiBhIFJhbmdlIGlmIGZvdW5kLCBudWxsIG90aGVyd2lzZS4gVGhpcyBkb2VzIG5vdCBtb3ZlIHRoZSBjdXJzb3IuXG4gIGxvY2F0ZUJhY2t3YXJkOiAocmVnRXhwKSAtPlxuICAgIHJlc3VsdCA9IG51bGxcbiAgICBAZWRpdG9yLmJhY2t3YXJkc1NjYW5JbkJ1ZmZlclJhbmdlIHJlZ0V4cCwgW0JPQiwgQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXSwgKGhpdCkgLT5cbiAgICAgIHJlc3VsdCA9IGhpdC5yYW5nZVxuICAgIHJlc3VsdFxuXG4gICMgTG9vayBmb3IgdGhlIG5leHQgb2NjdXJyZW5jZSBvZiB0aGUgZ2l2ZW4gcmVnZXhwLlxuICAjXG4gICMgUmV0dXJuIGEgUmFuZ2UgaWYgZm91bmQsIG51bGwgb3RoZXJ3aXNlLiBUaGlzIGRvZXMgbm90IG1vdmUgdGhlIGN1cnNvci5cbiAgbG9jYXRlRm9yd2FyZDogKHJlZ0V4cCkgLT5cbiAgICByZXN1bHQgPSBudWxsXG4gICAgZW9mID0gQGVkaXRvci5nZXRFb2ZCdWZmZXJQb3NpdGlvbigpXG4gICAgQGVkaXRvci5zY2FuSW5CdWZmZXJSYW5nZSByZWdFeHAsIFtAY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCksIGVvZl0sIChoaXQpIC0+XG4gICAgICByZXN1bHQgPSBoaXQucmFuZ2VcbiAgICByZXN1bHRcblxuICAjIExvb2sgZm9yIHRoZSBwcmV2aW91cyB3b3JkIGNoYXJhY3Rlci5cbiAgI1xuICAjIFJldHVybiBhIFJhbmdlIGlmIGZvdW5kLCBudWxsIG90aGVyd2lzZS4gVGhpcyBkb2VzIG5vdCBtb3ZlIHRoZSBjdXJzb3IuXG4gIGxvY2F0ZVdvcmRDaGFyYWN0ZXJCYWNrd2FyZDogLT5cbiAgICBAbG9jYXRlQmFja3dhcmQgQF9nZXRXb3JkQ2hhcmFjdGVyUmVnRXhwKClcblxuICAjIExvb2sgZm9yIHRoZSBuZXh0IHdvcmQgY2hhcmFjdGVyLlxuICAjXG4gICMgUmV0dXJuIGEgUmFuZ2UgaWYgZm91bmQsIG51bGwgb3RoZXJ3aXNlLiBUaGlzIGRvZXMgbm90IG1vdmUgdGhlIGN1cnNvci5cbiAgbG9jYXRlV29yZENoYXJhY3RlckZvcndhcmQ6IC0+XG4gICAgQGxvY2F0ZUZvcndhcmQgQF9nZXRXb3JkQ2hhcmFjdGVyUmVnRXhwKClcblxuICAjIExvb2sgZm9yIHRoZSBwcmV2aW91cyBub253b3JkIGNoYXJhY3Rlci5cbiAgI1xuICAjIFJldHVybiBhIFJhbmdlIGlmIGZvdW5kLCBudWxsIG90aGVyd2lzZS4gVGhpcyBkb2VzIG5vdCBtb3ZlIHRoZSBjdXJzb3IuXG4gIGxvY2F0ZU5vbldvcmRDaGFyYWN0ZXJCYWNrd2FyZDogLT5cbiAgICBAbG9jYXRlQmFja3dhcmQgQF9nZXROb25Xb3JkQ2hhcmFjdGVyUmVnRXhwKClcblxuICAjIExvb2sgZm9yIHRoZSBuZXh0IG5vbndvcmQgY2hhcmFjdGVyLlxuICAjXG4gICMgUmV0dXJuIGEgUmFuZ2UgaWYgZm91bmQsIG51bGwgb3RoZXJ3aXNlLiBUaGlzIGRvZXMgbm90IG1vdmUgdGhlIGN1cnNvci5cbiAgbG9jYXRlTm9uV29yZENoYXJhY3RlckZvcndhcmQ6IC0+XG4gICAgQGxvY2F0ZUZvcndhcmQgQF9nZXROb25Xb3JkQ2hhcmFjdGVyUmVnRXhwKClcblxuICAjIE1vdmUgdG8gdGhlIHN0YXJ0IG9mIHRoZSBwcmV2aW91cyBvY2N1cnJlbmNlIG9mIHRoZSBnaXZlbiByZWdleHAuXG4gICNcbiAgIyBSZXR1cm4gdHJ1ZSBpZiBmb3VuZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICBnb1RvTWF0Y2hTdGFydEJhY2t3YXJkOiAocmVnRXhwKSAtPlxuICAgIEBfZ29UbyBAbG9jYXRlQmFja3dhcmQocmVnRXhwKT8uc3RhcnRcblxuICAjIE1vdmUgdG8gdGhlIHN0YXJ0IG9mIHRoZSBuZXh0IG9jY3VycmVuY2Ugb2YgdGhlIGdpdmVuIHJlZ2V4cC5cbiAgI1xuICAjIFJldHVybiB0cnVlIGlmIGZvdW5kLCBmYWxzZSBvdGhlcndpc2UuXG4gIGdvVG9NYXRjaFN0YXJ0Rm9yd2FyZDogKHJlZ0V4cCkgLT5cbiAgICBAX2dvVG8gQGxvY2F0ZUZvcndhcmQocmVnRXhwKT8uc3RhcnRcblxuICAjIE1vdmUgdG8gdGhlIGVuZCBvZiB0aGUgcHJldmlvdXMgb2NjdXJyZW5jZSBvZiB0aGUgZ2l2ZW4gcmVnZXhwLlxuICAjXG4gICMgUmV0dXJuIHRydWUgaWYgZm91bmQsIGZhbHNlIG90aGVyd2lzZS5cbiAgZ29Ub01hdGNoRW5kQmFja3dhcmQ6IChyZWdFeHApIC0+XG4gICAgQF9nb1RvIEBsb2NhdGVCYWNrd2FyZChyZWdFeHApPy5lbmRcblxuICAjIE1vdmUgdG8gdGhlIGVuZCBvZiB0aGUgbmV4dCBvY2N1cnJlbmNlIG9mIHRoZSBnaXZlbiByZWdleHAuXG4gICNcbiAgIyBSZXR1cm4gdHJ1ZSBpZiBmb3VuZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICBnb1RvTWF0Y2hFbmRGb3J3YXJkOiAocmVnRXhwKSAtPlxuICAgIEBfZ29UbyBAbG9jYXRlRm9yd2FyZChyZWdFeHApPy5lbmRcblxuICAjIFNraXAgYmFja3dhcmRzIG92ZXIgdGhlIGdpdmVuIGNoYXJhY3RlcnMuXG4gICNcbiAgIyBJZiB0aGUgZW5kIG9mIHRoZSBidWZmZXIgaXMgcmVhY2hlZCwgcmVtYWluIHRoZXJlLlxuICBza2lwQ2hhcmFjdGVyc0JhY2t3YXJkOiAoY2hhcmFjdGVycykgLT5cbiAgICByZWdleHAgPSBuZXcgUmVnRXhwKFwiW14je2VzY2FwZVJlZ0V4cChjaGFyYWN0ZXJzKX1dXCIpXG4gICAgQHNraXBCYWNrd2FyZFVudGlsKHJlZ2V4cClcblxuICAjIFNraXAgZm9yd2FyZHMgb3ZlciB0aGUgZ2l2ZW4gY2hhcmFjdGVycy5cbiAgI1xuICAjIElmIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlciBpcyByZWFjaGVkLCByZW1haW4gdGhlcmUuXG4gIHNraXBDaGFyYWN0ZXJzRm9yd2FyZDogKGNoYXJhY3RlcnMpIC0+XG4gICAgcmVnZXhwID0gbmV3IFJlZ0V4cChcIlteI3tlc2NhcGVSZWdFeHAoY2hhcmFjdGVycyl9XVwiKVxuICAgIEBza2lwRm9yd2FyZFVudGlsKHJlZ2V4cClcblxuICAjIFNraXAgYmFja3dhcmRzIG92ZXIgYW55IHdvcmQgY2hhcmFjdGVycy5cbiAgI1xuICAjIElmIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGJ1ZmZlciBpcyByZWFjaGVkLCByZW1haW4gdGhlcmUuXG4gIHNraXBXb3JkQ2hhcmFjdGVyc0JhY2t3YXJkOiAtPlxuICAgIEBza2lwQmFja3dhcmRVbnRpbChAX2dldE5vbldvcmRDaGFyYWN0ZXJSZWdFeHAoKSlcblxuICAjIFNraXAgZm9yd2FyZHMgb3ZlciBhbnkgd29yZCBjaGFyYWN0ZXJzLlxuICAjXG4gICMgSWYgdGhlIGVuZCBvZiB0aGUgYnVmZmVyIGlzIHJlYWNoZWQsIHJlbWFpbiB0aGVyZS5cbiAgc2tpcFdvcmRDaGFyYWN0ZXJzRm9yd2FyZDogLT5cbiAgICBAc2tpcEZvcndhcmRVbnRpbChAX2dldE5vbldvcmRDaGFyYWN0ZXJSZWdFeHAoKSlcblxuICAjIFNraXAgYmFja3dhcmRzIG92ZXIgYW55IG5vbi13b3JkIGNoYXJhY3RlcnMuXG4gICNcbiAgIyBJZiB0aGUgYmVnaW5uaW5nIG9mIHRoZSBidWZmZXIgaXMgcmVhY2hlZCwgcmVtYWluIHRoZXJlLlxuICBza2lwTm9uV29yZENoYXJhY3RlcnNCYWNrd2FyZDogLT5cbiAgICBAc2tpcEJhY2t3YXJkVW50aWwoQF9nZXRXb3JkQ2hhcmFjdGVyUmVnRXhwKCkpXG5cbiAgIyBTa2lwIGZvcndhcmRzIG92ZXIgYW55IG5vbi13b3JkIGNoYXJhY3RlcnMuXG4gICNcbiAgIyBJZiB0aGUgZW5kIG9mIHRoZSBidWZmZXIgaXMgcmVhY2hlZCwgcmVtYWluIHRoZXJlLlxuICBza2lwTm9uV29yZENoYXJhY3RlcnNGb3J3YXJkOiAtPlxuICAgIEBza2lwRm9yd2FyZFVudGlsKEBfZ2V0V29yZENoYXJhY3RlclJlZ0V4cCgpKVxuXG4gICMgU2tpcCBvdmVyIGNoYXJhY3RlcnMgdW50aWwgdGhlIHByZXZpb3VzIG9jY3VycmVuY2Ugb2YgdGhlIGdpdmVuIHJlZ2V4cC5cbiAgI1xuICAjIElmIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGJ1ZmZlciBpcyByZWFjaGVkLCByZW1haW4gdGhlcmUuXG4gIHNraXBCYWNrd2FyZFVudGlsOiAocmVnZXhwKSAtPlxuICAgIGlmIG5vdCBAZ29Ub01hdGNoRW5kQmFja3dhcmQocmVnZXhwKVxuICAgICAgQF9nb1RvIEJPQlxuXG4gICMgU2tpcCBvdmVyIGNoYXJhY3RlcnMgdW50aWwgdGhlIG5leHQgb2NjdXJyZW5jZSBvZiB0aGUgZ2l2ZW4gcmVnZXhwLlxuICAjXG4gICMgSWYgdGhlIGVuZCBvZiB0aGUgYnVmZmVyIGlzIHJlYWNoZWQsIHJlbWFpbiB0aGVyZS5cbiAgc2tpcEZvcndhcmRVbnRpbDogKHJlZ2V4cCkgLT5cbiAgICBpZiBub3QgQGdvVG9NYXRjaFN0YXJ0Rm9yd2FyZChyZWdleHApXG4gICAgICBAX2dvVG8gQGVkaXRvci5nZXRFb2ZCdWZmZXJQb3NpdGlvbigpXG5cbiAgIyBEZWxldGUgYW5kIHJldHVybiB0aGUgd29yZCBhdCB0aGUgY3Vyc29yLlxuICAjXG4gICMgSWYgbm90IGluIG9yIGF0IHRoZSBzdGFydCBvciBlbmQgb2YgYSB3b3JkLCByZXR1cm4gdGhlIGVtcHR5IHN0cmluZyBhbmRcbiAgIyBsZWF2ZSB0aGUgYnVmZmVyIHVubW9kaWZpZWQuXG4gIGV4dHJhY3RXb3JkOiAoY3Vyc29yVG9vbHMpIC0+XG4gICAgQHNraXBXb3JkQ2hhcmFjdGVyc0JhY2t3YXJkKClcbiAgICByYW5nZSA9IEBsb2NhdGVOb25Xb3JkQ2hhcmFjdGVyRm9yd2FyZCgpXG4gICAgd29yZEVuZCA9IGlmIHJhbmdlIHRoZW4gcmFuZ2Uuc3RhcnQgZWxzZSBAZWRpdG9yLmdldEVvZkJ1ZmZlclBvc2l0aW9uKClcbiAgICB3b3JkUmFuZ2UgPSBbQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpLCB3b3JkRW5kXVxuICAgIHdvcmQgPSBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHdvcmRSYW5nZSlcbiAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKHdvcmRSYW5nZSwgJycpXG4gICAgd29yZFxuXG4gIGhvcml6b250YWxTcGFjZVJhbmdlOiAtPlxuICAgIEBza2lwQ2hhcmFjdGVyc0JhY2t3YXJkKCcgXFx0JylcbiAgICBzdGFydCA9IEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIEBza2lwQ2hhcmFjdGVyc0ZvcndhcmQoJyBcXHQnKVxuICAgIGVuZCA9IEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIFtzdGFydCwgZW5kXVxuXG4gIGVuZExpbmVJZk5lY2Vzc2FyeTogLT5cbiAgICByb3cgPSBAY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkucm93XG4gICAgaWYgcm93ID09IEBlZGl0b3IuZ2V0TGluZUNvdW50KCkgLSAxXG4gICAgICBsZW5ndGggPSBAY3Vyc29yLmdldEN1cnJlbnRCdWZmZXJMaW5lKCkubGVuZ3RoXG4gICAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKFtbcm93LCBsZW5ndGhdLCBbcm93LCBsZW5ndGhdXSwgXCJcXG5cIilcblxuICBfZ2V0V29yZENoYXJhY3RlclJlZ0V4cDogLT5cbiAgICBub25Xb3JkQ2hhcmFjdGVycyA9IGF0b20uY29uZmlnLmdldCgnZWRpdG9yLm5vbldvcmRDaGFyYWN0ZXJzJylcbiAgICBuZXcgUmVnRXhwKCdbXlxcXFxzJyArIGVzY2FwZVJlZ0V4cChub25Xb3JkQ2hhcmFjdGVycykgKyAnXScpXG5cbiAgX2dldE5vbldvcmRDaGFyYWN0ZXJSZWdFeHA6IC0+XG4gICAgbm9uV29yZENoYXJhY3RlcnMgPSBhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci5ub25Xb3JkQ2hhcmFjdGVycycpXG4gICAgbmV3IFJlZ0V4cCgnW1xcXFxzJyArIGVzY2FwZVJlZ0V4cChub25Xb3JkQ2hhcmFjdGVycykgKyAnXScpXG5cbiAgX2dvVG86IChwb2ludCkgLT5cbiAgICBpZiBwb2ludFxuICAgICAgQGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcbiAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuXG4jIFN0b2xlbiBmcm9tIHVuZGVyc2NvcmUtcGx1cywgd2hpY2ggd2UgY2FuJ3Qgc2VlbSB0byByZXF1aXJlKCkgZnJvbSBhIHBhY2thZ2VcbiMgd2l0aG91dCBkZXBlbmRpbmcgb24gYSBzZXBhcmF0ZSBjb3B5IG9mIHRoZSB3aG9sZSBsaWJyYXJ5LlxuZXNjYXBlUmVnRXhwID0gKHN0cmluZykgLT5cbiAgaWYgc3RyaW5nXG4gICAgc3RyaW5nLnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFtcXF17fV0vZywgJ1xcXFwkJicpXG4gIGVsc2VcbiAgICAnJ1xuXG5CT0IgPSB7cm93OiAwLCBjb2x1bW46IDB9XG5cbm1vZHVsZS5leHBvcnRzID0gQ3Vyc29yVG9vbHNcbiJdfQ==
