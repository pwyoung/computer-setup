(function() {
  var CompositeDisposable, GlobalEmacsState, Mark,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  CompositeDisposable = require('atom').CompositeDisposable;

  Mark = require('./mark');

  module.exports = GlobalEmacsState = (function() {
    var ignoreCommands;

    ignoreCommands = new Set(['editor:display-updated', 'cursor:moved', 'selection:changed']);

    GlobalEmacsState.prototype.subscriptions = null;

    GlobalEmacsState.prototype.lastCommand = null;

    GlobalEmacsState.prototype.thisCommand = null;

    GlobalEmacsState.prototype.activateMarkCommands = new Set;

    function GlobalEmacsState() {
      this.logCommand = bind(this.logCommand, this);
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(atom.commands.onWillDispatch(this.logCommand));
      this.subscriptions.add(atom.config.observe('emacs-plus.activateMarkCommands', (function(_this) {
        return function(value) {
          return _this.activateMarkCommands = new Set(value);
        };
      })(this)));
      this.subscriptions.add(atom.commands.onWillDispatch((function(_this) {
        return function(arg) {
          var command;
          command = arg.type;
          if (_this.activateMarkCommands.has(command)) {
            return Mark["for"](atom.workspace.getActiveTextEditor()).activate();
          }
        };
      })(this)));
    }

    GlobalEmacsState.prototype.destroy = function() {
      var ref;
      if ((ref = this.subscriptions) != null) {
        ref.dispose();
      }
      return this.subscriptions = null;
    };

    GlobalEmacsState.prototype.logCommand = function(arg) {
      var command;
      command = arg.type;
      if (command.indexOf(':') === -1) {
        return;
      }
      if (ignoreCommands.has(command)) {
        return;
      }
      this.lastCommand = this.thisCommand;
      return this.thisCommand = command;
    };

    return GlobalEmacsState;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nLy5hdG9tL3BhY2thZ2VzL2VtYWNzLXBsdXMvbGliL2dsb2JhbC1lbWFjcy1zdGF0ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDJDQUFBO0lBQUE7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBRVAsTUFBTSxDQUFDLE9BQVAsR0FDTTtBQUVKLFFBQUE7O0lBQUEsY0FBQSxHQUFpQixJQUFJLEdBQUosQ0FBUSxDQUN2Qix3QkFEdUIsRUFDRyxjQURILEVBQ21CLG1CQURuQixDQUFSOzsrQkFJakIsYUFBQSxHQUFlOzsrQkFDZixXQUFBLEdBQWE7OytCQUNiLFdBQUEsR0FBYTs7K0JBQ2Isb0JBQUEsR0FBc0IsSUFBSTs7SUFFYiwwQkFBQTs7TUFDWCxJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BQ3JCLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWQsQ0FBNkIsSUFBQyxDQUFBLFVBQTlCLENBQW5CO01BQ0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBWixDQUFvQixpQ0FBcEIsRUFBdUQsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEtBQUQ7aUJBQ3hFLEtBQUMsQ0FBQSxvQkFBRCxHQUF3QixJQUFJLEdBQUosQ0FBUSxLQUFSO1FBRGdEO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF2RCxDQUFuQjtNQUdBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWQsQ0FBNkIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7QUFDOUMsY0FBQTtVQURzRCxVQUFQLElBQUM7VUFDaEQsSUFBRyxLQUFDLENBQUEsb0JBQW9CLENBQUMsR0FBdEIsQ0FBMEIsT0FBMUIsQ0FBSDttQkFDRSxJQUFJLEVBQUMsR0FBRCxFQUFKLENBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBLENBQVQsQ0FBOEMsQ0FBQyxRQUEvQyxDQUFBLEVBREY7O1FBRDhDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE3QixDQUFuQjtJQU5XOzsrQkFXYixPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7O1dBQWMsQ0FBRSxPQUFoQixDQUFBOzthQUNBLElBQUMsQ0FBQSxhQUFELEdBQWlCO0lBRlY7OytCQUlULFVBQUEsR0FBWSxTQUFDLEdBQUQ7QUFDVixVQUFBO01BRGtCLFVBQVAsSUFBQztNQUNaLElBQVUsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsR0FBaEIsQ0FBQSxLQUF3QixDQUFDLENBQW5DO0FBQUEsZUFBQTs7TUFDQSxJQUFVLGNBQWMsQ0FBQyxHQUFmLENBQW1CLE9BQW5CLENBQVY7QUFBQSxlQUFBOztNQUNBLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQyxDQUFBO2FBQ2hCLElBQUMsQ0FBQSxXQUFELEdBQWU7SUFKTDs7Ozs7QUE5QmQiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuTWFyayA9IHJlcXVpcmUgJy4vbWFyaydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgR2xvYmFsRW1hY3NTdGF0ZVxuICAjIGZvciBTcGVjTW9kZVxuICBpZ25vcmVDb21tYW5kcyA9IG5ldyBTZXQoW1xuICAgICdlZGl0b3I6ZGlzcGxheS11cGRhdGVkJywgJ2N1cnNvcjptb3ZlZCcsICdzZWxlY3Rpb246Y2hhbmdlZCdcbiAgXSlcblxuICBzdWJzY3JpcHRpb25zOiBudWxsXG4gIGxhc3RDb21tYW5kOiBudWxsXG4gIHRoaXNDb21tYW5kOiBudWxsXG4gIGFjdGl2YXRlTWFya0NvbW1hbmRzOiBuZXcgU2V0XG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbW1hbmRzLm9uV2lsbERpc3BhdGNoKEBsb2dDb21tYW5kKSlcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnZW1hY3MtcGx1cy5hY3RpdmF0ZU1hcmtDb21tYW5kcycsICh2YWx1ZSkgPT5cbiAgICAgIEBhY3RpdmF0ZU1hcmtDb21tYW5kcyA9IG5ldyBTZXQodmFsdWUpXG4gICAgKSlcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5vbldpbGxEaXNwYXRjaCgoe3R5cGU6IGNvbW1hbmR9KSA9PlxuICAgICAgaWYgQGFjdGl2YXRlTWFya0NvbW1hbmRzLmhhcyhjb21tYW5kKVxuICAgICAgICBNYXJrLmZvcihhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCkpLmFjdGl2YXRlKClcbiAgICApKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIEBzdWJzY3JpcHRpb25zID0gbnVsbFxuXG4gIGxvZ0NvbW1hbmQ6ICh7dHlwZTogY29tbWFuZH0pID0+XG4gICAgcmV0dXJuIGlmIGNvbW1hbmQuaW5kZXhPZignOicpIGlzIC0xXG4gICAgcmV0dXJuIGlmIGlnbm9yZUNvbW1hbmRzLmhhcyhjb21tYW5kKVxuICAgIEBsYXN0Q29tbWFuZCA9IEB0aGlzQ29tbWFuZFxuICAgIEB0aGlzQ29tbWFuZCA9IGNvbW1hbmRcbiJdfQ==
