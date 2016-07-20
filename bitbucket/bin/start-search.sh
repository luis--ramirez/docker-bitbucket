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

echo "Starting Elasticsearch bundled with Atlassian Bitbucket"

# Check if BITBUCKET_HOME is set, abort if not
# Also get the JAVA_HOME
. $PRGDIR/setenv.sh

if [ "x${BITBUCKET_HOME}" = "x" ]; then
    echo "BITBUCKET_HOME is not set. Elasticsearch bundled with Atlassian Bitbucket cannot start."
    exit 1
fi

ES_CONFIG_PATH="$BITBUCKET_HOME/shared/search"
ES_LOG_PATH="$BITBUCKET_HOME/log/search"
ES_DATA_PATH="$BITBUCKET_HOME/shared/search/data"

ES_DEFAULT_ARGS="-Dpath.conf=$ES_CONFIG_PATH -Dpath.logs=$ES_LOG_PATH -Dpath.data=$ES_DATA_PATH"

. $PRGDIR/set-bitbucket-user.sh #readin the username

if [ -z "$BITBUCKET_USER" ] || [ $(id -un) == "$BITBUCKET_USER" ]; then
    echo -e "Starting Elasticsearch bundled with Atlassian Bitbucket as current user\n"

    # If config files are not in their appropriate location, copy them over from the templates in our distribution
    if [ ! -d "$ES_CONFIG_PATH" ]; then
        mkdir -p "$ES_CONFIG_PATH" && cp -r "$PRGDIR/../elasticsearch/config-template/"* "$ES_CONFIG_PATH"
    fi

    "$PRGDIR/../elasticsearch/bin/elasticsearch" -d -p "$BITBUCKET_HOME/shared/search/elasticsearch.pid" $ES_DEFAULT_ARGS
elif [ $UID -ne 0 ]; then
    echo Elasticsearch bundled with Atlassian Bitbucket has been installed to run as $BITBUCKET_USER. Use "sudo -u $BITBUCKET_USER $0" to enable
    echo starting the server as that user.
    exit 1
else
    echo -e "Starting Elasticsearch bundled with Atlassian Bitbucket as dedicated user $BITBUCKET_USER \n"

    if [ -x "/sbin/runuser" ]; then
        sucmd="/sbin/runuser"
    else
        sucmd="su"
    fi

    # If config files are not in their appropriate location, copy them over from the templates in our distribution
    # This copying over also happens in the installer script, modifications here should go to the installer as well
    if [ ! -d "$ES_CONFIG_PATH" ]; then
        $sucmd -l $BITBUCKET_USER -c "mkdir -p \"$ES_CONFIG_PATH\" && cp -r \"$PRGDIR/../elasticsearch/config-template/\"* \"$ES_CONFIG_PATH\""
    fi

    $sucmd -l $BITBUCKET_USER -c "cd $(pwd);$PRGDIR/../elasticsearch/bin/elasticsearch -d -p \"$BITBUCKET_HOME/shared/search/elasticsearch.pid\" $ES_DEFAULT_ARGS"
fi

if [ $? -eq 0 ]; then
    echo -e "\nElasticsearch bundled with Atlassian Bitbucket started successfully\n"
else
    echo -e "\nThere was a problem starting Elasticsearch bundled with Atlassian Bitbucket\n"
fi