(function() {
  var appendCopy;

  appendCopy = function(reversed, maintainClipboard, fullLine) {
    var _fullLine, _indentBasis, _text, appendTo, clipboardText, end, indentBasis, index, metadata, newMetadata, newText, precedingText, ref, ref1, ref2, ref3, ref4, ref5, selectionData, selectionText, start, startLevel;
    if (reversed == null) {
      reversed = false;
    }
    if (maintainClipboard == null) {
      maintainClipboard = false;
    }
    if (fullLine == null) {
      fullLine = false;
    }
    if (this.isEmpty()) {
      return;
    }
    ref = atom.clipboard.readWithMetadata(), clipboardText = ref.text, metadata = ref.metadata;
    if (metadata == null) {
      return;
    }
    if (((ref1 = metadata.selections) != null ? ref1.length : void 0) > 1) {
      if (((ref2 = metadata.selections) != null ? ref2.length : void 0) !== this.editor.getSelections().length) {
        return;
      }
      maintainClipboard = true;
    }
    ref3 = this.getBufferRange(), start = ref3.start, end = ref3.end;
    selectionText = this.editor.getTextInRange([start, end]);
    precedingText = this.editor.getTextInRange([[start.row, 0], start]);
    startLevel = this.editor.indentLevelForLine(precedingText);
    appendTo = function(_text, _indentBasis) {
      if (reversed) {
        _text = selectionText + _text;
        _indentBasis = startLevel;
      } else {
        _text = _text + selectionText;
      }
      return {
        text: _text,
        indentBasis: _indentBasis,
        fullLine: false
      };
    };
    if (maintainClipboard) {
      index = this.editor.getSelections().indexOf(this);
      ref4 = metadata.selections[index], _text = ref4.text, _indentBasis = ref4.indentBasis, _fullLine = ref4.fullLine;
      selectionData = appendTo(_text, _indentBasis);
      newMetadata = metadata;
      newMetadata.selections[index] = selectionData;
      newText = newMetadata.selections.map(function(selection) {
        return selection.text;
      }).join("\n");
    } else {
      _indentBasis = metadata.indentBasis, _fullLine = metadata.fullLine;
      ref5 = appendTo(clipboardText, _indentBasis), newText = ref5.text, indentBasis = ref5.indentBasis, fullLine = ref5.fullLine;
      newMetadata = {
        indentBasis: indentBasis,
        fullLine: fullLine
      };
    }
    newMetadata.replace = true;
    return atom.clipboard.write(newText, newMetadata);
  };

  module.exports = {
    appendCopy: appendCopy
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2VtYWNzLXBsdXMvbGliL3NlbGVjdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7QUFBQSxNQUFBOztFQUFBLFVBQUEsR0FBYSxTQUFDLFFBQUQsRUFBbUIsaUJBQW5CLEVBQTRDLFFBQTVDO0FBQ1gsUUFBQTs7TUFEWSxXQUFXOzs7TUFBTyxvQkFBa0I7OztNQUFPLFdBQVM7O0lBQ2hFLElBQVUsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFWO0FBQUEsYUFBQTs7SUFFQSxNQUFrQyxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFmLENBQUEsQ0FBbEMsRUFBTyxvQkFBTixJQUFELEVBQXNCO0lBQ3RCLElBQWMsZ0JBQWQ7QUFBQSxhQUFBOztJQUNBLGdEQUFzQixDQUFFLGdCQUFyQixHQUE4QixDQUFqQztNQUNFLGdEQUE2QixDQUFFLGdCQUFyQixLQUFpQyxJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBQSxDQUF1QixDQUFDLE1BQW5FO0FBQUEsZUFBQTs7TUFDQSxpQkFBQSxHQUFvQixLQUZ0Qjs7SUFJQSxPQUFlLElBQUMsQ0FBQSxjQUFELENBQUEsQ0FBZixFQUFDLGtCQUFELEVBQVE7SUFDUixhQUFBLEdBQWdCLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUF1QixDQUFDLEtBQUQsRUFBUSxHQUFSLENBQXZCO0lBQ2hCLGFBQUEsR0FBZ0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxjQUFSLENBQXVCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBUCxFQUFZLENBQVosQ0FBRCxFQUFpQixLQUFqQixDQUF2QjtJQUNoQixVQUFBLEdBQWEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxrQkFBUixDQUEyQixhQUEzQjtJQUViLFFBQUEsR0FBVyxTQUFDLEtBQUQsRUFBUSxZQUFSO01BQ1QsSUFBRyxRQUFIO1FBQ0UsS0FBQSxHQUFRLGFBQUEsR0FBZ0I7UUFDeEIsWUFBQSxHQUFlLFdBRmpCO09BQUEsTUFBQTtRQUlFLEtBQUEsR0FBUSxLQUFBLEdBQVEsY0FKbEI7O2FBTUE7UUFDRSxJQUFBLEVBQU0sS0FEUjtRQUVFLFdBQUEsRUFBYSxZQUZmO1FBR0UsUUFBQSxFQUFVLEtBSFo7O0lBUFM7SUFhWCxJQUFHLGlCQUFIO01BQ0UsS0FBQSxHQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsYUFBUixDQUFBLENBQXVCLENBQUMsT0FBeEIsQ0FBZ0MsSUFBaEM7TUFDUixPQUFnRSxRQUFRLENBQUMsVUFBVyxDQUFBLEtBQUEsQ0FBcEYsRUFBTyxhQUFOLElBQUQsRUFBMkIsb0JBQWIsV0FBZCxFQUFtRCxpQkFBVjtNQUN6QyxhQUFBLEdBQWdCLFFBQUEsQ0FBUyxLQUFULEVBQWdCLFlBQWhCO01BQ2hCLFdBQUEsR0FBYztNQUNkLFdBQVcsQ0FBQyxVQUFXLENBQUEsS0FBQSxDQUF2QixHQUFnQztNQUNoQyxPQUFBLEdBQVUsV0FBVyxDQUFDLFVBQVUsQ0FBQyxHQUF2QixDQUEyQixTQUFDLFNBQUQ7ZUFBZSxTQUFTLENBQUM7TUFBekIsQ0FBM0IsQ0FBeUQsQ0FBQyxJQUExRCxDQUErRCxJQUEvRCxFQU5aO0tBQUEsTUFBQTtNQVFnQix3QkFBYixXQUFELEVBQXNDLHFCQUFWO01BQzVCLE9BQXlDLFFBQUEsQ0FBUyxhQUFULEVBQXdCLFlBQXhCLENBQXpDLEVBQU8sZUFBTixJQUFELEVBQWdCLDhCQUFoQixFQUE2QjtNQUM3QixXQUFBLEdBQWM7UUFBQyxhQUFBLFdBQUQ7UUFBYyxVQUFBLFFBQWQ7UUFWaEI7O0lBYUEsV0FBVyxDQUFDLE9BQVosR0FBc0I7V0FDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFmLENBQXFCLE9BQXJCLEVBQThCLFdBQTlCO0VBekNXOztFQTJDYixNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUFDLFlBQUEsVUFBRDs7QUEzQ2pCIiwic291cmNlc0NvbnRlbnQiOlsiIyBUT0RPOiBSZWZhY3RvclxuYXBwZW5kQ29weSA9IChyZXZlcnNlZCA9IGZhbHNlLCBtYWludGFpbkNsaXBib2FyZD1mYWxzZSwgZnVsbExpbmU9ZmFsc2UpIC0+XG4gIHJldHVybiBpZiBAaXNFbXB0eSgpXG5cbiAge3RleHQ6IGNsaXBib2FyZFRleHQsIG1ldGFkYXRhfSA9IGF0b20uY2xpcGJvYXJkLnJlYWRXaXRoTWV0YWRhdGEoKVxuICByZXR1cm4gdW5sZXNzIG1ldGFkYXRhP1xuICBpZiBtZXRhZGF0YS5zZWxlY3Rpb25zPy5sZW5ndGggPiAxXG4gICAgcmV0dXJuIGlmIG1ldGFkYXRhLnNlbGVjdGlvbnM/Lmxlbmd0aCBpc250IEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpLmxlbmd0aFxuICAgIG1haW50YWluQ2xpcGJvYXJkID0gdHJ1ZVxuXG4gIHtzdGFydCwgZW5kfSA9IEBnZXRCdWZmZXJSYW5nZSgpXG4gIHNlbGVjdGlvblRleHQgPSBAZWRpdG9yLmdldFRleHRJblJhbmdlKFtzdGFydCwgZW5kXSlcbiAgcHJlY2VkaW5nVGV4dCA9IEBlZGl0b3IuZ2V0VGV4dEluUmFuZ2UoW1tzdGFydC5yb3csIDBdLCBzdGFydF0pXG4gIHN0YXJ0TGV2ZWwgPSBAZWRpdG9yLmluZGVudExldmVsRm9yTGluZShwcmVjZWRpbmdUZXh0KVxuXG4gIGFwcGVuZFRvID0gKF90ZXh0LCBfaW5kZW50QmFzaXMpIC0+XG4gICAgaWYgcmV2ZXJzZWRcbiAgICAgIF90ZXh0ID0gc2VsZWN0aW9uVGV4dCArIF90ZXh0XG4gICAgICBfaW5kZW50QmFzaXMgPSBzdGFydExldmVsXG4gICAgZWxzZVxuICAgICAgX3RleHQgPSBfdGV4dCArIHNlbGVjdGlvblRleHRcblxuICAgIHtcbiAgICAgIHRleHQ6IF90ZXh0XG4gICAgICBpbmRlbnRCYXNpczogX2luZGVudEJhc2lzXG4gICAgICBmdWxsTGluZTogZmFsc2VcbiAgICB9XG5cbiAgaWYgbWFpbnRhaW5DbGlwYm9hcmRcbiAgICBpbmRleCA9IEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpLmluZGV4T2YodGhpcylcbiAgICB7dGV4dDogX3RleHQsIGluZGVudEJhc2lzOiBfaW5kZW50QmFzaXMsIGZ1bGxMaW5lOiBfZnVsbExpbmV9ID0gbWV0YWRhdGEuc2VsZWN0aW9uc1tpbmRleF1cbiAgICBzZWxlY3Rpb25EYXRhID0gYXBwZW5kVG8oX3RleHQsIF9pbmRlbnRCYXNpcylcbiAgICBuZXdNZXRhZGF0YSA9IG1ldGFkYXRhXG4gICAgbmV3TWV0YWRhdGEuc2VsZWN0aW9uc1tpbmRleF0gPSBzZWxlY3Rpb25EYXRhXG4gICAgbmV3VGV4dCA9IG5ld01ldGFkYXRhLnNlbGVjdGlvbnMubWFwKChzZWxlY3Rpb24pIC0+IHNlbGVjdGlvbi50ZXh0KS5qb2luKFwiXFxuXCIpXG4gIGVsc2VcbiAgICB7aW5kZW50QmFzaXM6IF9pbmRlbnRCYXNpcywgZnVsbExpbmU6IF9mdWxsTGluZX0gPSBtZXRhZGF0YVxuICAgIHt0ZXh0OiBuZXdUZXh0LCBpbmRlbnRCYXNpcywgZnVsbExpbmV9ID0gYXBwZW5kVG8oY2xpcGJvYXJkVGV4dCwgX2luZGVudEJhc2lzKVxuICAgIG5ld01ldGFkYXRhID0ge2luZGVudEJhc2lzLCBmdWxsTGluZX1cblxuICAjIHN1cHBvcnQgY2xpcGJvYXJkLXBsdXNcbiAgbmV3TWV0YWRhdGEucmVwbGFjZSA9IHRydWVcbiAgYXRvbS5jbGlwYm9hcmQud3JpdGUobmV3VGV4dCwgbmV3TWV0YWRhdGEpXG5cbm1vZHVsZS5leHBvcnRzID0ge2FwcGVuZENvcHl9XG4iXX0=
