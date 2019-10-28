#https://www.google.com/search?client=firefox-b-1-d&q=platformio-ide-terminal+hide+keybinding
UIFontSize = 12
atom.commands.add 'atom-workspace',
  'ui:increase-font-size': ->
    UIFontSize += 1
    document.documentElement.style.fontSize = UIFontSize + 'px'
  'ui:decrease-font-size': ->
    UIFontSize -= 1
    document.documentElement.style.fontSize = UIFontSize + 'px'
