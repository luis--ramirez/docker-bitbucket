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

. $PRGDIR/set-bitbucket-home.sh

if [ -z "$BITBUCKET_HOME" ]; then
    echo ""
    echo "BITBUCKET_HOME is not set. Elasticsearch bundled with Atlassian Bitbucket cannot stop."
    exit 1
fi

pidfile="$BITBUCKET_HOME/shared/search/elasticsearch.pid"

if [ ! -r "$pidfile" ]; then
    echo "Could not find PID file for Elasticsearch bundled with Atlassian Bitbucket: $pidfile"
    echo "Elasticsearch is not running or may already have been stopped."
    exit 1
fi

. $PRGDIR/set-bitbucket-user.sh #readin the username
if [ -z "$BITBUCKET_USER" ] || [ $(id -un) == "$BITBUCKET_USER" ]; then
    echo -e "Stopping Elasticsearch bundled with Atlassian Bitbucket as the current user \n\n"
    kill $(cat "$pidfile")
    if [ $? -ne 0 ]; then
        exit 1
    fi
    echo -e "Successfully stopped Elasticsearch bundled with Atlassian Bitbucket"
elif [ $UID -ne 0 ]; then
    echo Elasticsearch bundled with Atlassian Bitbucket has been installed to run as $BITBUCKET_USER. Use "sudo -u $BITBUCKET_USER $0" to enable
    echo stopping the server as that user.
    exit 1
else
    echo -e "Stopping Elasticsearch bundled with Atlassian Bitbucket as dedicated user $BITBUCKET_USER\n\n"
    if [ -x "/sbin/runuser" ]; then
        sucmd="/sbin/runuser"
    else
        sucmd="su"
    fi
    $sucmd -l $BITBUCKET_USER -c "cd $(pwd);kill $(cat "$pidfile")"
    echo -e "Successfully stopped Elasticsearch bundled with Atlassian Bitbucket"
fi