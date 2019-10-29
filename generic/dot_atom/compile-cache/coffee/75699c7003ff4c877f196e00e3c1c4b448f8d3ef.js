(function() {
  var CompositeDisposable, _,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore-plus');

  CompositeDisposable = require('atom').CompositeDisposable;

  module.exports = {
    subscriptions: null,
    config: {
      allBundledPackages: {
        order: 1,
        type: 'boolean',
        "default": false
      },
      bundledPackages: {
        order: 2,
        type: 'array',
        "default": [],
        items: {
          type: 'string'
        }
      },
      exceptBundledPackages: {
        order: 3,
        type: 'array',
        "default": [],
        items: {
          type: 'string'
        }
      },
      allCommunityPackages: {
        order: 11,
        type: 'boolean',
        "default": false
      },
      communityPackages: {
        order: 12,
        type: 'array',
        "default": [],
        items: {
          type: 'string'
        }
      },
      exceptCommunityPackages: {
        order: 13,
        type: 'array',
        "default": [],
        items: {
          type: 'string'
        }
      },
      prefixKeys: {
        order: 21,
        type: 'array',
        "default": [],
        items: {
          type: 'string'
        }
      }
    },
    activate: function(state) {
      this.subscriptions = new CompositeDisposable;
      this.disabledPackages = new Set;
      this.disabledKeyBindings = new Set;
      this.debug = atom.inDevMode() && !atom.inSpecMode();
      this.debouncedReload = _.debounce(((function(_this) {
        return function() {
          return _this.reload();
        };
      })(this)), 1000);
      this.subscriptions.add(atom.config.onDidChange('disable-keybindings', this.debouncedReload));
      this.subscriptions.add(atom.packages.onDidActivateInitialPackages((function(_this) {
        return function() {
          return _this.init();
        };
      })(this)));
      return this.subscriptions.add(atom.commands.add('atom-workspace', {
        'disable-keybindings:reload': (function(_this) {
          return function() {
            return _this.reload();
          };
        })(this),
        'disable-keybindings:reset': (function(_this) {
          return function() {
            return _this.reset();
          };
        })(this)
      }));
    },
    deactivate: function() {
      this.subscriptions.dispose();
      return this.reset();
    },
    init: function() {
      this.reload();
      return this.subscriptions.add(atom.packages.onDidLoadPackage((function(_this) {
        return function(pack) {
          return _this.onLoadedPackage(pack);
        };
      })(this)));
    },
    onLoadedPackage: function(pack) {
      var activateResources;
      if (pack.settingsActivated) {
        return this.debouncedReload();
      }
      activateResources = pack.activateResources;
      return pack.activateResources = (function(_this) {
        return function() {
          activateResources.call(pack);
          pack.activateResources = activateResources;
          if (_this.debug) {
            console.log('activateResources', pack);
          }
          return _this.debouncedReload();
        };
      })(this);
    },
    reload: function() {
      var binding, i, len, oldKeyBindings, ref;
      this.reset();
      this.disablePackageKeymaps();
      oldKeyBindings = atom.keymaps.keyBindings.slice();
      this.removeKeymapsByPrefixKey(atom.config.get('disable-keybindings.prefixKeys'));
      ref = _.difference(oldKeyBindings, atom.keymaps.keyBindings);
      for (i = 0, len = ref.length; i < len; i++) {
        binding = ref[i];
        if (this.debug) {
          console.log('disable keyBinding', binding);
        }
        this.disabledKeyBindings.add(binding);
      }
    },
    reset: function() {
      this.disabledPackages.forEach((function(_this) {
        return function(pack) {
          pack.activateKeymaps();
          if (_this.debug) {
            return console.log("enable package keymaps: " + pack.name);
          }
        };
      })(this));
      this.disabledPackages.clear();
      this.disabledKeyBindings.forEach((function(_this) {
        return function(binding) {
          if (indexOf.call(atom.keymaps.keyBindings, binding) < 0) {
            if (_this.debug) {
              console.log('enable keyBinding', binding);
            }
            return atom.keymaps.keyBindings.push(binding);
          }
        };
      })(this));
      return this.disabledKeyBindings.clear();
    },
    disablePackageKeymaps: function() {
      return atom.packages.getLoadedPackages().forEach((function(_this) {
        return function(pack) {
          if (!_this.isDisablePackage(pack.name)) {
            return;
          }
          pack.deactivateKeymaps();
          _this.disabledPackages.add(pack);
          if (_this.debug) {
            return console.log("disable package keymaps: " + pack.name);
          }
        };
      })(this));
    },
    isDisablePackage: function(name) {
      if (atom.packages.isBundledPackage(name)) {
        if (indexOf.call(atom.config.get('disable-keybindings.exceptBundledPackages'), name) >= 0) {
          return false;
        }
        if (atom.config.get('disable-keybindings.allBundledPackages')) {
          return true;
        }
        return indexOf.call(atom.config.get('disable-keybindings.bundledPackages'), name) >= 0;
      } else {
        if (indexOf.call(atom.config.get('disable-keybindings.exceptCommunityPackages'), name) >= 0) {
          return false;
        }
        if (atom.config.get('disable-keybindings.allCommunityPackages')) {
          return true;
        }
        return indexOf.call(atom.config.get('disable-keybindings.communityPackages'), name) >= 0;
      }
    },
    removeKeymapsByPrefixKey: function(prefixKey) {
      var i, k, keystrokesWithSpace, len;
      if (Array.isArray(prefixKey)) {
        for (i = 0, len = prefixKey.length; i < len; i++) {
          k = prefixKey[i];
          this.removeKeymapsByPrefixKey(k);
        }
        return;
      }
      keystrokesWithSpace = prefixKey + ' ';
      return atom.keymaps.keyBindings = atom.keymaps.keyBindings.filter(function(binding) {
        return binding.keystrokes.indexOf(keystrokesWithSpace) !== 0;
      });
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nL2dpdC9wd3lvdW5nL2NvbXB1dGVyLXNldHVwL2dlbmVyaWMvZG90X2F0b20vcGFja2FnZXMvZGlzYWJsZS1rZXliaW5kaW5ncy9saWIvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHNCQUFBO0lBQUE7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSCxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBRXhCLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxhQUFBLEVBQWUsSUFBZjtJQUVBLE1BQUEsRUFDRTtNQUFBLGtCQUFBLEVBQ0U7UUFBQSxLQUFBLEVBQU8sQ0FBUDtRQUNBLElBQUEsRUFBTSxTQUROO1FBRUEsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQUZUO09BREY7TUFLQSxlQUFBLEVBQ0U7UUFBQSxLQUFBLEVBQU8sQ0FBUDtRQUNBLElBQUEsRUFBTSxPQUROO1FBRUEsQ0FBQSxPQUFBLENBQUEsRUFBUyxFQUZUO1FBR0EsS0FBQSxFQUNFO1VBQUEsSUFBQSxFQUFNLFFBQU47U0FKRjtPQU5GO01BWUEscUJBQUEsRUFDRTtRQUFBLEtBQUEsRUFBTyxDQUFQO1FBQ0EsSUFBQSxFQUFNLE9BRE47UUFFQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEVBRlQ7UUFHQSxLQUFBLEVBQ0U7VUFBQSxJQUFBLEVBQU0sUUFBTjtTQUpGO09BYkY7TUFtQkEsb0JBQUEsRUFDRTtRQUFBLEtBQUEsRUFBTyxFQUFQO1FBQ0EsSUFBQSxFQUFNLFNBRE47UUFFQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBRlQ7T0FwQkY7TUF3QkEsaUJBQUEsRUFDRTtRQUFBLEtBQUEsRUFBTyxFQUFQO1FBQ0EsSUFBQSxFQUFNLE9BRE47UUFFQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEVBRlQ7UUFHQSxLQUFBLEVBQ0U7VUFBQSxJQUFBLEVBQU0sUUFBTjtTQUpGO09B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Z0IscUNBQWhCLENBQVIsRUFBQSxJQUFBLE9BSFQ7T0FBQSxNQUFBO1FBS0UsSUFBZ0IsYUFBUSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsNkNBQWhCLENBQVIsRUFBQSxJQUFBLE1BQWhCO0FBQUEsaUJBQU8sTUFBUDs7UUFDQSxJQUFlLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiwwQ0FBaEIsQ0FBZjtBQUFBLGlCQUFPLEtBQVA7O0FBQ0EsZUFBTyxhQUFRLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQix1Q0FBaEIsQ0FBUixFQUFBLElBQUEsT0FQVDs7SUFEZ0IsQ0FySGxCO0lBK0hBLHdCQUFBLEVBQTBCLFNBQUMsU0FBRDtBQUN4QixVQUFBO01BQUEsSUFBRyxLQUFLLENBQUMsT0FBTixDQUFjLFNBQWQsQ0FBSDtBQUNFLGFBQUEsMkNBQUE7O1VBQUEsSUFBQyxDQUFBLHdCQUFELENBQTBCLENBQTFCO0FBQUE7QUFDQSxlQUZGOztNQUlBLG1CQUFBLEdBQXNCLFNBQUEsR0FBWTthQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQWIsR0FBMkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsTUFBekIsQ0FBZ0MsU0FBQyxPQUFEO2VBQ3pELE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBbkIsQ0FBMkIsbUJBQTNCLENBQUEsS0FBcUQ7TUFESSxDQUFoQztJQU5ILENBL0gxQjs7QUFKRiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIHN1YnNjcmlwdGlvbnM6IG51bGxcblxuICBjb25maWc6XG4gICAgYWxsQnVuZGxlZFBhY2thZ2VzOlxuICAgICAgb3JkZXI6IDFcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogZmFsc2VcblxuICAgIGJ1bmRsZWRQYWNrYWdlczpcbiAgICAgIG9yZGVyOiAyXG4gICAgICB0eXBlOiAnYXJyYXknXG4gICAgICBkZWZhdWx0OiBbXVxuICAgICAgaXRlbXM6XG4gICAgICAgIHR5cGU6ICdzdHJpbmcnXG5cbiAgICBleGNlcHRCdW5kbGVkUGFja2FnZXM6XG4gICAgICBvcmRlcjogM1xuICAgICAgdHlwZTogJ2FycmF5J1xuICAgICAgZGVmYXVsdDogW11cbiAgICAgIGl0ZW1zOlxuICAgICAgICB0eXBlOiAnc3RyaW5nJ1xuXG4gICAgYWxsQ29tbXVuaXR5UGFja2FnZXM6XG4gICAgICBvcmRlcjogMTFcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogZmFsc2VcblxuICAgIGNvbW11bml0eVBhY2thZ2VzOlxuICAgICAgb3JkZXI6IDEyXG4gICAgICB0eXBlOiAnYXJyYXknXG4gICAgICBkZWZhdWx0OiBbXVxuICAgICAgaXRlbXM6XG4gICAgICAgIHR5cGU6ICdzdHJpbmcnXG5cbiAgICBleGNlcHRDb21tdW5pdHlQYWNrYWdlczpcbiAgICAgIG9yZGVyOiAxM1xuICAgICAgdHlwZTogJ2FycmF5J1xuICAgICAgZGVmYXVsdDogW11cbiAgICAgIGl0ZW1zOlxuICAgICAgICB0eXBlOiAnc3RyaW5nJ1xuXG4gICAgcHJlZml4S2V5czpcbiAgICAgIG9yZGVyOiAyMVxuICAgICAgdHlwZTogJ2FycmF5J1xuICAgICAgZGVmYXVsdDogW11cbiAgICAgIGl0ZW1zOlxuICAgICAgICB0eXBlOiAnc3RyaW5nJ1xuXG4gIGFjdGl2YXRlOiAoc3RhdGUpIC0+XG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBkaXNhYmxlZFBhY2thZ2VzID0gbmV3IFNldFxuICAgIEBkaXNhYmxlZEtleUJpbmRpbmdzID0gbmV3IFNldFxuICAgIEBkZWJ1ZyA9IGF0b20uaW5EZXZNb2RlKCkgYW5kIG5vdCBhdG9tLmluU3BlY01vZGUoKVxuXG4gICAgQGRlYm91bmNlZFJlbG9hZCA9IF8uZGVib3VuY2UoKD0+IEByZWxvYWQoKSksIDEwMDApXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9uRGlkQ2hhbmdlKCdkaXNhYmxlLWtleWJpbmRpbmdzJywgQGRlYm91bmNlZFJlbG9hZCkpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5wYWNrYWdlcy5vbkRpZEFjdGl2YXRlSW5pdGlhbFBhY2thZ2VzKCA9PiBAaW5pdCgpKSlcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCB7XG4gICAgICAnZGlzYWJsZS1rZXliaW5kaW5nczpyZWxvYWQnOiA9PiBAcmVsb2FkKCksXG4gICAgICAnZGlzYWJsZS1rZXliaW5kaW5nczpyZXNldCc6ID0+IEByZXNldCgpLFxuICAgIH0pKVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgQHJlc2V0KClcblxuICBpbml0OiAtPlxuICAgIEByZWxvYWQoKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZChhdG9tLnBhY2thZ2VzLm9uRGlkTG9hZFBhY2thZ2UoKHBhY2spID0+IEBvbkxvYWRlZFBhY2thZ2UocGFjaykpKVxuXG4gICMgbmVlZCB1cGRhdGUtcGFja2FnZVxuICBvbkxvYWRlZFBhY2thZ2U6IChwYWNrKSAtPlxuICAgIHJldHVybiBAZGVib3VuY2VkUmVsb2FkKCkgaWYgcGFjay5zZXR0aW5nc0FjdGl2YXRlZFxuXG4gICAgYWN0aXZhdGVSZXNvdXJjZXMgPSBwYWNrLmFjdGl2YXRlUmVzb3VyY2VzXG4gICAgcGFjay5hY3RpdmF0ZVJlc291cmNlcyA9ID0+XG4gICAgICBhY3RpdmF0ZVJlc291cmNlcy5jYWxsKHBhY2spXG4gICAgICBwYWNrLmFjdGl2YXRlUmVzb3VyY2VzID0gYWN0aXZhdGVSZXNvdXJjZXNcbiAgICAgIGNvbnNvbGUubG9nICdhY3RpdmF0ZVJlc291cmNlcycsIHBhY2sgaWYgQGRlYnVnXG4gICAgICBAZGVib3VuY2VkUmVsb2FkKClcblxuICByZWxvYWQ6IC0+XG4gICAgQHJlc2V0KClcbiAgICBAZGlzYWJsZVBhY2thZ2VLZXltYXBzKClcblxuICAgIG9sZEtleUJpbmRpbmdzID0gYXRvbS5rZXltYXBzLmtleUJpbmRpbmdzLnNsaWNlKClcbiAgICBAcmVtb3ZlS2V5bWFwc0J5UHJlZml4S2V5KGF0b20uY29uZmlnLmdldCgnZGlzYWJsZS1rZXliaW5kaW5ncy5wcmVmaXhLZXlzJykpXG5cbiAgICBmb3IgYmluZGluZyBpbiBfLmRpZmZlcmVuY2Uob2xkS2V5QmluZGluZ3MsIGF0b20ua2V5bWFwcy5rZXlCaW5kaW5ncylcbiAgICAgIGNvbnNvbGUubG9nICdkaXNhYmxlIGtleUJpbmRpbmcnLCBiaW5kaW5nIGlmIEBkZWJ1Z1xuICAgICAgQGRpc2FibGVkS2V5QmluZGluZ3MuYWRkKGJpbmRpbmcpXG4gICAgcmV0dXJuXG5cbiAgcmVzZXQ6IC0+XG4gICAgQGRpc2FibGVkUGFja2FnZXMuZm9yRWFjaCgocGFjaykgPT5cbiAgICAgIHBhY2suYWN0aXZhdGVLZXltYXBzKClcbiAgICAgIGNvbnNvbGUubG9nIFwiZW5hYmxlIHBhY2thZ2Uga2V5bWFwczogI3twYWNrLm5hbWV9XCIgaWYgQGRlYnVnXG4gICAgKVxuICAgIEBkaXNhYmxlZFBhY2thZ2VzLmNsZWFyKClcblxuICAgIEBkaXNhYmxlZEtleUJpbmRpbmdzLmZvckVhY2goKGJpbmRpbmcpID0+XG4gICAgICBpZiBiaW5kaW5nIG5vdCBpbiBhdG9tLmtleW1hcHMua2V5QmluZGluZ3NcbiAgICAgICAgY29uc29sZS5sb2cgJ2VuYWJsZSBrZXlCaW5kaW5nJywgYmluZGluZyBpZiBAZGVidWdcbiAgICAgICAgYXRvbS5rZXltYXBzLmtleUJpbmRpbmdzLnB1c2goYmluZGluZylcbiAgICApXG4gICAgQGRpc2FibGVkS2V5QmluZGluZ3MuY2xlYXIoKVxuXG4gIGRpc2FibGVQYWNrYWdlS2V5bWFwczogLT5cbiAgICBhdG9tLnBhY2thZ2VzLmdldExvYWRlZFBhY2thZ2VzKCkuZm9yRWFjaCgocGFjaykgPT5cbiAgICAgIHJldHVybiB1bmxlc3MgQGlzRGlzYWJsZVBhY2thZ2UocGFjay5uYW1lKVxuICAgICAgcGFjay5kZWFjdGl2YXRlS2V5bWFwcygpXG4gICAgICBAZGlzYWJsZWRQYWNrYWdlcy5hZGQocGFjaylcbiAgICAgIGNvbnNvbGUubG9nIFwiZGlzYWJsZSBwYWNrYWdlIGtleW1hcHM6ICN7cGFjay5uYW1lfVwiIGlmIEBkZWJ1Z1xuICAgIClcblxuICBpc0Rpc2FibGVQYWNrYWdlOiAobmFtZSkgLT5cbiAgICBpZiBhdG9tLnBhY2thZ2VzLmlzQnVuZGxlZFBhY2thZ2UobmFtZSlcbiAgICAgIHJldHVybiBmYWxzZSBpZiBuYW1lIGluIGF0b20uY29uZmlnLmdldCgnZGlzYWJsZS1rZXliaW5kaW5ncy5leGNlcHRCdW5kbGVkUGFja2FnZXMnKVxuICAgICAgcmV0dXJuIHRydWUgaWYgYXRvbS5jb25maWcuZ2V0KCdkaXNhYmxlLWtleWJpbmRpbmdzLmFsbEJ1bmRsZWRQYWNrYWdlcycpXG4gICAgICByZXR1cm4gbmFtZSBpbiBhdG9tLmNvbmZpZy5nZXQoJ2Rpc2FibGUta2V5YmluZGluZ3MuYnVuZGxlZFBhY2thZ2VzJylcbiAgICBlbHNlXG4gICAgICByZXR1cm4gZmFsc2UgaWYgbmFtZSBpbiBhdG9tLmNvbmZpZy5nZXQoJ2Rpc2FibGUta2V5YmluZGluZ3MuZXhjZXB0Q29tbXVuaXR5UGFja2FnZXMnKVxuICAgICAgcmV0dXJuIHRydWUgaWYgYXRvbS5jb25maWcuZ2V0KCdkaXNhYmxlLWtleWJpbmRpbmdzLmFsbENvbW11bml0eVBhY2thZ2VzJylcbiAgICAgIHJldHVybiBuYW1lIGluIGF0b20uY29uZmlnLmdldCgnZGlzYWJsZS1rZXliaW5kaW5ncy5jb21tdW5pdHlQYWNrYWdlcycpXG5cbiAgcmVtb3ZlS2V5bWFwc0J5UHJlZml4S2V5OiAocHJlZml4S2V5KSAtPlxuICAgIGlmIEFycmF5LmlzQXJyYXkocHJlZml4S2V5KVxuICAgICAgQHJlbW92ZUtleW1hcHNCeVByZWZpeEtleShrKSBmb3IgayBpbiBwcmVmaXhLZXlcbiAgICAgIHJldHVyblxuXG4gICAga2V5c3Ryb2tlc1dpdGhTcGFjZSA9IHByZWZpeEtleSArICcgJ1xuICAgIGF0b20ua2V5bWFwcy5rZXlCaW5kaW5ncyA9IGF0b20ua2V5bWFwcy5rZXlCaW5kaW5ncy5maWx0ZXIoKGJpbmRpbmcpIC0+XG4gICAgICBiaW5kaW5nLmtleXN0cm9rZXMuaW5kZXhPZihrZXlzdHJva2VzV2l0aFNwYWNlKSBpc250IDBcbiAgICApXG4iXX0=
