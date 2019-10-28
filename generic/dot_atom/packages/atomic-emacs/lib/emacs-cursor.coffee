KillRing = require './kill-ring'
Mark = require './mark'
Utils = require './utils'
{CompositeDisposable} = require 'atom'

OPENERS = {'(': ')', '[': ']', '{': '}', '\'': '\'', '"': '"', '`': '`'}
CLOSERS = {')': '(', ']': '[', '}': '{', '\'': '\'', '"': '"', '`': '`'}

module.exports =
class EmacsCursor
  @for: (emacsEditor, cursor) ->
    cursor._atomicEmacs ?= new EmacsCursor(emacsEditor, cursor)

  constructor: (@emacsEditor, @cursor) ->
    @editor = @cursor.editor
    @_mark = null
    @_localKillRing = null
    @_yankMarker = null
    @_disposable = @cursor.onDidDestroy => @destroy()

  mark: ->
    @_mark ?= new Mark(@cursor)

  killRing: ->
    if @editor.hasMultipleCursors()
      @getLocalKillRing()
    else
      KillRing.global

  getLocalKillRing: ->
    @_localKillRing ?= KillRing.global.fork()

  clearLocalKillRing: ->
    @_localKillRing = null

  destroy: ->
    @clearLocalKillRing()
    @_disposable.dispose()
    @_disposable = null
    @_yankMarker?.destroy()
    @_mark?.destroy()
    delete @cursor._atomicEmacs

  # Look for the previous occurrence of the given regexp.
  #
  # Return a Range if found, null otherwise. This does not move the cursor.
  locateBackward: (regExp) ->
    @emacsEditor.locateBackwardFrom(@cursor.getBufferPosition(), regExp)

  # Look for the next occurrence of the given regexp.
  #
  # Return a Range if found, null otherwise. This does not move the cursor.
  locateForward: (regExp) ->
    @emacsEditor.locateForwardFrom(@cursor.getBufferPosition(), regExp)

  # Look for the previous word character.
  #
  # Return a Range if found, null otherwise. This does not move the cursor.
  locateWordCharacterBackward: ->
    @locateBackward @_getWordCharacterRegExp()

  # Look for the next word character.
  #
  # Return a Range if found, null otherwise. This does not move the cursor.
  locateWordCharacterForward: ->
    @locateForward @_getWordCharacterRegExp()

  # Look for the previous nonword character.
  #
  # Return a Range if found, null otherwise. This does not move the cursor.
  locateNonWordCharacterBackward: ->
    @locateBackward @_getNonWordCharacterRegExp()

  # Look for the next nonword character.
  #
  # Return a Range if found, null otherwise. This does not move the cursor.
  locateNonWordCharacterForward: ->
    @locateForward @_getNonWordCharacterRegExp()

  # Move to the start of the previous occurrence of the given regexp.
  #
  # Return true if found, false otherwise.
  goToMatchStartBackward: (regExp) ->
    @_goTo @locateBackward(regExp)?.start

  # Move to the start of the next occurrence of the given regexp.
  #
  # Return true if found, false otherwise.
  goToMatchStartForward: (regExp) ->
    @_goTo @locateForward(regExp)?.start

  # Move to the end of the previous occurrence of the given regexp.
  #
  # Return true if found, false otherwise.
  goToMatchEndBackward: (regExp) ->
    @_goTo @locateBackward(regExp)?.end

  # Move to the end of the next occurrence of the given regexp.
  #
  # Return true if found, false otherwise.
  goToMatchEndForward: (regExp) ->
    @_goTo @locateForward(regExp)?.end

  # Skip backwards over the given characters.
  #
  # If the end of the buffer is reached, remain there.
  skipCharactersBackward: (characters) ->
    regexp = new RegExp("[^#{Utils.escapeForRegExp(characters)}]")
    @skipBackwardUntil(regexp)

  # Skip forwards over the given characters.
  #
  # If the end of the buffer is reached, remain there.
  skipCharactersForward: (characters) ->
    regexp = new RegExp("[^#{Utils.escapeForRegExp(characters)}]")
    @skipForwardUntil(regexp)

  # Skip backwards over any word characters.
  #
  # If the beginning of the buffer is reached, remain there.
  skipWordCharactersBackward: ->
    @skipBackwardUntil(@_getNonWordCharacterRegExp())

  # Skip forwards over any word characters.
  #
  # If the end of the buffer is reached, remain there.
  skipWordCharactersForward: ->
    @skipForwardUntil(@_getNonWordCharacterRegExp())

  # Skip backwards over any non-word characters.
  #
  # If the beginning of the buffer is reached, remain there.
  skipNonWordCharactersBackward: ->
    @skipBackwardUntil(@_getWordCharacterRegExp())

  # Skip forwards over any non-word characters.
  #
  # If the end of the buffer is reached, remain there.
  skipNonWordCharactersForward: ->
    @skipForwardUntil(@_getWordCharacterRegExp())

  # Skip over characters until the previous occurrence of the given regexp.
  #
  # If the beginning of the buffer is reached, remain there.
  skipBackwardUntil: (regexp) ->
    if not @goToMatchEndBackward(regexp)
      @_goTo Utils.BOB

  # Skip over characters until the next occurrence of the given regexp.
  #
  # If the end of the buffer is reached, remain there.
  skipForwardUntil: (regexp) ->
    if not @goToMatchStartForward(regexp)
      @_goTo @editor.getEofBufferPosition()

  # Insert the given text after this cursor.
  insertAfter: (text) ->
    position = @cursor.getBufferPosition()
    @editor.setTextInBufferRange([position, position], "\n")
    @cursor.setBufferPosition(position)

  horizontalSpaceRange: ->
    @skipCharactersBackward(' \t')
    start = @cursor.getBufferPosition()
    @skipCharactersForward(' \t')
    end = @cursor.getBufferPosition()
    [start, end]

  deleteBlankLines: ->
    eof = @editor.getEofBufferPosition()
    blankLineRe = /^[ \t]*$/

    point = @cursor.getBufferPosition()
    s = e = point.row
    while blankLineRe.test(@cursor.editor.lineTextForBufferRow(e)) and e <= eof.row
      e += 1
    while s > 0 and blankLineRe.test(@cursor.editor.lineTextForBufferRow(s - 1))
      s -= 1

    if s == e
      # No blanks: delete blanks ahead.
      e += 1
      while blankLineRe.test(@cursor.editor.lineTextForBufferRow(e)) and e <= eof.row
        e += 1
      @cursor.editor.setTextInBufferRange([[s + 1, 0], [e, 0]], '')
    else if e == s + 1
      # One blank: delete it.
      @cursor.editor.setTextInBufferRange([[s, 0], [e, 0]], '')
      @cursor.setBufferPosition([s, 0])
    else
      # Multiple blanks: delete all but one.
      @cursor.editor.setTextInBufferRange([[s, 0], [e, 0]], '\n')
      @cursor.setBufferPosition([s, 0])

  transformWord: (transformer) ->
    @skipNonWordCharactersForward()
    start = @cursor.getBufferPosition()
    @skipWordCharactersForward()
    end = @cursor.getBufferPosition()
    range = [start, end]
    text = @editor.getTextInBufferRange(range)
    @editor.setTextInBufferRange(range, transformer(text))

  backwardKillWord: (method) ->
    @_killUnit method, =>
      end = @cursor.getBufferPosition()
      @skipNonWordCharactersBackward()
      @skipWordCharactersBackward()
      start = @cursor.getBufferPosition()
      [start, end]

  killWord: (method) ->
    @_killUnit method, =>
      start = @cursor.getBufferPosition()
      @skipNonWordCharactersForward()
      @skipWordCharactersForward()
      end = @cursor.getBufferPosition()
      [start, end]

  killLine: (method) ->
    @_killUnit method, =>
      start = @cursor.getBufferPosition()
      line = @editor.lineTextForBufferRow(start.row)
      if start.column == 0 and atom.config.get("atomic-emacs.killWholeLine")
          end = [start.row + 1, 0]
      else
        if /^\s*$/.test(line.slice(start.column))
          end = [start.row + 1, 0]
        else
          end = [start.row, line.length]
      [start, end]

  killRegion: (method) ->
    @_killUnit method, =>
      position = @cursor.selection.getBufferRange()
      [position, position]

  _killUnit: (method='push', findRange) ->
    if @cursor.selection? and not @cursor.selection.isEmpty()
      range = @cursor.selection.getBufferRange()
      @cursor.selection.clear()
    else
      range = findRange()

    text = @editor.getTextInBufferRange(range)
    @editor.setTextInBufferRange(range, '')
    killRing = @killRing()
    killRing[method](text)
    killRing.getCurrentEntry()

  yank: ->
    killRing = @killRing()
    return if killRing.isEmpty()
    if @cursor.selection
      range = @cursor.selection.getBufferRange()
      @cursor.selection.clear()
    else
      position = @cursor.getBufferPosition()
      range = [position, position]
    newRange = @editor.setTextInBufferRange(range, killRing.getCurrentEntry())
    @cursor.setBufferPosition(newRange.end)
    @_yankMarker ?= @editor.markBufferPosition(@cursor.getBufferPosition())
    @_yankMarker.setBufferRange(newRange)

  rotateYank: (n) ->
    return if @_yankMarker == null
    entry = @killRing().rotate(n)
    unless entry is null
      range = @editor.setTextInBufferRange(@_yankMarker.getBufferRange(), entry)
      @_yankMarker.setBufferRange(range)

  yankComplete: ->
    @_yankMarker?.destroy()
    @_yankMarker = null

  nextCharacter: ->
    @emacsEditor.characterAfter(@cursor.getBufferPosition())

  # Skip to the end of the current or next symbolic expression.
  skipSexpForward: ->
    point = @cursor.getBufferPosition()
    target = @_sexpForwardFrom(point)
    @cursor.setBufferPosition(target)

  # Skip to the beginning of the current or previous symbolic expression.
  skipSexpBackward: ->
    point = @cursor.getBufferPosition()
    target = @_sexpBackwardFrom(point)
    @cursor.setBufferPosition(target)

  # Skip to the end of the current or next list.
  skipListForward: ->
    point = @cursor.getBufferPosition()
    target = @_listForwardFrom(point)
    @cursor.setBufferPosition(target) if target

  # Skip to the beginning of the current or previous list.
  skipListBackward: ->
    point = @cursor.getBufferPosition()
    target = @_listBackwardFrom(point)
    @cursor.setBufferPosition(target) if target

  # Add the next sexp to the cursor's selection. Activate if necessary.
  markSexp: ->
    range = @cursor.getMarker().getBufferRange()
    newTail = @_sexpForwardFrom(range.end)
    mark = @mark().set(newTail)
    mark.activate() unless mark.isActive()

  # Transpose the two characters around the cursor. At the beginning of a line,
  # transpose the newline with the first character of the line. At the end of a
  # line, transpose the last two characters. At the beginning of the buffer, do
  # nothing. Weird, but that's Emacs!
  transposeChars: ->
    {row, column} = @cursor.getBufferPosition()
    return if row == 0 and column == 0

    line = @editor.lineTextForBufferRow(row)
    if column == 0
      previousLine = @editor.lineTextForBufferRow(row - 1)
      pairRange = [[row - 1, previousLine.length], [row, 1]]
    else if column == line.length
      pairRange = [[row, column - 2], [row, column]]
    else
      pairRange = [[row, column - 1], [row, column + 1]]
    pair = @editor.getTextInBufferRange(pairRange)
    @editor.setTextInBufferRange(pairRange, (pair[1] or '') + pair[0])

  # Transpose the word at the cursor with the next one. Move to the end of the
  # next word.
  transposeWords: ->
    @skipNonWordCharactersBackward()

    word1Range = @_wordRange()
    @skipWordCharactersForward()
    @skipNonWordCharactersForward()
    if @editor.getEofBufferPosition().isEqual(@cursor.getBufferPosition())
      # No second word - just go back.
      @skipNonWordCharactersBackward()
    else
      word2Range = @_wordRange()
      @_transposeRanges(word1Range, word2Range)

  # Transpose the sexp at the cursor with the next one. Move to the end of the
  # next sexp.
  transposeSexps: ->
    @skipSexpBackward()
    start1 = @cursor.getBufferPosition()
    @skipSexpForward()
    end1 = @cursor.getBufferPosition()

    @skipSexpForward()
    end2 = @cursor.getBufferPosition()
    @skipSexpBackward()
    start2 = @cursor.getBufferPosition()

    @_transposeRanges([start1, end1], [start2, end2])

  # Transpose the line at the cursor with the one above it. Move to the
  # beginning of the next line.
  transposeLines: ->
    row = @cursor.getBufferRow()
    if row == 0
      @_endLineIfNecessary()
      @cursor.moveDown()
      row += 1
    @_endLineIfNecessary()

    lineRange = [[row, 0], [row + 1, 0]]
    text = @editor.getTextInBufferRange(lineRange)
    @editor.setTextInBufferRange(lineRange, '')
    @editor.setTextInBufferRange([[row - 1, 0], [row - 1, 0]], text)

  _wordRange: ->
    @skipWordCharactersBackward()
    range = @locateNonWordCharacterBackward()
    wordStart = if range then range.end else [0, 0]
    range = @locateNonWordCharacterForward()
    wordEnd = if range then range.start else @editor.getEofBufferPosition()
    [wordStart, wordEnd]

  _endLineIfNecessary: ->
    row = @cursor.getBufferPosition().row
    if row == @editor.getLineCount() - 1
      length = @cursor.getCurrentBufferLine().length
      @editor.setTextInBufferRange([[row, length], [row, length]], "\n")

  _transposeRanges: (range1, range2) ->
    text1 = @editor.getTextInBufferRange(range1)
    text2 = @editor.getTextInBufferRange(range2)

    # Update range2 first so it doesn't change range1.
    @editor.setTextInBufferRange(range2, text1)
    @editor.setTextInBufferRange(range1, text2)
    @cursor.setBufferPosition(range2[1])

  _sexpForwardFrom: (point) ->
    eob = @editor.getEofBufferPosition()
    point = @emacsEditor.locateForwardFrom(point, /[\w()[\]{}'"]/i)?.start or eob
    character = @emacsEditor.characterAfter(point)
    if OPENERS.hasOwnProperty(character) or CLOSERS.hasOwnProperty(character)
      result = null
      stack = []
      quotes = 0
      eof = @editor.getEofBufferPosition()
      re = /[^()[\]{}"'`\\]+|\\.|[()[\]{}"'`]/g
      @editor.scanInBufferRange re, [point, eof], (hit) =>
        if hit.matchText == stack[stack.length - 1]
          stack.pop()
          if stack.length == 0
            result = hit.range.end
            hit.stop()
          else if /^["'`]$/.test(hit.matchText)
            quotes -= 1
        else if (closer = OPENERS[hit.matchText])
          unless /^["'`]$/.test(closer) and quotes > 0
            stack.push(closer)
            quotes += 1 if /^["'`]$/.test(closer)
        else if CLOSERS[hit.matchText]
          if stack.length == 0
            hit.stop()
      result or point
    else
      @emacsEditor.locateForwardFrom(point, /[\W\n]/i)?.start or eob

  _sexpBackwardFrom: (point) ->
    point = @emacsEditor.locateBackwardFrom(point, /[\w()[\]{}'"]/i)?.end or Utils.BOB
    character = @emacsEditor.characterBefore(point)
    if OPENERS.hasOwnProperty(character) or CLOSERS.hasOwnProperty(character)
      result = null
      stack = []
      quotes = 0
      re = /[^()[\]{}"'`\\]+|\\.|[()[\]{}"'`]/g
      @editor.backwardsScanInBufferRange re, [Utils.BOB, point], (hit) =>
        if hit.matchText == stack[stack.length - 1]
          stack.pop()
          if stack.length == 0
            result = hit.range.start
            hit.stop()
          else if /^["'`]$/.test(hit.matchText)
            quotes -= 1
        else if (opener = CLOSERS[hit.matchText])
          unless /^["'`]$/.test(opener) and quotes > 0
            stack.push(opener)
            quotes += 1 if /^["'`]$/.test(opener)
        else if OPENERS[hit.matchText]
          if stack.length == 0
            hit.stop()
      result or point
    else
      @emacsEditor.locateBackwardFrom(point, /[\W\n]/i)?.end or Utils.BOB

  _listForwardFrom: (point) ->
    eob = @editor.getEofBufferPosition()
    if !(match = @emacsEditor.locateForwardFrom(point, /[()[\]{}]/i))
      return null
    end = this._sexpForwardFrom(match.start)
    if end.isEqual(match.start) then null else end

  _listBackwardFrom: (point) ->
    if !(match = @emacsEditor.locateBackwardFrom(point, /[()[\]{}]/i))
      return null
    start = this._sexpBackwardFrom(match.end)
    if start.isEqual(match.end) then null else start

  _getWordCharacterRegExp: ->
    nonWordCharacters = atom.config.get('editor.nonWordCharacters')
    new RegExp('[^\\s' + Utils.escapeForRegExp(nonWordCharacters) + ']')

  _getNonWordCharacterRegExp: ->
    nonWordCharacters = atom.config.get('editor.nonWordCharacters')
    new RegExp('[\\s' + Utils.escapeForRegExp(nonWordCharacters) + ']')

  _goTo: (point) ->
    if point
      @cursor.setBufferPosition(point)
      true
    else
      false
