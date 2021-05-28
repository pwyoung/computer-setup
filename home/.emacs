;; emacs startup file.

;; References
;;   https://gist.github.com/pvlpenev/079a4ad74111a99bb9ac
;;   https://gist.github.com/rplzzz/11258794

;; uncomment next line to disable loading of "default.el" at startup
;; (setq inhibit-default-init t)

;; add personal load path
(push "~/.emacs.d/lisp" load-path)

;; set up MELPA package archive
(require 'package)
(let* ((no-ssl (and (memq system-type '(windows-nt ms-dos))
                    (not (gnutls-available-p))))
       (proto (if no-ssl "http" "https")))
  ;; Comment/uncomment these two lines to enable/disable MELPA and MELPA Stable as desired
  ;;(add-to-list 'package-archives (cons "melpa" (concat proto "://melpa.org/packages/")) t)
  (add-to-list 'package-archives (cons "melpa-stable" (concat proto "://stable.melpa.org/packages/")) t)
  (when (< emacs-major-version 24)
    ;; For important compatibility libraries like cl-lib
    (add-to-list 'package-archives '("gnu" . (concat proto "://elpa.gnu.org/packages/")))))
(package-initialize)


;; --------------------------------------------------------------------------------
;; GENERIC
;; --------------------------------------------------------------------------------

;; No Splash Screen
(setq inhibit-splash-screen t)

;; Don't ask if we should follow symlinks (in GUI mode)
(setq vc-follow-symlinks nil)

;; show Row and Column
(setq column-number-mode t)

;; F5 -> Compile
;;(global-set-key (kbd "<f5>") 'compile)

;; remove unnecessary GUI elements
(if (fboundp 'menu-bar-mode) (menu-bar-mode -1))
(if (fboundp 'tool-bar-mode) (tool-bar-mode -1))
(if (fboundp 'scroll-bar-mode) (scroll-bar-mode -1))

;; Show matching parentheses
(show-paren-mode 1)

;; Use UTF-8 by default
(set-language-environment "UTF-8")

;; Don't ring the bell.
(setq ring-bell-function 'ignore)

;; --------------------------------------------------------------------------------
;; WHITESPACE AND TABS
;; --------------------------------------------------------------------------------

;; https://www.emacswiki.org/emacs/SmartTabs#Python
(smart-tabs-insinuate 'c 'javascript 'python)

;; Ctrl+T: deletes trailing whitespace
(global-set-key (kbd "C-T") 'delete-trailing-whitespace)

;; Put this last (some things above reset it)
(setq-default show-trailing-whitespace t)

;; --------------------------------------------------------------------------------
;; TODO: Use Tabs only in Makefiles...because we are saddled with them there.
;; Why tabs are bad for programming...
;;   Tabs are useful for e-books, but are confusing and inconsistent with programming
;;   which uses fixed-width fonts for a good reason. The byte-savings is not worth it.
;;   Even the Makefile author admits the tab requirement was a mistake.
;;   YAML and Python spacing is fine by me, but requiring tab consistency is a PITA,
;;   and further evidence that TABs in programming should immediately become 4 spaces.
;; --------------------------------------------------------------------------------
(setq-default indent-tabs-mode nil)
(put 'upcase-region 'disabled nil)
