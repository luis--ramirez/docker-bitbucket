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

# Start Elasticsearch, then start webapp
echo -------------------------------------------------------------------------------
echo Starting Atlassian Bitbucket and bundled Elasticsearch
echo To start Atlassian Bitbucket on its own, run start-webapp.sh instead
echo -------------------------------------------------------------------------------

$PRGDIR/start-search.sh $@
$PRGDIR/start-webapp.sh $@

# If user starts Bitbucket in FG, should kill search here
if [ "$1" = "-fg" ] || [ "$1" = "run" ]  ; then
    $PRGDIR/stop-search.sh $@
fi