#!/usr/bin/env bash

function fgstartmsg {
    if [ "$PRGRUNMODE" == "true" ] ; then
        echo -e "If you do not see a 'Server startup' message within 3 minutes, please see the troubleshooting guide at:\n\nhttps://confluence.atlassian.com/display/BitbucketServerKB/Troubleshooting+Installation\n\n"
    fi
}

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

PRGRUNMODE=false
if [ "$1" = "-fg" ] || [ "$1" = "run" ]  ; then
	shift
	PRGRUNMODE=true
else
	echo "To run Bitbucket in the foreground, start the server with start-bitbucket.sh -fg"
fi

. $PRGDIR/set-bitbucket-user.sh #readin the username

if [ -z "$BITBUCKET_USER" ] || [ $(id -un) == "$BITBUCKET_USER" ]; then
    echo -e "Starting Atlassian Bitbucket as current user\n"

    fgstartmsg
    if [ "$PRGRUNMODE" == "true" ] ; then
        $PRGDIR/catalina.sh run $@
        if [ $? -ne 0 ]; then
		exit 1
	fi
    else
        $PRGDIR/startup.sh $@
        if [ $? -ne 0 ]; then
		exit 1
	fi
    fi
elif [ $UID -ne 0 ]; then
    echo Atlassian Bitbucket has been installed to run as $BITBUCKET_USER. Use "sudo -u $BITBUCKET_USER $0" to enable
    echo starting the server as that user.
    exit 1
else
    echo -e "Starting Atlassian Bitbucket as dedicated user $BITBUCKET_USER \n"
    fgstartmsg

    if [ -x "/sbin/runuser" ]; then
        sucmd="/sbin/runuser"
    else
        sucmd="su"
    fi

    if [ "$PRGRUNMODE" == "true" ] ; then
        $sucmd -l $BITBUCKET_USER -c "cd $(pwd);$PRGDIR/catalina.sh run $@"
    else
        $sucmd -l $BITBUCKET_USER -c "cd $(pwd);$PRGDIR/startup.sh $@"
    fi
fi

if [ $? -eq 0 ]; then
    source $PRGDIR/../conf/scripts.cfg
    echo -e "\nSuccess! You can now use Bitbucket at the following address:\n\nhttp://localhost:${bitbucket_httpport}/${bitbucket_context}\n"
    echo -e "If you cannot access Bitbucket at the above location within 3 minutes, or encounter any other issues starting or stopping Atlassian Bitbucket, please see the troubleshooting guide at:\n\nhttps://confluence.atlassian.com/display/BitbucketServerKB/Troubleshooting+Installation\n"
else
    echo -e "\nThere was a problem starting Bitbucket\n"
fi