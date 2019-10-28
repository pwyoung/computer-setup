(function() {
  var Dialog, TextEditorView, View, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), TextEditorView = ref.TextEditorView, View = ref.View;

  module.exports = Dialog = (function(superClass) {
    extend(Dialog, superClass);

    function Dialog() {
      return Dialog.__super__.constructor.apply(this, arguments);
    }

    Dialog.content = function(arg) {
      var prompt;
      prompt = (arg != null ? arg : {}).prompt;
      return this.div({
        "class": 'platformio-ide-terminal-dialog'
      }, (function(_this) {
        return function() {
          _this.label(prompt, {
            "class": 'icon',
            outlet: 'promptText'
          });
          _this.subview('miniEditor', new TextEditorView({
            mini: true
          }));
          _this.label('Escape (Esc) to exit', {
            style: 'width: 50%;'
          });
          return _this.label('Enter (\u21B5) to confirm', {
            style: 'width: 50%; text-align: right;'
          });
        };
      })(this));
    };

    Dialog.prototype.initialize = function(arg) {
      var iconClass, placeholderText, ref1, stayOpen;
      ref1 = arg != null ? arg : {}, iconClass = ref1.iconClass, placeholderText = ref1.placeholderText, stayOpen = ref1.stayOpen;
      if (iconClass) {
        this.promptText.addClass(iconClass);
      }
      atom.commands.add(this.element, {
        'core:confirm': (function(_this) {
          return function() {
            return _this.onConfirm(_this.miniEditor.getText());
          };
        })(this),
        'core:cancel': (function(_this) {
          return function() {
            return _this.cancel();
          };
        })(this)
      });
      if (!stayOpen) {
        this.miniEditor.on('blur', (function(_this) {
          return function() {
            return _this.close();
          };
        })(this));
      }
      if (placeholderText) {
        this.miniEditor.getModel().setText(placeholderText);
        return this.miniEditor.getModel().selectAll();
      }
    };

    Dialog.prototype.attach = function() {
      this.panel = atom.workspace.addModalPanel({
        item: this.element
      });
      this.miniEditor.focus();
      return this.miniEditor.getModel().scrollToCursorPosition();
    };

    Dialog.prototype.close = function() {
      var panelToDestroy;
      panelToDestroy = this.panel;
      this.panel = null;
      if (panelToDestroy != null) {
        panelToDestroy.destroy();
      }
      return atom.workspace.getActivePane().activate();
    };

    Dialog.prototype.cancel = function() {
      return this.close();
    };

    return Dialog;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nL2dpdC9wd3lvdW5nL2NvbXB1dGVyLXNldHVwL2dlbmVyaWMvZG90X2F0b20vcGFja2FnZXMvcGxhdGZvcm1pby1pZGUtdGVybWluYWwvbGliL2RpYWxvZy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGlDQUFBO0lBQUE7OztFQUFBLE1BQXlCLE9BQUEsQ0FBUSxzQkFBUixDQUF6QixFQUFDLG1DQUFELEVBQWlCOztFQUVqQixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7O0lBQ0osTUFBQyxDQUFBLE9BQUQsR0FBVSxTQUFDLEdBQUQ7QUFDUixVQUFBO01BRFUsd0JBQUQsTUFBVzthQUNwQixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQ0FBUDtPQUFMLEVBQThDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUM1QyxLQUFDLENBQUEsS0FBRCxDQUFPLE1BQVAsRUFBZTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sTUFBUDtZQUFlLE1BQUEsRUFBUSxZQUF2QjtXQUFmO1VBQ0EsS0FBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULEVBQXVCLElBQUksY0FBSixDQUFtQjtZQUFBLElBQUEsRUFBTSxJQUFOO1dBQW5CLENBQXZCO1VBQ0EsS0FBQyxDQUFBLEtBQUQsQ0FBTyxzQkFBUCxFQUErQjtZQUFBLEtBQUEsRUFBTyxhQUFQO1dBQS9CO2lCQUNBLEtBQUMsQ0FBQSxLQUFELENBQU8sMkJBQVAsRUFBb0M7WUFBQSxLQUFBLEVBQU8sZ0NBQVA7V0FBcEM7UUFKNEM7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTlDO0lBRFE7O3FCQU9WLFVBQUEsR0FBWSxTQUFDLEdBQUQ7QUFDVixVQUFBOzJCQURXLE1BQXlDLElBQXhDLDRCQUFXLHdDQUFpQjtNQUN4QyxJQUFtQyxTQUFuQztRQUFBLElBQUMsQ0FBQSxVQUFVLENBQUMsUUFBWixDQUFxQixTQUFyQixFQUFBOztNQUNBLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixJQUFDLENBQUEsT0FBbkIsRUFDRTtRQUFBLGNBQUEsRUFBZ0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsU0FBRCxDQUFXLEtBQUMsQ0FBQSxVQUFVLENBQUMsT0FBWixDQUFBLENBQVg7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBaEI7UUFDQSxhQUFBLEVBQWUsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsTUFBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRGY7T0FERjtNQUlBLElBQUEsQ0FBTyxRQUFQO1FBQ0UsSUFBQyxDQUFBLFVBQVUsQ0FBQyxFQUFaLENBQWUsTUFBZixFQUF1QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxLQUFELENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdkIsRUFERjs7TUFHQSxJQUFHLGVBQUg7UUFDRSxJQUFDLENBQUEsVUFBVSxDQUFDLFFBQVosQ0FBQSxDQUFzQixDQUFDLE9BQXZCLENBQStCLGVBQS9CO2VBQ0EsSUFBQyxDQUFBLFVBQVUsQ0FBQyxRQUFaLENBQUEsQ0FBc0IsQ0FBQyxTQUF2QixDQUFBLEVBRkY7O0lBVFU7O3FCQWFaLE1BQUEsR0FBUSxTQUFBO01BQ04sSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWYsQ0FBNkI7UUFBQSxJQUFBLEVBQU0sSUFBSSxDQUFDLE9BQVg7T0FBN0I7TUFDVCxJQUFDLENBQUEsVUFBVSxDQUFDLEtBQVosQ0FBQTthQUNBLElBQUMsQ0FBQSxVQUFVLENBQUMsUUFBWixDQUFBLENBQXNCLENBQUMsc0JBQXZCLENBQUE7SUFITTs7cUJBS1IsS0FBQSxHQUFPLFNBQUE7QUFDTCxVQUFBO01BQUEsY0FBQSxHQUFpQixJQUFDLENBQUE7TUFDbEIsSUFBQyxDQUFBLEtBQUQsR0FBUzs7UUFDVCxjQUFjLENBQUUsT0FBaEIsQ0FBQTs7YUFDQSxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWYsQ0FBQSxDQUE4QixDQUFDLFFBQS9CLENBQUE7SUFKSzs7cUJBTVAsTUFBQSxHQUFRLFNBQUE7YUFDTixJQUFDLENBQUEsS0FBRCxDQUFBO0lBRE07Ozs7S0FoQ1c7QUFIckIiLCJzb3VyY2VzQ29udGVudCI6WyJ7VGV4dEVkaXRvclZpZXcsIFZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIERpYWxvZyBleHRlbmRzIFZpZXdcbiAgQGNvbnRlbnQ6ICh7cHJvbXB0fSA9IHt9KSAtPlxuICAgIEBkaXYgY2xhc3M6ICdwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbC1kaWFsb2cnLCA9PlxuICAgICAgQGxhYmVsIHByb21wdCwgY2xhc3M6ICdpY29uJywgb3V0bGV0OiAncHJvbXB0VGV4dCdcbiAgICAgIEBzdWJ2aWV3ICdtaW5pRWRpdG9yJywgbmV3IFRleHRFZGl0b3JWaWV3KG1pbmk6IHRydWUpXG4gICAgICBAbGFiZWwgJ0VzY2FwZSAoRXNjKSB0byBleGl0Jywgc3R5bGU6ICd3aWR0aDogNTAlOydcbiAgICAgIEBsYWJlbCAnRW50ZXIgKFxcdTIxQjUpIHRvIGNvbmZpcm0nLCBzdHlsZTogJ3dpZHRoOiA1MCU7IHRleHQtYWxpZ246IHJpZ2h0OydcblxuICBpbml0aWFsaXplOiAoe2ljb25DbGFzcywgcGxhY2Vob2xkZXJUZXh0LCBzdGF5T3Blbn0gPSB7fSkgLT5cbiAgICBAcHJvbXB0VGV4dC5hZGRDbGFzcyhpY29uQ2xhc3MpIGlmIGljb25DbGFzc1xuICAgIGF0b20uY29tbWFuZHMuYWRkIEBlbGVtZW50LFxuICAgICAgJ2NvcmU6Y29uZmlybSc6ID0+IEBvbkNvbmZpcm0oQG1pbmlFZGl0b3IuZ2V0VGV4dCgpKVxuICAgICAgJ2NvcmU6Y2FuY2VsJzogPT4gQGNhbmNlbCgpXG5cbiAgICB1bmxlc3Mgc3RheU9wZW5cbiAgICAgIEBtaW5pRWRpdG9yLm9uICdibHVyJywgPT4gQGNsb3NlKClcblxuICAgIGlmIHBsYWNlaG9sZGVyVGV4dFxuICAgICAgQG1pbmlFZGl0b3IuZ2V0TW9kZWwoKS5zZXRUZXh0IHBsYWNlaG9sZGVyVGV4dFxuICAgICAgQG1pbmlFZGl0b3IuZ2V0TW9kZWwoKS5zZWxlY3RBbGwoKVxuXG4gIGF0dGFjaDogLT5cbiAgICBAcGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKGl0ZW06IHRoaXMuZWxlbWVudClcbiAgICBAbWluaUVkaXRvci5mb2N1cygpXG4gICAgQG1pbmlFZGl0b3IuZ2V0TW9kZWwoKS5zY3JvbGxUb0N1cnNvclBvc2l0aW9uKClcblxuICBjbG9zZTogLT5cbiAgICBwYW5lbFRvRGVzdHJveSA9IEBwYW5lbFxuICAgIEBwYW5lbCA9IG51bGxcbiAgICBwYW5lbFRvRGVzdHJveT8uZGVzdHJveSgpXG4gICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlKClcblxuICBjYW5jZWw6IC0+XG4gICAgQGNsb3NlKClcbiJdfQ==
