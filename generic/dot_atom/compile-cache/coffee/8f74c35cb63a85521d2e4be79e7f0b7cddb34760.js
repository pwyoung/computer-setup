(function() {
  var Point, Range, Search, Utils, ref;

  ref = require('atom'), Point = ref.Point, Range = ref.Range;

  Utils = require('./utils');

  module.exports = Search = (function() {
    function Search(arg) {
      var eob, ref1;
      this.emacsEditor = arg.emacsEditor, this.startPosition = arg.startPosition, this.direction = arg.direction, this.regExp = arg.regExp, this.onMatch = arg.onMatch, this.onBlockFinished = arg.onBlockFinished, this.onWrapped = arg.onWrapped, this.onFinished = arg.onFinished, this.blockLines = arg.blockLines;
      this.editor = this.emacsEditor.editor;
      if (this.blockLines == null) {
        this.blockLines = 200;
      }
      this._buffer = this.editor.getBuffer();
      eob = this._buffer.getEndPosition();
      ref1 = this.direction === 'forward' ? [eob, Utils.BOB] : [Utils.BOB, eob], this.bufferLimit = ref1[0], this.bufferReverseLimit = ref1[1];
      this._startBlock(this.startPosition);
      this._wrapped = false;
      this._finished = false;
      this._stopRequested = false;
    }

    Search.prototype.isRunning = function() {
      return !this._finished;
    };

    Search.prototype.start = function() {
      var task;
      task = (function(_this) {
        return function() {
          if (!_this._stopRequested && _this._proceed()) {
            return setTimeout(task, 0);
          }
        };
      })(this);
      return setTimeout(task, 0);
    };

    Search.prototype.stop = function() {
      return this._stopRequested = true;
    };

    Search.prototype._proceed = function() {
      var found;
      if (this._finished) {
        return false;
      }
      found = false;
      if (this.direction === 'forward') {
        this.editor.scanInBufferRange(this.regExp, new Range(this.currentPosition, this.currentLimit), (function(_this) {
          return function(arg) {
            var range;
            range = arg.range;
            found = true;
            _this.onMatch(range);
            if (range.isEmpty()) {
              return _this.currentPosition = _this._buffer.positionForCharacterIndex(_this._buffer.characterIndexForPosition(range.end) + 1);
            } else {
              return _this.currentPosition = range.end;
            }
          };
        })(this));
      } else {
        this.editor.backwardsScanInBufferRange(this.regExp, new Range(this.currentLimit, this.currentPosition), (function(_this) {
          return function(arg) {
            var range;
            range = arg.range;
            found = true;
            _this.onMatch(range);
            if (range.isEmpty()) {
              return _this.currentPosition = _this._buffer.positionForCharacterIndex(_this._buffer.characterIndexForPosition(range.start) - 1);
            } else {
              return _this.currentPosition = range.start;
            }
          };
        })(this));
      }
      this.onBlockFinished();
      if (this._wrapped && this.currentLimit.isEqual(this.startPosition)) {
        this._finished = true;
        this.onFinished();
        return false;
      } else if (!this._wrapped && this.currentLimit.isEqual(this.bufferLimit)) {
        this._wrapped = true;
        this.onWrapped();
        this._startBlock(this.bufferReverseLimit);
      } else {
        this._startBlock(this.currentLimit);
      }
      return true;
    };

    Search.prototype._startBlock = function(blockStart) {
      this.currentPosition = blockStart;
      return this.currentLimit = this._nextLimit(blockStart);
    };

    Search.prototype._nextLimit = function(point) {
      var guess, limit;
      if (this.direction === 'forward') {
        guess = new Point(point.row + this.blockLines, 0);
        limit = this._wrapped ? this.startPosition : this.bufferLimit;
        if (guess.isGreaterThan(limit)) {
          return limit;
        } else {
          return guess;
        }
      } else {
        guess = new Point(point.row - this.blockLines, 0);
        limit = this._wrapped ? this.startPosition : this.bufferLimit;
        if (guess.isLessThan(limit)) {
          return limit;
        } else {
          return guess;
        }
      }
    };

    return Search;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2F0b21pYy1lbWFjcy9saWIvc2VhcmNoLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBaUIsT0FBQSxDQUFRLE1BQVIsQ0FBakIsRUFBQyxpQkFBRCxFQUFROztFQUNSLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7RUFRUixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1MsZ0JBQUMsR0FBRDtBQUNYLFVBQUE7TUFEYSxJQUFDLENBQUEsa0JBQUEsYUFBYSxJQUFDLENBQUEsb0JBQUEsZUFBZSxJQUFDLENBQUEsZ0JBQUEsV0FBVyxJQUFDLENBQUEsYUFBQSxRQUFRLElBQUMsQ0FBQSxjQUFBLFNBQVMsSUFBQyxDQUFBLHNCQUFBLGlCQUFpQixJQUFDLENBQUEsZ0JBQUEsV0FBVyxJQUFDLENBQUEsaUJBQUEsWUFBWSxJQUFDLENBQUEsaUJBQUE7TUFDdEgsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFDLENBQUEsV0FBVyxDQUFDOztRQUN2QixJQUFDLENBQUEsYUFBYzs7TUFFZixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUixDQUFBO01BQ1gsR0FBQSxHQUFNLElBQUMsQ0FBQSxPQUFPLENBQUMsY0FBVCxDQUFBO01BQ04sT0FDSyxJQUFDLENBQUEsU0FBRCxLQUFjLFNBQWpCLEdBQWdDLENBQUMsR0FBRCxFQUFNLEtBQUssQ0FBQyxHQUFaLENBQWhDLEdBQXNELENBQUMsS0FBSyxDQUFDLEdBQVAsRUFBWSxHQUFaLENBRHhELEVBQUMsSUFBQyxDQUFBLHFCQUFGLEVBQWUsSUFBQyxDQUFBO01BSWhCLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLGFBQWQ7TUFFQSxJQUFDLENBQUEsUUFBRCxHQUFZO01BQ1osSUFBQyxDQUFBLFNBQUQsR0FBYTtNQUNiLElBQUMsQ0FB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RCxDQUFhLElBQUMsQ0FBQSxrQkFBZCxFQUhHO09BQUEsTUFBQTtRQUtILElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLFlBQWQsRUFMRzs7YUFPTDtJQXBDUTs7cUJBc0NWLFdBQUEsR0FBYSxTQUFDLFVBQUQ7TUFDWCxJQUFDLENBQUEsZUFBRCxHQUFtQjthQUNuQixJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFDLENBQUEsVUFBRCxDQUFZLFVBQVo7SUFGTDs7cUJBSWIsVUFBQSxHQUFZLFNBQUMsS0FBRDtBQUNWLFVBQUE7TUFBQSxJQUFHLElBQUMsQ0FBQSxTQUFELEtBQWMsU0FBakI7UUFDRSxLQUFBLEdBQVEsSUFBSSxLQUFKLENBQVUsS0FBSyxDQUFDLEdBQU4sR0FBWSxJQUFDLENBQUEsVUFBdkIsRUFBbUMsQ0FBbkM7UUFDUixLQUFBLEdBQVcsSUFBQyxDQUFBLFFBQUosR0FBa0IsSUFBQyxDQUFBLGFBQW5CLEdBQXNDLElBQUMsQ0FBQTtRQUMvQyxJQUFHLEtBQUssQ0FBQyxhQUFOLENBQW9CLEtBQXBCLENBQUg7aUJBQW1DLE1BQW5DO1NBQUEsTUFBQTtpQkFBOEMsTUFBOUM7U0FIRjtPQUFBLE1BQUE7UUFLRSxLQUFBLEdBQVEsSUFBSSxLQUFKLENBQVUsS0FBSyxDQUFDLEdBQU4sR0FBWSxJQUFDLENBQUEsVUFBdkIsRUFBbUMsQ0FBbkM7UUFDUixLQUFBLEdBQVcsSUFBQyxDQUFBLFFBQUosR0FBa0IsSUFBQyxDQUFBLGFBQW5CLEdBQXNDLElBQUMsQ0FBQTtRQUMvQyxJQUFHLEtBQUssQ0FBQyxVQUFOLENBQWlCLEtBQWpCLENBQUg7aUJBQWdDLE1BQWhDO1NBQUEsTUFBQTtpQkFBMkMsTUFBM0M7U0FQRjs7SUFEVTs7Ozs7QUFuRmQiLCJzb3VyY2VzQ29udGVudCI6WyJ7UG9pbnQsIFJhbmdlfSA9IHJlcXVpcmUgJ2F0b20nXG5VdGlscyA9IHJlcXVpcmUgJy4vdXRpbHMnXG5cbiMgSGFuZGxlcyB0aGUgc2VhcmNoIHRocm91Z2ggdGhlIGJ1ZmZlciBmcm9tIGEgZ2l2ZW4gc3RhcnRpbmcgcG9pbnQsIGluIGEgZ2l2ZW5cbiMgZGlyZWN0aW9uLCB3cmFwcGluZyBiYWNrIGFyb3VuZCB0byB0aGUgc3RhcnRpbmcgcG9pbnQuIEVhY2ggY2FsbCB0byBwcm9jZWVkKClcbiMgYWR2YW5jZXMgdXAgdG8gYSBsaW1pdGVkIGRpc3RhbmNlLCBjYWxsaW5nIHRoZSBvbk1hdGNoIGNhbGxiYWNrIGF0IG1vc3Qgb25jZSxcbiMgYW5kIHJldHVybiB0cnVlIHVudGlsIHRoZSBzdGFydGluZyBwb2ludCBoYXMgYmVlbiByZWFjaGVkIGFnYWluLiBPbmNlIHRoYXRcbiMgaGFwcGVucywgcHJvY2VlZCgpIHdpbGwgcmV0dXJuIGZhbHNlLCBhbmQgd2lsbCBuZXZlciBjYWxsIHRoZSBvbk1hdGNoIGNhbGxiYWNrXG4jIGFueW1vcmUuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTZWFyY2hcbiAgY29uc3RydWN0b3I6ICh7QGVtYWNzRWRpdG9yLCBAc3RhcnRQb3NpdGlvbiwgQGRpcmVjdGlvbiwgQHJlZ0V4cCwgQG9uTWF0Y2gsIEBvbkJsb2NrRmluaXNoZWQsIEBvbldyYXBwZWQsIEBvbkZpbmlzaGVkLCBAYmxvY2tMaW5lc30pIC0+XG4gICAgQGVkaXRvciA9IEBlbWFjc0VkaXRvci5lZGl0b3JcbiAgICBAYmxvY2tMaW5lcyA/PSAyMDBcblxuICAgIEBfYnVmZmVyID0gQGVkaXRvci5nZXRCdWZmZXIoKVxuICAgIGVvYiA9IEBfYnVmZmVyLmdldEVuZFBvc2l0aW9uKClcbiAgICBbQGJ1ZmZlckxpbWl0LCBAYnVmZmVyUmV2ZXJzZUxpbWl0XSA9XG4gICAgICBpZiBAZGlyZWN0aW9uID09ICdmb3J3YXJkJyB0aGVuIFtlb2IsIFV0aWxzLkJPQl0gZWxzZSBbVXRpbHMuQk9CLCBlb2JdXG5cbiAgICAjIFRPRE86IERvbid0IGFzc3VtZSByZWdFeHAgY2FuJ3Qgc3BhbiBsaW5lcy4gbmVlZCBhIGNvbmZpZ3VyYWJsZSBvdmVybGFwP1xuICAgIEBfc3RhcnRCbG9jayhAc3RhcnRQb3NpdGlvbilcblxuICAgIEBfd3JhcHBlZCA9IGZhbHNlXG4gICAgQF9maW5pc2hlZCA9IGZhbHNlXG4gICAgQF9zdG9wUmVxdWVzdGVkID0gZmFsc2VcblxuICBpc1J1bm5pbmc6IC0+XG4gICAgbm90IEBfZmluaXNoZWRcblxuICBzdGFydDogLT5cbiAgICB0YXNrID0gPT5cbiAgICAgIGlmIG5vdCBAX3N0b3BSZXF1ZXN0ZWQgYW5kIEBfcHJvY2VlZCgpXG4gICAgICAgIHNldFRpbWVvdXQodGFzaywgMClcbiAgICBzZXRUaW1lb3V0KHRhc2ssIDApXG5cbiAgc3RvcDogLT5cbiAgICBAX3N0b3BSZXF1ZXN0ZWQgPSB0cnVlXG5cbiAgIyBQcm9jZWVkIHdpdGggdGhlIHNjYW4gdW50aWwgZWl0aGVyIGEgbWF0Y2gsIG9yIHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgcmFuZ2VcbiAgIyBpcyByZWFjaGVkLiBSZXR1cm4gdHJ1ZSBpZiB0aGUgc2VhcmNoIGlzbid0IGZpbmlzaGVkIHlldCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICBfcHJvY2VlZDogLT5cbiAgICByZXR1cm4gZmFsc2UgaWYgQF9maW5pc2hlZFxuXG4gICAgZm91bmQgPSBmYWxzZVxuXG4gICAgaWYgQGRpcmVjdGlvbiA9PSAnZm9yd2FyZCdcbiAgICAgIEBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UgQHJlZ0V4cCwgbmV3IFJhbmdlKEBjdXJyZW50UG9zaXRpb24sIEBjdXJyZW50TGltaXQpLCAoe3JhbmdlfSkgPT5cbiAgICAgICAgZm91bmQgPSB0cnVlXG4gICAgICAgIEBvbk1hdGNoKHJhbmdlKVxuICAgICAgICAjIElmIHJhbmdlIGlzIGVtcHR5LCBhZHZhbmNlIG9uZSBjaGFyIHRvIGVuc3VyZSBmaW5pdGUgcHJvZ3Jlc3MuXG4gICAgICAgIGlmIHJhbmdlLmlzRW1wdHkoKVxuICAgICAgICAgIEBjdXJyZW50UG9zaXRpb24gPSBAX2J1ZmZlci5wb3NpdGlvbkZvckNoYXJhY3RlckluZGV4KEBfYnVmZmVyLmNoYXJhY3RlckluZGV4Rm9yUG9zaXRpb24ocmFuZ2UuZW5kKSArIDEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAY3VycmVudFBvc2l0aW9uID0gcmFuZ2UuZW5kXG4gICAgZWxzZVxuICAgICAgQGVkaXRvci5iYWNrd2FyZHNTY2FuSW5CdWZmZXJSYW5nZSBAcmVnRXhwLCBuZXcgUmFuZ2UoQGN1cnJlbnRMaW1pdCwgQGN1cnJlbnRQb3NpdGlvbiksICh7cmFuZ2V9KSA9PlxuICAgICAgICBmb3VuZCA9IHRydWVcbiAgICAgICAgQG9uTWF0Y2gocmFuZ2UpXG4gICAgICAgICMgSWYgcmFuZ2UgaXMgZW1wdHksIGFkdmFuY2Ugb25lIGNoYXIgdG8gZW5zdXJlIGZpbml0ZSBwcm9ncmVzcy5cbiAgICAgICAgaWYgcmFuZ2UuaXNFbXB0eSgpXG4gICAgICAgICAgQGN1cnJlbnRQb3NpdGlvbiA9IEBfYnVmZmVyLnBvc2l0aW9uRm9yQ2hhcmFjdGVySW5kZXgoQF9idWZmZXIuY2hhcmFjdGVySW5kZXhGb3JQb3NpdGlvbihyYW5nZS5zdGFydCkgLSAxKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQGN1cnJlbnRQb3NpdGlvbiA9IHJhbmdlLnN0YXJ0XG4gICAgQG9uQmxvY2tGaW5pc2hlZCgpXG5cbiAgICBpZiBAX3dyYXBwZWQgYW5kIEBjdXJyZW50TGltaXQuaXNFcXVhbChAc3RhcnRQb3NpdGlvbilcbiAgICAgIEBfZmluaXNoZWQgPSB0cnVlXG4gICAgICBAb25GaW5pc2hlZCgpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICBlbHNlIGlmIG5vdCBAX3dyYXBwZWQgYW5kIEBjdXJyZW50TGltaXQuaXNFcXVhbChAYnVmZmVyTGltaXQpXG4gICAgICBAX3dyYXBwZWQgPSB0cnVlXG4gICAgICBAb25XcmFwcGVkKClcbiAgICAgIEBfc3RhcnRCbG9jayhAYnVmZmVyUmV2ZXJzZUxpbWl0KVxuICAgIGVsc2VcbiAgICAgIEBfc3RhcnRCbG9jayhAY3VycmVudExpbWl0KVxuXG4gICAgdHJ1ZVxuXG4gIF9zdGFydEJsb2NrOiAoYmxvY2tTdGFydCkgLT5cbiAgICBAY3VycmVudFBvc2l0aW9uID0gYmxvY2tTdGFydFxuICAgIEBjdXJyZW50TGltaXQgPSBAX25leHRMaW1pdChibG9ja1N0YXJ0KVxuXG4gIF9uZXh0TGltaXQ6IChwb2ludCkgLT5cbiAgICBpZiBAZGlyZWN0aW9uID09ICdmb3J3YXJkJ1xuICAgICAgZ3Vlc3MgPSBuZXcgUG9pbnQocG9pbnQucm93ICsgQGJsb2NrTGluZXMsIDApXG4gICAgICBsaW1pdCA9IGlmIEBfd3JhcHBlZCB0aGVuIEBzdGFydFBvc2l0aW9uIGVsc2UgQGJ1ZmZlckxpbWl0XG4gICAgICBpZiBndWVzcy5pc0dyZWF0ZXJUaGFuKGxpbWl0KSB0aGVuIGxpbWl0IGVsc2UgZ3Vlc3NcbiAgICBlbHNlXG4gICAgICBndWVzcyA9IG5ldyBQb2ludChwb2ludC5yb3cgLSBAYmxvY2tMaW5lcywgMClcbiAgICAgIGxpbWl0ID0gaWYgQF93cmFwcGVkIHRoZW4gQHN0YXJ0UG9zaXRpb24gZWxzZSBAYnVmZmVyTGltaXRcbiAgICAgIGlmIGd1ZXNzLmlzTGVzc1RoYW4obGltaXQpIHRoZW4gbGltaXQgZWxzZSBndWVzc1xuIl19
