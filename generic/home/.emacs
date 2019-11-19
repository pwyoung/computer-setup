(setq-default indent-tabs-mode nil)

;; Ctrl+T: deletes trailing whitespace                                                                                                                  
(global-set-key (kbd "C-T") 'delete-trailing-whitespace)


;;  Emacs server
;; 
;;  Ref
;;    https://www.gnu.org/software/emacs/manual/html_node/emacs/Emacs-Server.html
;;  Steps
;;    systemctl --user start emacs
;;    emacsclient /tmp/testfile.txt
;;    systemctl --user enable emacs
;;    systemctl --user status emacs
