;; --------------------------------------------------------------------------------
;; PACKAGE MANAGEMENT
;; --------------------------------------------------------------------------------

(setq package-archives
      '(("melpa" . "http://melpa.milkbox.net/packages/")
        ("gnu" . "http://elpa.gnu.org/packages/")))
(package-initialize)
;; Populate ~/.emacs.d/elpa/archives if uninitialized
(when (not package-archive-contents)
  (package-refresh-contents))

(defconst user-packages
  '(use-package go-mode go-imports flycheck exec-path-from-shell auto-complete go-autocomplete)
  "List of packages to install.")
(dolist (p user-packages)
  (when (not (package-installed-p p))
    (package-refresh-contents)
    (package-install p)))

;; --------------------------------------------------------------------------------
;; GO
;; --------------------------------------------------------------------------------
;;
;; RESOURCES
;;   http://tleyden.github.io/blog/2014/05/22/configure-emacs-as-a-go-editor-from-scratch/

;; go-mode
;; https://github.com/dominikh/go-mode.el

;; flycheck
;; https://www.flycheck.org/en/latest/
;; enable "FlyC" mode
(global-flycheck-mode)

;; godoc
;; Installed exec-path-from-shell
;;
;; This lets godoc find 3rd party docs
(defun set-exec-path-from-shell-PATH ()
  (let ((path-from-shell (replace-regexp-in-string
                          "[ \t\n]*$"
                          ""
                          (shell-command-to-string "$SHELL --login -i -c 'echo $PATH'"))))
    (setenv "PATH" path-from-shell)
    (setq eshell-path-env path-from-shell) ; for eshell users
    (setq exec-path (split-string path-from-shell path-separator))))

(when window-system (set-exec-path-from-shell-PATH))

;; Turn on auto-complete-mode in "Go" Mode
(defun auto-complete-for-go ()
  (auto-complete-mode 1))
(add-hook 'go-mode-hook 'auto-complete-for-go)
;; https://github.com/nsf/gocode/issues/325
(with-eval-after-load 'go-mode
   (require 'go-autocomplete))

(defun test-go-code ()
  (shell-command "go generate && go build -v && go test -v && go vet"))

;; GO HOOKS
;;
;; Go binaries (e.g. gofmt calls goimports)
(add-to-list 'exec-path (expand-file-name "~/go/bin") )
;;
(defun my-go-mode-hook ()
  ;; Use goimports instead of go-fmt
  (setq gofmt-command "goimports")

  ;;  Godef jump key bindings
  (local-set-key (kbd "M-.") 'godef-jump)
  (local-set-key (kbd "M-*") 'pop-tag-mark)
  ;; Also, allow "M-," to return
  (local-unset-key (kbd "M-,"))
  (local-set-key (kbd "M-,") 'pop-tag-mark)

  ;; Customize "compile-command" in "Go" mode
  (if (not (string-match "go" compile-command))
      (set (make-local-variable 'compile-command)
           "go generate && go build -v && go test -v && go vet"))

  ;; Call Gofmt before saving
  (add-hook 'before-save-hook 'gofmt-before-save )

  ;; After saving the file, test it
  (add-hook 'after-save-hook 'test-go-code)

  ;; Go GURU (formerly Oracle)
  (require 'go-guru)

  )
(add-hook 'go-mode-hook 'my-go-mode-hook)

;; --------------------------------------------------------------------------------
;; Generic
;; --------------------------------------------------------------------------------

(use-package prog-mode
  :defer t
  :preface
  (defun my-prog-mode-hook ()
    "Personal prog-mode hook"
    (set-variable 'tab-width 8)
    (setq indent-tabs-mode t)
    (setq show-trailing-whitespace t)
    (turn-on-auto-revert-mode))
  :config
  (add-hook 'prog-mode-hook 'flyspell-prog-mode)
  (add-hook 'prog-mode-hook 'flycheck-mode)
  (add-hook 'prog-mode-hook 'my-prog-mode-hook)
  )

;; Removed
;;   (add-hook 'prog-mode-hook 'rainbow-delimiters-mode)

;; --------------------------------------------------------------------------------
;; MISC
;; --------------------------------------------------------------------------------

;; Prevent Extraneous Tabs
;; Doc: https://www.gnu.org/software/emacs/manual/html_node/eintr/Indent-Tabs-Mode.html
(setq-default indent-tabs-mode nil)

;; Ctrl+T: deletes trailing whitespace
(global-set-key (kbd "C-T") 'delete-trailing-whitespace)

;; No Splash Screen
(setq inhibit-splash-screen t)

;; Don't ask if we should follow symlinks (in GUI mode)
(setq vc-follow-symlinks nil)

;; show Row and Column
(setq column-number-mode t)

;; F5 -> Compile
;;(global-set-key (kbd "<f5>") 'compile)

;; Put this last (some things above reset it)
(setq-default show-trailing-whitespace t)



;; https://stackoverflow.com/questions/5982572/how-to-install-emacs-colortheme
;;   mkdir ~/.emacs.d/themes/
(add-to-list 'custom-theme-load-path "~/.emacs.d/themes/")
;; Theme Gallery
;;   https://pawelbx.github.io/emacs-theme-gallery/
;; Theme
;;   https://github.com/purcell/color-theme-sanityinc-tomorrow
;; Steps
;;   mkdir -p ~/.emacs.d/themes/ && cd $_ && git clone https://github.com/purcell/color-theme-sanityinc-tomorrow
(load-file "~/.emacs.d/themes/color-theme-sanityinc-tomorrow/color-theme-sanityinc-tomorrow.el")
(require 'color-theme-sanityinc-tomorrow)
;;(color-theme-sanityinc-tomorrow-night)
;;(load-theme 'color-theme-sanityinc-tomorrow-night t)
