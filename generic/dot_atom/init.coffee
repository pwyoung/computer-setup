#https://www.google.com/search?client=firefox-b-1-d&q=platformio-ide-terminal+hide+keybinding
UIFontSize = 12
atom.commands.add 'atom-workspace',
  'ui:increase-font-size': ->
    UIFontSize += 1
    document.documentElement.style.fontSize = UIFontSize + 'px'
  'ui:decrease-font-size': ->
    UIFontSize -= 1
    document.documentElement.style.fontSize = UIFontSize + 'px'


# https://github.com/aki77/atom-emacs-plus/issues/28
atom.keymaps.keyBindings = atom.keymaps.keyBindings.filter (binding, i) ->
  if binding.keystrokes.startsWith 'ctrl-k'
    binding.command.startsWith 'emacs-plus'
  else
    true