(function() {
  var CompositeDisposable, Emacs, GlobalEmacsState, packageDeps;

  CompositeDisposable = require('atom').CompositeDisposable;

  packageDeps = require('atom-package-deps');

  Emacs = require('./emacs');

  GlobalEmacsState = require('./global-emacs-state');

  module.exports = {
    activate: function() {
      this.subscriptions = new CompositeDisposable;
      this.emacsObjects = new WeakMap;
      this.globalEmacsState = new GlobalEmacsState;
      this.subscriptions.add(atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          if (editor.mini) {
            return;
          }
          if (!_this.emacsObjects.get(editor)) {
            return _this.emacsObjects.set(editor, new Emacs(editor, _this.globalEmacsState));
          }
        };
      })(this)));
      return packageDeps.install('emacs-plus');
    },
    deactivate: function() {
      var editor, i, len, ref, ref1, ref2, ref3;
      if ((ref = this.subscriptions) != null) {
        ref.dispose();
      }
      this.subscriptions = null;
      ref1 = atom.workspace.getTextEditors();
      for (i = 0, len = ref1.length; i < len; i++) {
        editor = ref1[i];
        if ((ref2 = this.emacsObjects.get(editor)) != null) {
          ref2.destroy();
        }
      }
      this.emacsObjects = null;
      if ((ref3 = this.globalEmacsState) != null) {
        ref3.destroy();
      }
      return this.globalEmacsState = null;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2VtYWNzLXBsdXMvbGliL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLFdBQUEsR0FBYyxPQUFBLENBQVEsbUJBQVI7O0VBQ2QsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSOztFQUNSLGdCQUFBLEdBQW1CLE9BQUEsQ0FBUSxzQkFBUjs7RUFFbkIsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFFBQUEsRUFBVSxTQUFBO01BQ1IsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUNyQixJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFJO01BQ3BCLElBQUMsQ0FBQSxnQkFBRCxHQUFvQixJQUFJO01BQ3hCLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFmLENBQWtDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxNQUFEO1VBQ25ELElBQVUsTUFBTSxDQUFDLElBQWpCO0FBQUEsbUJBQUE7O1VBQ0EsSUFBQSxDQUFPLEtBQUMsQ0FBQSxZQUFZLENBQUMsR0FBZCxDQUFrQixNQUFsQixDQUFQO21CQUNFLEtBQUMsQ0FBQSxZQUFZLENBQUMsR0FBZCxDQUFrQixNQUFsQixFQUEwQixJQUFJLEtBQUosQ0FBVSxNQUFWLEVBQWtCLEtBQUMsQ0FBQSxnQkFBbkIsQ0FBMUIsRUFERjs7UUFGbUQ7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWxDLENBQW5CO2FBSUEsV0FBVyxDQUFDLE9BQVosQ0FBb0IsWUFBcEI7SUFSUSxDQUFWO0lBVUEsVUFBQSxFQUFZLFNBQUE7QUFDVixVQUFBOztXQUFjLENBQUUsT0FBaEIsQ0FBQTs7TUFDQSxJQUFDLENBQUEsYUFBRCxHQUFpQjtBQUVqQjtBQUFBLFdBQUEsc0NBQUE7OztjQUMyQixDQUFFLE9BQTNCLENBQUE7O0FBREY7TUFFQSxJQUFDLENBQUEsWUFBRCxHQUFnQjs7WUFFQyxDQUFFLE9BQW5CLENBQUE7O2FBQ0EsSUFBQyxDQUFBLGdCQUFELEdBQW9CO0lBVFYsQ0FWWjs7QUFORiIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5wYWNrYWdlRGVwcyA9IHJlcXVpcmUgJ2F0b20tcGFja2FnZS1kZXBzJ1xuRW1hY3MgPSByZXF1aXJlICcuL2VtYWNzJ1xuR2xvYmFsRW1hY3NTdGF0ZSA9IHJlcXVpcmUgJy4vZ2xvYmFsLWVtYWNzLXN0YXRlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGFjdGl2YXRlOiAtPlxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAZW1hY3NPYmplY3RzID0gbmV3IFdlYWtNYXBcbiAgICBAZ2xvYmFsRW1hY3NTdGF0ZSA9IG5ldyBHbG9iYWxFbWFjc1N0YXRlXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyAoZWRpdG9yKSA9PlxuICAgICAgcmV0dXJuIGlmIGVkaXRvci5taW5pXG4gICAgICB1bmxlc3MgQGVtYWNzT2JqZWN0cy5nZXQoZWRpdG9yKVxuICAgICAgICBAZW1hY3NPYmplY3RzLnNldChlZGl0b3IsIG5ldyBFbWFjcyhlZGl0b3IsIEBnbG9iYWxFbWFjc1N0YXRlKSlcbiAgICBwYWNrYWdlRGVwcy5pbnN0YWxsKCdlbWFjcy1wbHVzJylcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBzdWJzY3JpcHRpb25zPy5kaXNwb3NlKClcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG51bGxcblxuICAgIGZvciBlZGl0b3IgaW4gYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKVxuICAgICAgQGVtYWNzT2JqZWN0cy5nZXQoZWRpdG9yKT8uZGVzdHJveSgpXG4gICAgQGVtYWNzT2JqZWN0cyA9IG51bGxcblxuICAgIEBnbG9iYWxFbWFjc1N0YXRlPy5kZXN0cm95KClcbiAgICBAZ2xvYmFsRW1hY3NTdGF0ZSA9IG51bGxcbiJdfQ==
