#!/usr/bin/env bash

# resolve links - $0 may be a softlink - stolen from catalina.sh
PRG="$0"
while [ -h "$PRG" ]; do
    ls=`ls -ld "$PRG"`
    link=`expr "$ls" : '.*-> \(.*\)$'`
    if expr "$link" : '/.*' > /dev/null; then
        PRG="$link"
    else
        PRG=`dirname "$PRG"`/"$link"
    fi
done
PRGDIR=`dirname "$PRG"`

. $PRGDIR/set-bitbucket-user.sh #readin the username
if [ -z "$BITBUCKET_USER" ] || [ $(id -un) == "$BITBUCKET_USER" ]; then
    echo -e "Stopping Atlassian Bitbucket as the current user \n\n"
    $PRGDIR/shutdown.sh 60 -force $@
    if [ $? -ne 0 ]; then
        exit 1
    fi
elif [ $UID -ne 0 ]; then
    echo Atlassian Bitbucket has been installed to run as $BITBUCKET_USER. Use "sudo -u $BITBUCKET_USER $0" to enable
    echo stopping the server as that user.
    exit 1
else
    echo -e "Stopping Atlassian Bitbucket as dedicated user $BITBUCKET_USER\n\n"
    if [ -x "/sbin/runuser" ]; then
        sucmd="/sbin/runuser"
    else
        sucmd="su"
    fi
    $sucmd -l $BITBUCKET_USER -c "cd $(pwd);$PRGDIR/shutdown.sh 60 -force $@"
fi

source $PRGDIR/../conf/scripts.cfg
echo Stopped Atlassian Bitbucket at http://localhost:${bitbucket_httpport}/${bitbucket_context}