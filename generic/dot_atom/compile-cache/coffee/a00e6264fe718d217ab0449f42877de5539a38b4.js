(function() {
  var Dialog, RenameDialog,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Dialog = require("./dialog");

  module.exports = RenameDialog = (function(superClass) {
    extend(RenameDialog, superClass);

    function RenameDialog(statusIcon) {
      this.statusIcon = statusIcon;
      RenameDialog.__super__.constructor.call(this, {
        prompt: "Rename",
        iconClass: "icon-pencil",
        placeholderText: this.statusIcon.getName()
      });
    }

    RenameDialog.prototype.onConfirm = function(newTitle) {
      this.statusIcon.updateName(newTitle.trim());
      return this.cancel();
    };

    return RenameDialog;

  })(Dialog);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nL2dpdC9wd3lvdW5nL2NvbXB1dGVyLXNldHVwL2dlbmVyaWMvZG90X2F0b20vcGFja2FnZXMvcGxhdGZvcm1pby1pZGUtdGVybWluYWwvbGliL3JlbmFtZS1kaWFsb2cuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxvQkFBQTtJQUFBOzs7RUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0VBRVQsTUFBTSxDQUFDLE9BQVAsR0FDTTs7O0lBQ1Msc0JBQUMsVUFBRDtNQUFDLElBQUMsQ0FBQSxhQUFEO01BQ1osOENBQ0U7UUFBQSxNQUFBLEVBQVEsUUFBUjtRQUNBLFNBQUEsRUFBVyxhQURYO1FBRUEsZUFBQSxFQUFpQixJQUFDLENBQUEsVUFBVSxDQUFDLE9BQVosQ0FBQSxDQUZqQjtPQURGO0lBRFc7OzJCQU1iLFNBQUEsR0FBVyxTQUFDLFFBQUQ7TUFDVCxJQUFDLENBQUEsVUFBVSxDQUFDLFVBQVosQ0FBdUIsUUFBUSxDQUFDLElBQVQsQ0FBQSxDQUF2QjthQUNBLElBQUMsQ0FBQSxNQUFELENBQUE7SUFGUzs7OztLQVBjO0FBSDNCIiwic291cmNlc0NvbnRlbnQiOlsiRGlhbG9nID0gcmVxdWlyZSBcIi4vZGlhbG9nXCJcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUmVuYW1lRGlhbG9nIGV4dGVuZHMgRGlhbG9nXG4gIGNvbnN0cnVjdG9yOiAoQHN0YXR1c0ljb24pIC0+XG4gICAgc3VwZXJcbiAgICAgIHByb21wdDogXCJSZW5hbWVcIlxuICAgICAgaWNvbkNsYXNzOiBcImljb24tcGVuY2lsXCJcbiAgICAgIHBsYWNlaG9sZGVyVGV4dDogQHN0YXR1c0ljb24uZ2V0TmFtZSgpXG5cbiAgb25Db25maXJtOiAobmV3VGl0bGUpIC0+XG4gICAgQHN0YXR1c0ljb24udXBkYXRlTmFtZSBuZXdUaXRsZS50cmltKClcbiAgICBAY2FuY2VsKClcbiJdfQ==
