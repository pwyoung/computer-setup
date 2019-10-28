(function() {
  var Point, Range, SearchResults, Utils, ref;

  ref = require('atom'), Point = ref.Point, Range = ref.Range;

  Utils = require('./utils');

  module.exports = SearchResults = (function() {
    SearchResults["for"] = function(emacsEditor) {
      return emacsEditor._atomicEmacsSearchResults != null ? emacsEditor._atomicEmacsSearchResults : emacsEditor._atomicEmacsSearchResults = new SearchResults(emacsEditor);
    };

    function SearchResults(emacsEditor1) {
      this.emacsEditor = emacsEditor1;
      this.editor = this.emacsEditor.editor;
      this.markerLayer = this.editor.addMarkerLayer();
      this.editor.decorateMarkerLayer(this.markerLayer, {
        type: 'highlight',
        "class": 'atomic-emacs-search-result'
      });
      this._numMatches = 0;
      this.currentDecorations = [];
    }

    SearchResults.prototype.clear = function() {
      this._clearDecorations();
      this.markerLayer.clear();
      return this._numMatches = 0;
    };

    SearchResults.prototype.add = function(range) {
      this._numMatches += 1;
      return this.markerLayer.bufferMarkerLayer.markRange(range);
    };

    SearchResults.prototype.numMatches = function() {
      return this._numMatches;
    };

    SearchResults.prototype.numMatchesBefore = function(point) {
      var markers;
      markers = this.markerLayer.findMarkers({
        startsInRange: new Range(new Point(0, 0), point)
      });
      return markers.length;
    };

    SearchResults.prototype.findResultAfter = function(point) {
      var markers;
      markers = this.markerLayer.findMarkers({
        startsInRange: new Range(point, this.editor.getBuffer().getEndPosition())
      });
      return markers[0] || null;
    };

    SearchResults.prototype.findResultBefore = function(point) {
      var markers;
      if (point.isEqual(Utils.BOB)) {
        return null;
      }
      markers = this.markerLayer.findMarkers({
        startsInRange: new Range(new Point(0, 0), this.emacsEditor.positionBefore(point))
      });
      return markers[markers.length - 1] || null;
    };

    SearchResults.prototype.setCurrent = function(markers) {
      this._clearDecorations();
      return this.currentDecorations = markers.map((function(_this) {
        return function(marker) {
          return _this.editor.decorateMarker(marker, {
            type: 'highlight',
            "class": 'atomic-emacs-current-result'
          });
        };
      })(this));
    };

    SearchResults.prototype.getCurrent = function() {
      return this.currentDecorations.map(function(d) {
        return d.getMarker();
      });
    };

    SearchResults.prototype._clearDecorations = function() {
      return this.currentDecorations.forEach(function(decoration) {
        return decoration.destroy();
      });
    };

    return SearchResults;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2F0b21pYy1lbWFjcy9saWIvc2VhcmNoLXJlc3VsdHMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFpQixPQUFBLENBQVEsTUFBUixDQUFqQixFQUFDLGlCQUFELEVBQVE7O0VBQ1IsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSOztFQUVSLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDSixhQUFDLEVBQUEsR0FBQSxFQUFELEdBQU0sU0FBQyxXQUFEOzZEQUNKLFdBQVcsQ0FBQyw0QkFBWixXQUFXLENBQUMsNEJBQTZCLElBQUksYUFBSixDQUFrQixXQUFsQjtJQURyQzs7SUFHTyx1QkFBQyxZQUFEO01BQUMsSUFBQyxDQUFBLGNBQUQ7TUFDWixJQUFDLENBQUEsTUFBRCxHQUFVLElBQUMsQ0FBQSxXQUFXLENBQUM7TUFDdkIsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBQTtNQUNmLElBQUMsQ0FBQSxNQUFNLENBQUMsbUJBQVIsQ0FBNEIsSUFBQyxDQUFBLFdBQTdCLEVBQ0U7UUFBQSxJQUFBLEVBQU0sV0FBTjtRQUNBLENBQUEsS0FBQSxDQUFBLEVBQU8sNEJBRFA7T0FERjtNQUdBLElBQUMsQ0FBQSxXQUFELEdBQWU7TUFDZixJQUFDLENBQUEsa0JBQUQsR0FBc0I7SUFQWDs7NEJBU2IsS0FBQSxHQUFPLFNBQUE7TUFDTCxJQUFDLENBQUEsaUJBQUQsQ0FBQTtNQUNBLElBQUMsQ0FBQSxXQUFXLENBQUMsS0FBYixDQUFBO2FBQ0EsSUFBQyxDQUFBLFdBQUQsR0FBZTtJQUhWOzs0QkFLUCxHQUFBLEdBQUssU0FBQyxLQUFEO01BQ0gsSUFBQyxDQUFBLFdBQUQsSUFBZ0I7YUFDaEIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxTQUEvQixDQUF5QyxLQUF6QztJQUZHOzs0QkFJTCxVQUFBLEdBQVksU0FBQTthQUNWLElBQUMsQ0FBQTtJQURTOzs0QkFHWixnQkFBQSxHQUFrQixTQUFDLEtBQUQ7QUFDaEIsVUFBQTtNQUFBLE9BQUEsR0FBVSxJQUFDLENBQUEsV0FBVyxDQUFDLFdBQWIsQ0FDUjtRQUFBLGFBQUEsRUFBZSxJQUFJLEtBQUosQ0FBVSxJQUFJLEtBQUosQ0FBVSxDQUFWLEVBQWEsQ0FBYixDQUFWLEVBQTJCLEtBQTNCLENBQWY7T0FEUTthQUVWLE9BQU8sQ0FBQztJQUhROzs0QkFLbEIsZUFBQSxHQUFpQixTQUFDLEtBQUQ7QUFDZixVQUFBO01BQUEsT0FBQSxHQUFVLElBQUMsQ0FBQSxXQUFXLENBQUMsV0FBYixDQUNSO1FBQUEsYUFBQSxFQUFlLElBQUksS0FBSixDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFSLENBQUEsQ0FBbUIsQ0FBQyxjQUFwQixDQUFBLENBQWpCLENBQWY7T0FEUTthQUVWLE9BQVEsQ0FBQSxDQUFBLENBQVIsSUFBYztJQUhDOzs0QkFLakIsZ0JBQUEsR0FBa0IsU0FBQyxLQUFEO0FBQ2hCLFVBQUE7TUFBQSxJQUFHLEtBQUssQ0FBQyxPQUFOLENBQWMsS0FBSyxDQUFDLEdBQXBCLENBQUg7QUFDRSxlQUFPLEtBRFQ7O01BR0EsT0FBQSxHQUFVLElBQUMsQ0FBQSxXQUFXLENBQUMsV0FBYixDQUNSO1FBQUEsYUFBQSxFQUFlLElBQUksS0FBSixDQUFVLElBQUksS0FBSixDQUFVLENBQVYsRUFBYSxDQUFiLENBQVYsRUFBMkIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxjQUFiLENBQTRCLEtBQTVCLENBQTNCLENBQWY7T0FEUTthQUVWLE9BQVEsQ0FBQSxPQUFPLENBQUMsTUFBUixHQUFpQixDQUFqQixDQUFSLElBQStCO0lBTmY7OzRCQVFsQixVQUFBLEdBQVksU0FBQyxPQUFEO01BQ1YsSUFBQyxDQUFBLGlCQUFELENBQUE7YUFFQSxJQUFDLENBQUEsa0JBQUQsR0FBc0IsT0FBTyxDQUFDLEdBQVIsQ0FBWSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsTUFBRDtpQkFDaEMsS0FBQyxDQUFBLE1BQU0sQ0FBQyxjQUFSLENBQXVCLE1BQXZCLEVBQ0U7WUFBQSxJQUFBLEVBQU0sV0FBTjtZQUNBLENBQUEsS0FBQSxDQUFBLEVBQU8sNkJBRFA7V0FERjtRQURnQztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBWjtJQUhaOzs0QkFRWixVQUFBLEdBQVksU0FBQTthQUNWLElBQUMsQ0FBQSxrQkFBa0IsQ0FBQyxHQUFwQixDQUF3QixTQUFDLENBQUQ7ZUFBTyxDQUFDLENBQUMsU0FBRixDQUFBO01BQVAsQ0FBeEI7SUFEVTs7NEJBR1osaUJBQUEsR0FBbUIsU0FBQTthQUNqQixJQUFDLENBQUEsa0JBQWtCLENBQUMsT0FBcEIsQ0FBNEIsU0FBQyxVQUFEO2VBQzFCLFVBQVUsQ0FBQyxPQUFYLENBQUE7TUFEMEIsQ0FBNUI7SUFEaUI7Ozs7O0FBMURyQiIsInNvdXJjZXNDb250ZW50IjpbIntQb2ludCwgUmFuZ2V9ID0gcmVxdWlyZSAnYXRvbSdcblV0aWxzID0gcmVxdWlyZSAnLi91dGlscydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgU2VhcmNoUmVzdWx0c1xuICBAZm9yOiAoZW1hY3NFZGl0b3IpIC0+XG4gICAgZW1hY3NFZGl0b3IuX2F0b21pY0VtYWNzU2VhcmNoUmVzdWx0cyA/PSBuZXcgU2VhcmNoUmVzdWx0cyhlbWFjc0VkaXRvcilcblxuICBjb25zdHJ1Y3RvcjogKEBlbWFjc0VkaXRvcikgLT5cbiAgICBAZWRpdG9yID0gQGVtYWNzRWRpdG9yLmVkaXRvclxuICAgIEBtYXJrZXJMYXllciA9IEBlZGl0b3IuYWRkTWFya2VyTGF5ZXIoKVxuICAgIEBlZGl0b3IuZGVjb3JhdGVNYXJrZXJMYXllciBAbWFya2VyTGF5ZXIsXG4gICAgICB0eXBlOiAnaGlnaGxpZ2h0J1xuICAgICAgY2xhc3M6ICdhdG9taWMtZW1hY3Mtc2VhcmNoLXJlc3VsdCdcbiAgICBAX251bU1hdGNoZXMgPSAwXG4gICAgQGN1cnJlbnREZWNvcmF0aW9ucyA9IFtdXG5cbiAgY2xlYXI6IC0+XG4gICAgQF9jbGVhckRlY29yYXRpb25zKClcbiAgICBAbWFya2VyTGF5ZXIuY2xlYXIoKVxuICAgIEBfbnVtTWF0Y2hlcyA9IDBcblxuICBhZGQ6IChyYW5nZSkgLT5cbiAgICBAX251bU1hdGNoZXMgKz0gMVxuICAgIEBtYXJrZXJMYXllci5idWZmZXJNYXJrZXJMYXllci5tYXJrUmFuZ2UocmFuZ2UpXG5cbiAgbnVtTWF0Y2hlczogLT5cbiAgICBAX251bU1hdGNoZXNcblxuICBudW1NYXRjaGVzQmVmb3JlOiAocG9pbnQpIC0+XG4gICAgbWFya2VycyA9IEBtYXJrZXJMYXllci5maW5kTWFya2Vyc1xuICAgICAgc3RhcnRzSW5SYW5nZTogbmV3IFJhbmdlKG5ldyBQb2ludCgwLCAwKSwgcG9pbnQpXG4gICAgbWFya2Vycy5sZW5ndGhcblxuICBmaW5kUmVzdWx0QWZ0ZXI6IChwb2ludCkgLT5cbiAgICBtYXJrZXJzID0gQG1hcmtlckxheWVyLmZpbmRNYXJrZXJzXG4gICAgICBzdGFydHNJblJhbmdlOiBuZXcgUmFuZ2UocG9pbnQsIEBlZGl0b3IuZ2V0QnVmZmVyKCkuZ2V0RW5kUG9zaXRpb24oKSlcbiAgICBtYXJrZXJzWzBdIG9yIG51bGxcblxuICBmaW5kUmVzdWx0QmVmb3JlOiAocG9pbnQpIC0+XG4gICAgaWYgcG9pbnQuaXNFcXVhbChVdGlscy5CT0IpXG4gICAgICByZXR1cm4gbnVsbFxuXG4gICAgbWFya2VycyA9IEBtYXJrZXJMYXllci5maW5kTWFya2Vyc1xuICAgICAgc3RhcnRzSW5SYW5nZTogbmV3IFJhbmdlKG5ldyBQb2ludCgwLCAwKSwgQGVtYWNzRWRpdG9yLnBvc2l0aW9uQmVmb3JlKHBvaW50KSlcbiAgICBtYXJrZXJzW21hcmtlcnMubGVuZ3RoIC0gMV0gb3IgbnVsbFxuXG4gIHNldEN1cnJlbnQ6IChtYXJrZXJzKSAtPlxuICAgIEBfY2xlYXJEZWNvcmF0aW9ucygpXG5cbiAgICBAY3VycmVudERlY29yYXRpb25zID0gbWFya2Vycy5tYXAgKG1hcmtlcikgPT5cbiAgICAgIEBlZGl0b3IuZGVjb3JhdGVNYXJrZXIgbWFya2VyLFxuICAgICAgICB0eXBlOiAnaGlnaGxpZ2h0J1xuICAgICAgICBjbGFzczogJ2F0b21pYy1lbWFjcy1jdXJyZW50LXJlc3VsdCdcblxuICBnZXRDdXJyZW50OiAtPlxuICAgIEBjdXJyZW50RGVjb3JhdGlvbnMubWFwIChkKSAtPiBkLmdldE1hcmtlcigpXG5cbiAgX2NsZWFyRGVjb3JhdGlvbnM6IC0+XG4gICAgQGN1cnJlbnREZWNvcmF0aW9ucy5mb3JFYWNoIChkZWNvcmF0aW9uKSAtPlxuICAgICAgZGVjb3JhdGlvbi5kZXN0cm95KClcbiJdfQ==
