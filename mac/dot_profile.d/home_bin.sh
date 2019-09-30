# prepend ~/bin to PATH
DEDUPLICATED_ORDER_PRESERVED_PATH="$(perl -e 'print join(":", grep { not $seen{$_}++ } split(/:/, $ENV{PATH}))')"
export PATH=~/bin:$DEDUPLICATED_ORDER_PRESERVED_PATH
