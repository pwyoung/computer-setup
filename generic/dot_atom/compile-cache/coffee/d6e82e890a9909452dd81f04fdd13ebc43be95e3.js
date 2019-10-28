(function() {
  var KillRing;

  module.exports = KillRing = (function() {
    function KillRing() {
      this.currentIndex = -1;
      this.entries = [];
      this.limit = 500;
      this.lastClip = void 0;
    }

    KillRing.prototype.fork = function() {
      var fork;
      fork = new KillRing;
      fork.setEntries(this.entries);
      fork.currentIndex = this.currentIndex;
      fork.lastClip = this.lastClip;
      return fork;
    };

    KillRing.prototype.isEmpty = function() {
      return this.entries.length === 0;
    };

    KillRing.prototype.reset = function() {
      return this.entries = [];
    };

    KillRing.prototype.getEntries = function() {
      return this.entries.slice();
    };

    KillRing.prototype.setEntries = function(entries) {
      this.entries = entries.slice();
      this.currentIndex = this.entries.length - 1;
      return this;
    };

    KillRing.prototype.push = function(text) {
      this.entries.push(text);
      if (this.entries.length > this.limit) {
        this.entries.shift();
      }
      return this.currentIndex = this.entries.length - 1;
    };

    KillRing.prototype.append = function(text) {
      var index;
      if (this.entries.length === 0) {
        return this.push(text);
      } else {
        index = this.entries.length - 1;
        this.entries[index] = this.entries[index] + text;
        return this.currentIndex = this.entries.length - 1;
      }
    };

    KillRing.prototype.prepend = function(text) {
      var index;
      if (this.entries.length === 0) {
        return this.push(text);
      } else {
        index = this.entries.length - 1;
        this.entries[index] = "" + text + this.entries[index];
        return this.currentIndex = this.entries.length - 1;
      }
    };

    KillRing.prototype.replace = function(text) {
      var index;
      if (this.entries.length === 0) {
        return this.push(text);
      } else {
        index = this.entries.length - 1;
        this.entries[index] = text;
        return this.currentIndex = this.entries.length - 1;
      }
    };

    KillRing.prototype.getCurrentEntry = function() {
      if (this.entries.length === 0) {
        return null;
      } else {
        return this.entries[this.currentIndex];
      }
    };

    KillRing.prototype.rotate = function(n) {
      if (this.entries.length === 0) {
        return null;
      }
      this.currentIndex = (this.currentIndex + n) % this.entries.length;
      if (this.currentIndex < 0) {
        this.currentIndex += this.entries.length;
      }
      return this.entries[this.currentIndex];
    };

    KillRing.global = new KillRing;

    KillRing.pullFromClipboard = function(killRings) {
      var entries, text;
      text = atom.clipboard.read();
      if (text !== KillRing.lastClip) {
        KillRing.global.push(text);
        KillRing.lastClip = text;
        if (killRings.length > 1) {
          entries = text.split(/\r?\n/);
          return killRings.forEach(function(killRing, i) {
            var entry, ref;
            entry = (ref = entries[i]) != null ? ref : '';
            return killRing.push(entry);
          });
        }
      }
    };

    KillRing.pushToClipboard = function() {
      var text;
      text = KillRing.global.getCurrentEntry();
      atom.clipboard.write(text);
      return KillRing.lastClip = text;
    };

    return KillRing;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2F0b21pYy1lbWFjcy9saWIva2lsbC1yaW5nLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLGtCQUFBO01BQ1gsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsQ0FBQztNQUNqQixJQUFDLENBQUEsT0FBRCxHQUFXO01BQ1gsSUFBQyxDQUFBLEtBQUQsR0FBUztNQUNULElBQUMsQ0FBQSxRQUFELEdBQVk7SUFKRDs7dUJBTWIsSUFBQSxHQUFNLFNBQUE7QUFDSixVQUFBO01BQUEsSUFBQSxHQUFPLElBQUk7TUFDWCxJQUFJLENBQUMsVUFBTCxDQUFnQixJQUFDLENBQUEsT0FBakI7TUFDQSxJQUFJLENBQUMsWUFBTCxHQUFvQixJQUFDLENBQUE7TUFDckIsSUFBSSxDQUFDLFFBQUwsR0FBZ0IsSUFBQyxDQUFBO2FBQ2pCO0lBTEk7O3VCQU9OLE9BQUEsR0FBUyxTQUFBO2FBQ1AsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULEtBQW1CO0lBRFo7O3VCQUdULEtBQUEsR0FBTyxTQUFBO2FBQ0wsSUFBQyxDQUFBLE9BQUQsR0FBVztJQUROOzt1QkFHUCxVQUFBLEdBQVksU0FBQTthQUNWLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBVCxDQUFBO0lBRFU7O3VCQUdaLFVBQUEsR0FBWSxTQUFDLE9BQUQ7TUFDVixJQUFDLENBQUEsT0FBRCxHQUFXLE9BQU8sQ0FBQyxLQUFSLENBQUE7TUFDWCxJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsR0FBa0I7YUFDbEM7SUFIVTs7dUJBS1osSUFBQSxHQUFNLFNBQUMsSUFBRDtNQUNKLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLElBQWQ7TUFDQSxJQUFHLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxH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dEI7VUFDRSxPQUFBLEdBQVUsSUFBSSxDQUFDLEtBQUwsQ0FBVyxPQUFYO2lCQUNWLFNBQVMsQ0FBQyxPQUFWLENBQWtCLFNBQUMsUUFBRCxFQUFXLENBQVg7QUFDaEIsZ0JBQUE7WUFBQSxLQUFBLHNDQUFxQjttQkFDckIsUUFBUSxDQUFDLElBQVQsQ0FBYyxLQUFkO1VBRmdCLENBQWxCLEVBRkY7U0FIRjs7SUFGa0I7O0lBV3BCLFFBQUMsQ0FBQSxlQUFELEdBQWtCLFNBQUE7QUFDaEIsVUFBQTtNQUFBLElBQUEsR0FBTyxRQUFRLENBQUMsTUFBTSxDQUFDLGVBQWhCLENBQUE7TUFDUCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQWYsQ0FBcUIsSUFBckI7YUFDQSxRQUFRLENBQUMsUUFBVCxHQUFvQjtJQUhKOzs7OztBQXBGcEIiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBLaWxsUmluZ1xuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAY3VycmVudEluZGV4ID0gLTFcbiAgICBAZW50cmllcyA9IFtdXG4gICAgQGxpbWl0ID0gNTAwXG4gICAgQGxhc3RDbGlwID0gdW5kZWZpbmVkXG5cbiAgZm9yazogLT5cbiAgICBmb3JrID0gbmV3IEtpbGxSaW5nXG4gICAgZm9yay5zZXRFbnRyaWVzKEBlbnRyaWVzKVxuICAgIGZvcmsuY3VycmVudEluZGV4ID0gQGN1cnJlbnRJbmRleFxuICAgIGZvcmsubGFzdENsaXAgPSBAbGFzdENsaXBcbiAgICBmb3JrXG5cbiAgaXNFbXB0eTogLT5cbiAgICBAZW50cmllcy5sZW5ndGggPT0gMFxuXG4gIHJlc2V0OiAtPlxuICAgIEBlbnRyaWVzID0gW11cblxuICBnZXRFbnRyaWVzOiAtPlxuICAgIEBlbnRyaWVzLnNsaWNlKClcblxuICBzZXRFbnRyaWVzOiAoZW50cmllcykgLT5cbiAgICBAZW50cmllcyA9IGVudHJpZXMuc2xpY2UoKVxuICAgIEBjdXJyZW50SW5kZXggPSBAZW50cmllcy5sZW5ndGggLSAxXG4gICAgdGhpc1xuXG4gIHB1c2g6ICh0ZXh0KSAtPlxuICAgIEBlbnRyaWVzLnB1c2godGV4dClcbiAgICBpZiBAZW50cmllcy5sZW5ndGggPiBAbGltaXRcbiAgICAgIEBlbnRyaWVzLnNoaWZ0KClcbiAgICBAY3VycmVudEluZGV4ID0gQGVudHJpZXMubGVuZ3RoIC0gMVxuXG4gIGFwcGVuZDogKHRleHQpIC0+XG4gICAgaWYgQGVudHJpZXMubGVuZ3RoID09IDBcbiAgICAgIEBwdXNoKHRleHQpXG4gICAgZWxzZVxuICAgICAgaW5kZXggPSBAZW50cmllcy5sZW5ndGggLSAxXG4gICAgICBAZW50cmllc1tpbmRleF0gPSBAZW50cmllc1tpbmRleF0gKyB0ZXh0XG4gICAgICBAY3VycmVudEluZGV4ID0gQGVudHJpZXMubGVuZ3RoIC0gMVxuXG4gIHByZXBlbmQ6ICh0ZXh0KSAtPlxuICAgIGlmIEBlbnRyaWVzLmxlbmd0aCA9PSAwXG4gICAgICBAcHVzaCh0ZXh0KVxuICAgIGVsc2VcbiAgICAgIGluZGV4ID0gQGVudHJpZXMubGVuZ3RoIC0gMVxuICAgICAgQGVudHJpZXNbaW5kZXhdID0gXCIje3RleHR9I3tAZW50cmllc1tpbmRleF19XCJcbiAgICAgIEBjdXJyZW50SW5kZXggPSBAZW50cmllcy5sZW5ndGggLSAxXG5cbiAgcmVwbGFjZTogKHRleHQpIC0+XG4gICAgaWYgQGVudHJpZXMubGVuZ3RoID09IDBcbiAgICAgIEBwdXNoKHRleHQpXG4gICAgZWxzZVxuICAgICAgaW5kZXggPSBAZW50cmllcy5sZW5ndGggLSAxXG4gICAgICBAZW50cmllc1tpbmRleF0gPSB0ZXh0XG4gICAgICBAY3VycmVudEluZGV4ID0gQGVudHJpZXMubGVuZ3RoIC0gMVxuXG4gIGdldEN1cnJlbnRFbnRyeTogLT5cbiAgICBpZiBAZW50cmllcy5sZW5ndGggPT0gMFxuICAgICAgcmV0dXJuIG51bGxcbiAgICBlbHNlXG4gICAgICBAZW50cmllc1tAY3VycmVudEluZGV4XVxuXG4gIHJvdGF0ZTogKG4pIC0+XG4gICAgcmV0dXJuIG51bGwgaWYgQGVudHJpZXMubGVuZ3RoID09IDBcbiAgICBAY3VycmVudEluZGV4ID0gKEBjdXJyZW50SW5kZXggKyBuKSAlIEBlbnRyaWVzLmxlbmd0aFxuICAgIEBjdXJyZW50SW5kZXggKz0gQGVudHJpZXMubGVuZ3RoIGlmIEBjdXJyZW50SW5kZXggPCAwXG4gICAgcmV0dXJuIEBlbnRyaWVzW0BjdXJyZW50SW5kZXhdXG5cbiAgQGdsb2JhbCA9IG5ldyBLaWxsUmluZ1xuXG4gIEBwdWxsRnJvbUNsaXBib2FyZDogKGtpbGxSaW5ncykgLT5cbiAgICB0ZXh0ID0gYXRvbS5jbGlwYm9hcmQucmVhZCgpXG4gICAgaWYgdGV4dCAhPSBLaWxsUmluZy5sYXN0Q2xpcFxuICAgICAgS2lsbFJpbmcuZ2xvYmFsLnB1c2godGV4dClcbiAgICAgIEtpbGxSaW5nLmxhc3RDbGlwID0gdGV4dFxuICAgICAgaWYga2lsbFJpbmdzLmxlbmd0aCA+IDFcbiAgICAgICAgZW50cmllcyA9IHRleHQuc3BsaXQoL1xccj9cXG4vKVxuICAgICAgICBraWxsUmluZ3MuZm9yRWFjaCAoa2lsbFJpbmcsIGkpIC0+XG4gICAgICAgICAgZW50cnkgPSBlbnRyaWVzW2ldID8gJydcbiAgICAgICAgICBraWxsUmluZy5wdXNoKGVudHJ5KVxuXG4gIEBwdXNoVG9DbGlwYm9hcmQ6IC0+XG4gICAgdGV4dCA9IEtpbGxSaW5nLmdsb2JhbC5nZXRDdXJyZW50RW50cnkoKVxuICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKHRleHQpXG4gICAgS2lsbFJpbmcubGFzdENsaXAgPSB0ZXh0XG4iXX0=
