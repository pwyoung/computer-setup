#!/bin/bash

# Setup Asus Keyboard
# https://gitlab.com/asus-linux/asusctl

function show_usage()
{
    printf "Usage: $0 <command>\n"
    cat <<EOF
    -r|--red
    -h|--help
EOF
  exit 1
}

if [[ $# -lt 1 ]]; then
    show_usage $@
fi

function show_led_help() {
    X="########################################"
    for i in static breathe rainbow stars rain pulse comet flash multi-static multi-breathe; do
        echo "$X"
        echo "asusctl led-mode $i --help"
        echo ""
        asusctl led-mode $i --help
    done
}

function red() {
    asusctl -k low led-mode static -c 990000
}

function blue() {
    asusctl -k low led-mode static -c 000044
}

function stars() {
    asusctl -k low led-mode stars -c ff0000 -C 0000ff -s low
}

while [[ $# -gt 0 ]]; do
    key="$1"

    case $key in
        -H|--show-led-help)
            shift
            show_led_help
            ;;
        -r|--red)
            shift
            red
            ;;
        -b|--blue)
            shift
            blue
            ;;
        -s|--stars)
            shift
            stars
            ;;
        -h|--help)
            show_usage
            ;;
        *)    # unknown option
            POSITIONAL+=("$1") # save it in an array for later
            shift # past argument
            ;;
    esac
done
