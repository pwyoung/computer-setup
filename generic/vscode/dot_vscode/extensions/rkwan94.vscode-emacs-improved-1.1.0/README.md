# vscode-emacs-improved

This project is a fork of the popular [Emacs Keymap](https://marketplace.visualstudio.com/items?itemName=hiro-sun.vscode-emacs) by hiro-sun. That project is no longer active and my goal was to add meaningful additions to the project to make this extension behave more like an emacs **emulator**, instead of just a keymapper.

## My improvements on the original project

**S-expressions** was the first major addition I made. This extensnion allows movement via s-expressions, and killing s-expressions. This is most effective when editing `.lisp` files or any LISP dialect like Clojure. Experience with other languages may vary.

**Proper kill-ring**: the support for kill-rings in hiro-sun's was inconsistent with the original emacs spec for the kill-ring. The kill-ring implemented in my extensnion can store the last 60 kills added to the ring. Yank-pop is also fully supported.

**CUA Mode**: this minor mode allows users to keep their traditional copy paste shortcuts on windows (`C-c` and `C-v`). Note that as per the spec for CUA mode, these clipboard actions are only available when a region is highlighted. Note that `C-x` for cut is **not** supported. This is because VSCode won't recognise `C-x` as it is the beginning of a chord (if this is wrong, feel free to make an issue on the github page).

**Rectangle mode**: though skeleton code exists on hiro-sun's to support rectangle mode, it was not finished. I've built on top of this solution and have implemented rectangle-kill and rectangle-yank.

## Commands

### Move command

|Command | Status | Desc |
|--------|--------|------|
| `C-f` | OK | Move forward |
| `C-b` | OK | Move backward |
| `C-n` | OK | Move to the next line |
| `C-p` | OK | Move to the previous line |
| `C-a` | OK | Move to the beginning of line |
| `C-e` | OK | Move to the end of line |
| `M-f` | OK | Move forward by one word unit |
| `M-b` | OK | Move backward by one word unit |
| `M->` | OK | Move to the end of buffer |
| `M-<` | OK | Move to the beginning of buffer |
| `C-v` | OK | Scroll down by one screen unit |
| `M-v` | OK | Scroll up by one screen unit |
| `C-x C-n` | - | Set goal column |
| `C-u C-x C-n` | - | Deactivate C-x C-n |
| `M-g g` | OK | Jump to line (command palette) |

### Search Command

|Command | Status | Desc |
|--------|--------|------|
| `C-s` | OK | Search forward |
| `C-r` | OK | Search backward |
| `C-M-n` | OK | Add selection to next find match |
| `C-l` | - | Use `ext install keyboard-scroll` to activate |

### Edit command

|Command | Status | Desc |
|--------|--------|------|
| `C-d` | OK | Delete right (DEL) |
| `C-h` | OK | Delete left (BACKSPACE) |
| `M-d` | OK | Delete word |
| `kill` | OK | Kill to line end |
| `C-w` | OK | Kill region |
| `M-w` | OK | Copy region to kill ring |
| `C-y` | OK | Yank |
| `C-j` | OK | Line Feed |
| `C-m` | - | Carriage Return |
| `C-i` | - | Horizontal Tab |
| `C-x C-o` | OK | Delete blank lines around |
| `C-x h` | OK | Select All |
| `C-x u` (`undo`)| OK | Undo |
| `C-;` | △ | Toggle line comment in and out |
| `M-;` | △ | Toggle region comment in and out |

### Other Command

|Command | Status | Desc |
|--------|--------|------|
| `abortCommand` | OK | Cancel |
| `C-space` | OK | Set mark |
| `C-\` | - | IME control |
| `C-quote` | OK | IntelliSense Suggestion |
| `C-doublequote` | △ | IntelliSense Parameter Hint |
| `M-x` | OK | Open command palette |
| `M-/(dabbrev)` | - | Auto-completion |
| `M-num command` | - | Repeat command `num` times |
| `C-M-SPC` | OK | Toggle SideBar visibility |

### File Command

|Command | Status | Desc |
|--------|--------|------|
| `C-o` | OK | Open a file |
| `C-x b` | OK | QuickOpen a file |
| `C-x C-f` | OK | Open a working directory |
| `C-x C-s` | OK | Save |
| `C-x C-w` | OK | Save as |
| `C-x i` | - | Insert buffer from file |
| `C-x C-d` | - | Open Folder |
| `C-x C-n` | - | Open new window |
| `C-x C-b` | - | Create new file and open |

## Conflicts with default key bindings

- `ctrl+d`: editor.action.addSelectionToNextFindMatch => **Use `ctrl+alt+n` instead**;
- `ctrl+g`: workbench.action.gotoLine => **Use `alt+g g` instead**;
- `ctrl+b`: workbench.action.toggleSidebarVisibility => **Use `ctrl+alt+space` instead**;
- `ctrl+space`: toggleSuggestionDetails, editor.action.triggerSuggest => **Use `ctrl+'` instead**;
- `ctrl+x`: editor.action.clipboardCutAction => **Use `shift+delete` instead**;
- `ctrl+k`: editor.debug.action.showDebugHover, editor.action.trimTrailingWhitespace, editor.action.showHover, editor.action.removeCommentLine, editor.action.addCommentLine, editor.action.openDeclarationToTheSide;
- `ctrl+y`: redo;
- `ctrl+m`: editor.action.toggleTabFocusMode;
- `ctrl+/`: editor.action.commentLine => **Use `ctrl+;` instead**;
- `ctrl+p` & `ctrl+e`: workbench.action.quickOpen => **Use `ctrl+x b` instead**;
- `ctrl+p`: workbench.action.quickOpenNavigateNext => **Use `ctrl+n` instead**.
