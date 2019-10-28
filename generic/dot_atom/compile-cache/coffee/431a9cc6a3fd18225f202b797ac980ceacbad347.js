(function() {
  var _, child, filteredEnvironment, fs, path, pty, systemLanguage;

  pty = require('node-pty-prebuilt-multiarch');

  path = require('path');

  fs = require('fs');

  _ = require('underscore');

  child = require('child_process');

  systemLanguage = (function() {
    var command, language;
    language = "en_US.UTF-8";
    if (process.platform === 'darwin') {
      try {
        command = 'plutil -convert json -o - ~/Library/Preferences/.GlobalPreferences.plist';
        language = (JSON.parse(child.execSync(command).toString()).AppleLocale) + ".UTF-8";
      } catch (error) {}
    }
    return language;
  })();

  filteredEnvironment = (function() {
    var env;
    env = _.omit(process.env, 'ATOM_HOME', 'ELECTRON_RUN_AS_NODE', 'GOOGLE_API_KEY', 'NODE_ENV', 'NODE_PATH', 'userAgent', 'taskPath');
    if (env.LANG == null) {
      env.LANG = systemLanguage;
    }
    env.TERM_PROGRAM = 'platformio-ide-terminal';
    return env;
  })();

  module.exports = function(pwd, shell, args, env, options) {
    var callback, emitTitle, ptyProcess, title;
    if (options == null) {
      options = {};
    }
    callback = this.async();
    if (shell) {
      ptyProcess = pty.fork(shell, args, {
        cwd: pwd,
        env: _.extend(filteredEnvironment, env),
        name: 'xterm-256color'
      });
      title = shell = path.basename(shell);
    } else {
      ptyProcess = pty.open();
    }
    emitTitle = _.throttle(function() {
      return emit('platformio-ide-terminal:title', ptyProcess.process);
    }, 500, true);
    ptyProcess.on('data', function(data) {
      emit('platformio-ide-terminal:data', data);
      return emitTitle();
    });
    ptyProcess.on('exit', function() {
      emit('platformio-ide-terminal:exit');
      return callback();
    });
    return process.on('message', function(arg) {
      var cols, event, ref, rows, text;
      ref = arg != null ? arg : {}, event = ref.event, cols = ref.cols, rows = ref.rows, text = ref.text;
      switch (event) {
        case 'resize':
          return ptyProcess.resize(cols, rows);
        case 'input':
          return ptyProcess.write(text);
        case 'pty':
          return emit('platformio-ide-terminal:pty', ptyProcess.pty);
      }
    });
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvcHlvdW5nL2dpdC9wd3lvdW5nL2NvbXB1dGVyLXNldHVwL2dlbmVyaWMvZG90X2F0b20vcGFja2FnZXMvcGxhdGZvcm1pby1pZGUtdGVybWluYWwvbGliL3Byb2Nlc3MuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxHQUFBLEdBQU0sT0FBQSxDQUFRLDZCQUFSOztFQUNOLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxFQUFBLEdBQUssT0FBQSxDQUFRLElBQVI7O0VBQ0wsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxZQUFSOztFQUNKLEtBQUEsR0FBUSxPQUFBLENBQVEsZUFBUjs7RUFFUixjQUFBLEdBQW9CLENBQUEsU0FBQTtBQUNsQixRQUFBO0lBQUEsUUFBQSxHQUFXO0lBQ1gsSUFBRyxPQUFPLENBQUMsUUFBUixLQUFvQixRQUF2QjtBQUNFO1FBQ0UsT0FBQSxHQUFVO1FBQ1YsUUFBQSxHQUFhLENBQUMsSUFBSSxDQUFDLEtBQUwsQ0FBVyxLQUFLLENBQUMsUUFBTixDQUFlLE9BQWYsQ0FBdUIsQ0FBQyxRQUF4QixDQUFBLENBQVgsQ0FBOEMsQ0FBQyxXQUFoRCxDQUFBLEdBQTRELFNBRjNFO09BQUEsaUJBREY7O0FBSUEsV0FBTztFQU5XLENBQUEsQ0FBSCxDQUFBOztFQVFqQixtQkFBQSxHQUF5QixDQUFBLFNBQUE7QUFDdkIsUUFBQTtJQUFBLEdBQUEsR0FBTSxDQUFDLENBQUMsSUFBRixDQUFPLE9BQU8sQ0FBQyxHQUFmLEVBQW9CLFdBQXBCLEVBQWlDLHNCQUFqQyxFQUF5RCxnQkFBekQsRUFBMkUsVUFBM0UsRUFBdUYsV0FBdkYsRUFBb0csV0FBcEcsRUFBaUgsVUFBakg7O01BQ04sR0FBRyxDQUFDLE9BQVE7O0lBQ1osR0FBRyxDQUFDLFlBQUosR0FBbUI7QUFDbkIsV0FBTztFQUpnQixDQUFBLENBQUgsQ0FBQTs7RUFNdEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIsU0FBQyxHQUFELEVBQU0sS0FBTixFQUFhLElBQWIsRUFBbUIsR0FBbkIsRUFBd0IsT0FBeEI7QUFDZixRQUFBOztNQUR1QyxVQUFROztJQUMvQyxRQUFBLEdBQVcsSUFBQyxDQUFBLEtBQUQsQ0FBQTtJQUVYLElBQUcsS0FBSDtNQUNFLFVBQUEsR0FBYSxHQUFHLENBQUMsSUFBSixDQUFTLEtBQVQsRUFBZ0IsSUFBaEIsRUFDWDtRQUFBLEdBQUEsRUFBSyxHQUFMO1FBQ0EsR0FBQSxFQUFLLENBQUMsQ0FBQyxNQUFGLENBQVMsbUJBQVQsRUFBOEIsR0FBOUIsQ0FETDtRQUVBLElBQUEsRUFBTSxnQkFGTjtPQURXO01BS2IsS0FBQSxHQUFRLEtBQUEsR0FBUSxJQUFJLENBQUMsUUFBTCxDQUFjLEtBQWQsRUFObEI7S0FBQSxNQUFBO01BUUUsVUFBQSxHQUFhLEdBQUcsQ0FBQyxJQUFKLENBQUEsRUFSZjs7SUFVQSxTQUFBLEdBQVksQ0FBQyxDQUFDLFFBQUYsQ0FBVyxTQUFBO2FBQ3JCLElBQUEsQ0FBSywrQkFBTCxFQUFzQyxVQUFVLENBQUMsT0FBakQ7SUFEcUIsQ0FBWCxFQUVWLEdBRlUsRUFFTCxJQUZLO0lBSVosVUFBVSxDQUFDLEVBQVgsQ0FBYyxNQUFkLEVBQXNCLFNBQUMsSUFBRDtNQUNwQixJQUFBLENBQUssOEJBQUwsRUFBcUMsSUFBckM7YUFDQSxTQUFBLENBQUE7SUFGb0IsQ0FBdEI7SUFJQSxVQUFVLENBQUMsRUFBWCxDQUFjLE1BQWQsRUFBc0IsU0FBQTtNQUNwQixJQUFBLENBQUssOEJBQUw7YUFDQSxRQUFBLENBQUE7SUFGb0IsQ0FBdEI7V0FJQSxPQUFPLENBQUMsRUFBUixDQUFXLFNBQVgsRUFBc0IsU0FBQyxHQUFEO0FBQ3BCLFVBQUE7MEJBRHFCLE1BQTBCLElBQXpCLG1CQUFPLGlCQUFNLGlCQUFNO0FBQ3pDLGNBQU8sS0FBUDtBQUFBLGFBQ08sUUFEUDtpQkFDcUIsVUFBVSxDQUFDLE1BQVgsQ0FBa0IsSUFBbEIsRUFBd0IsSUFBeEI7QUFEckIsYUFFTyxPQUZQO2lCQUVvQixVQUFVLENBQUMsS0FBWCxDQUFpQixJQUFqQjtBQUZwQixhQUdPLEtBSFA7aUJBR2tCLElBQUEsQ0FBSyw2QkFBTCxFQUFvQyxVQUFVLENBQUMsR0FBL0M7QUFIbEI7SUFEb0IsQ0FBdEI7RUF6QmU7QUFwQmpCIiwic291cmNlc0NvbnRlbnQiOlsicHR5ID0gcmVxdWlyZSAnbm9kZS1wdHktcHJlYnVpbHQtbXVsdGlhcmNoJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5mcyA9IHJlcXVpcmUgJ2ZzJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUnXG5jaGlsZCA9IHJlcXVpcmUgJ2NoaWxkX3Byb2Nlc3MnXG5cbnN5c3RlbUxhbmd1YWdlID0gZG8gLT5cbiAgbGFuZ3VhZ2UgPSBcImVuX1VTLlVURi04XCJcbiAgaWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnZGFyd2luJ1xuICAgIHRyeVxuICAgICAgY29tbWFuZCA9ICdwbHV0aWwgLWNvbnZlcnQganNvbiAtbyAtIH4vTGlicmFyeS9QcmVmZXJlbmNlcy8uR2xvYmFsUHJlZmVyZW5jZXMucGxpc3QnXG4gICAgICBsYW5ndWFnZSA9IFwiI3tKU09OLnBhcnNlKGNoaWxkLmV4ZWNTeW5jKGNvbW1hbmQpLnRvU3RyaW5nKCkpLkFwcGxlTG9jYWxlfS5VVEYtOFwiXG4gIHJldHVybiBsYW5ndWFnZVxuXG5maWx0ZXJlZEVudmlyb25tZW50ID0gZG8gLT5cbiAgZW52ID0gXy5vbWl0IHByb2Nlc3MuZW52LCAnQVRPTV9IT01FJywgJ0VMRUNUUk9OX1JVTl9BU19OT0RFJywgJ0dPT0dMRV9BUElfS0VZJywgJ05PREVfRU5WJywgJ05PREVfUEFUSCcsICd1c2VyQWdlbnQnLCAndGFza1BhdGgnXG4gIGVudi5MQU5HID89IHN5c3RlbUxhbmd1YWdlXG4gIGVudi5URVJNX1BST0dSQU0gPSAncGxhdGZvcm1pby1pZGUtdGVybWluYWwnXG4gIHJldHVybiBlbnZcblxubW9kdWxlLmV4cG9ydHMgPSAocHdkLCBzaGVsbCwgYXJncywgZW52LCBvcHRpb25zPXt9KSAtPlxuICBjYWxsYmFjayA9IEBhc3luYygpXG5cbiAgaWYgc2hlbGxcbiAgICBwdHlQcm9jZXNzID0gcHR5LmZvcmsgc2hlbGwsIGFyZ3MsXG4gICAgICBjd2Q6IHB3ZCxcbiAgICAgIGVudjogXy5leHRlbmQoZmlsdGVyZWRFbnZpcm9ubWVudCwgZW52KSxcbiAgICAgIG5hbWU6ICd4dGVybS0yNTZjb2xvcidcblxuICAgIHRpdGxlID0gc2hlbGwgPSBwYXRoLmJhc2VuYW1lIHNoZWxsXG4gIGVsc2VcbiAgICBwdHlQcm9jZXNzID0gcHR5Lm9wZW4oKVxuXG4gIGVtaXRUaXRsZSA9IF8udGhyb3R0bGUgLT5cbiAgICBlbWl0KCdwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbDp0aXRsZScsIHB0eVByb2Nlc3MucHJvY2VzcylcbiAgLCA1MDAsIHRydWVcblxuICBwdHlQcm9jZXNzLm9uICdkYXRhJywgKGRhdGEpIC0+XG4gICAgZW1pdCgncGxhdGZvcm1pby1pZGUtdGVybWluYWw6ZGF0YScsIGRhdGEpXG4gICAgZW1pdFRpdGxlKClcblxuICBwdHlQcm9jZXNzLm9uICdleGl0JywgLT5cbiAgICBlbWl0KCdwbGF0Zm9ybWlvLWlkZS10ZXJtaW5hbDpleGl0JylcbiAgICBjYWxsYmFjaygpXG5cbiAgcHJvY2Vzcy5vbiAnbWVzc2FnZScsICh7ZXZlbnQsIGNvbHMsIHJvd3MsIHRleHR9PXt9KSAtPlxuICAgIHN3aXRjaCBldmVudFxuICAgICAgd2hlbiAncmVzaXplJyB0aGVuIHB0eVByb2Nlc3MucmVzaXplKGNvbHMsIHJvd3MpXG4gICAgICB3aGVuICdpbnB1dCcgdGhlbiBwdHlQcm9jZXNzLndyaXRlKHRleHQpXG4gICAgICB3aGVuICdwdHknIHRoZW4gZW1pdCgncGxhdGZvcm1pby1pZGUtdGVybWluYWw6cHR5JywgcHR5UHJvY2Vzcy5wdHkpXG4iXX0=
