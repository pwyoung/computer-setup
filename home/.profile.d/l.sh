if uname -a | grep Darwin >/dev/null; then
  alias l='ls -ltrG $@'
else
  alias l='ls --color=auto -ltr $@'
fi

