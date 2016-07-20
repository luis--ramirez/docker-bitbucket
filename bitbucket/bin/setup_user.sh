#!/usr/bin/env bash

# creates a user 'atlbitbucket' and gives the user ownership over the BitBucket directories and files
# must be run as root

usage()
{
    cat << EOF
    usage: $0 options

    Creates a user and sets up the permissions.

    OPTIONS:
       -h              Show this message
       -a account      Account name to create
       -d dir          Bitbucket home directory
       -i dir          application install directory
       -u              uninstall
EOF
}

# ensure the given directory exists, and that it is private to the created user
set_dir_perms()
{
    mkdir -p "$1"
    chown -R "$username" "$1"
    chmod -R og-rwx "$1"
}

username=
bitbucket_home=
install_dir=
uninstall=0

while getopts "hd:i:a:u" OPTION
do
     case $OPTION in
         h)
             usage
             exit 0
             ;;
         d)
             bitbucket_home=$OPTARG
             ;;
         i)
             install_dir=$OPTARG
             ;;
         a)
             username=$OPTARG
             ;;
         u)
             uninstall=1
             ;;
     esac
done

if [[ (-z "$bitbucket_home" || -z "$username" || -z "$install_dir") && $uninstall -eq 0 ]]
then
    usage
    exit 1
elif [[ -z "$username" && $uninstall -eq 1 ]]
then
    usage
    exit 1
fi

# ensure the given directory exists, and that it is private to the created user
set_dir_perms()
{
    echo "Setting permissions for [$username] at [$1]"
    mkdir -p "$1"
    chown -R "$username" "$1"
    chmod -R og-rwx "$1"
}

# useradd is in /usr/sbin in redhat
PATH=$PATH:/usr/sbin

if [[ $uninstall -eq 1 ]]
then
    userdel "$username"
else
    if id $username>/dev/null 2>&1
    then
        echo "user $username exists"
    else
        # create user
        useradd "$username" -c "Atlassian Bitbucket"
    fi

    # Lock the user account so that it cannot be used for login
    usermod -L $username

    set_dir_perms "$install_dir/work"
    set_dir_perms "$install_dir/temp"
    set_dir_perms "$install_dir/logs"

    echo "Giving execute permissions to [$username] at [$install_dir/bin]"
    chmod +x "$install_dir"/bin/*.sh
fi
