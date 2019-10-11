

if [ -e /usr/local/opt/sqlite ]; then
    export PATH="/usr/local/opt/sqlite/bin:$PATH"
    # Brew requests for SQLLITE
    export LDFLAGS="-L/usr/local/opt/sqlite/lib"
    export CPPFLAGS="-I/usr/local/opt/sqlite/include"
    export PKG_CONFIG_PATH="/usr/local/opt/sqlite/lib/pkgconfig"
fi
