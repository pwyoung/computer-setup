(function() {
  var Point;

  Point = require('atom').Point;

  module.exports = {
    BOB: new Point(0, 0),
    escapeForRegExp: function(string) {
      if (string) {
        return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      } else {
        return '';
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2F0b21pYy1lbWFjcy9saWIvdXRpbHMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxRQUFTLE9BQUEsQ0FBUSxNQUFSOztFQUVWLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxHQUFBLEVBQUssSUFBSSxLQUFKLENBQVUsQ0FBVixFQUFhLENBQWIsQ0FBTDtJQUdBLGVBQUEsRUFBaUIsU0FBQyxNQUFEO01BQ2YsSUFBRyxNQUFIO2VBQ0UsTUFBTSxDQUFDLE9BQVAsQ0FBZSx3QkFBZixFQUF5QyxNQUF6QyxFQURGO09BQUEsTUFBQTtlQUdFLEdBSEY7O0lBRGUsQ0FIakI7O0FBSEYiLCJzb3VyY2VzQ29udGVudCI6WyJ7UG9pbnR9ID0gcmVxdWlyZSAnYXRvbSdcblxubW9kdWxlLmV4cG9ydHMgPVxuICBCT0I6IG5ldyBQb2ludCgwLCAwKVxuXG4gICMgU3RvbGVuIGZyb20gdW5kZXJzY29yZS1wbHVzLlxuICBlc2NhcGVGb3JSZWdFeHA6IChzdHJpbmcpIC0+XG4gICAgaWYgc3RyaW5nXG4gICAgICBzdHJpbmcucmVwbGFjZSgvWy1cXC9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJylcbiAgICBlbHNlXG4gICAgICAnJ1xuIl19
