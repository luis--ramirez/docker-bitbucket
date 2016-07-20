#!/usr/bin/env bash

usage()
{
    cat << EOF
    usage: $0 options

    Queries for a username and returns 0 if the user was found

    OPTIONS:
       -h              Show this message
       -u username     A Linux username
EOF
}

username=

while getopts "hu:" OPTION
do
     case $OPTION in
         h)
             usage
             exit 0
             ;;
         u)
             username=$OPTARG
             ;;
     esac
done

if [[ -z "$username" ]]
then
    usage
    exit 1
fi

if id $username>/dev/null 2>&1
then
    exit 0
else
    exit 1
fi
