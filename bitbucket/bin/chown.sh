#!/usr/bin/env bash

if [ "$1" != "$(ls -ld "$2" | awk '{print $3}')" ]; then
    chown -R -H -L "$1:$1" "$2"
fi
