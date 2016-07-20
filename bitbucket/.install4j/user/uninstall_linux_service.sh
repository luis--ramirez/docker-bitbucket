#!/usr/bin/env bash

usage()
{
    cat << EOF
    usage: $0 options

    Uninstalls a linux service.

    OPTIONS:
       -h                   Show this message
       -s service name      Service name to uninstall
       -u                   uninstall
EOF
}

service=
uninstall=0

while getopts "hs:u" OPTION
do
     case $OPTION in
         h)
             usage
             exit 0
             ;;
         s)
             service=$OPTARG
             ;;
         u)
             uninstall=1
             ;;
     esac
done

if [[ -z "$service" && $uninstall -eq 1 ]]
then
    usage
    exit 1
fi

if [[ $uninstall -eq 1 ]]
then
    echo uninstalling $service service
    if [[ -x $(which update-rc.d) ]]; then
        update-rc.d -f $service remove
        rm -f /etc/init.d/$service
    else
        rm -f /etc/init.d/$service /etc/rc1.d/{S,K}95$service
        for (( i=1; i<=5; i++ )); do
            rm -f /etc/rc$i.d/{S,K}95$service
        done
    fi
fi