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

# Stop webapp first, then stop Elasticsearch
echo -------------------------------------------------------------------------------
echo Stopping Atlassian Bitbucket and bundled Elasticsearch
echo -------------------------------------------------------------------------------

$PRGDIR/stop-webapp.sh $@
$PRGDIR/stop-search.sh $@
