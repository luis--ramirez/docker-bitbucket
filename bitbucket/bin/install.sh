#!/usr/bin/env bash

# Installs a file $1 to location $2, and if -o owner is specified performs the action as the specified owner.
# This ensures that the file is installed with the right owner even on NFS servers that squash "root" access.
# If -o is specified, must be run as root.

while getopts "o:" OPTION; do
     case ${OPTION} in
         o)
             owner=${OPTARG}
             ;;
     esac
done
shift $((${OPTIND} - 1))

if [ -n "${owner}" ]; then
    chmod go+rX "$1"
    su "${owner}" -c "cp -nr \"$1\" \"$2\""
else
    cp -nr "$1" "$2"
fi
