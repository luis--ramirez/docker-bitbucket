#!/usr/bin/env bash
#
# One way to set the BITBUCKET_HOME path is here via this variable.  Simply uncomment it and set a valid path like
# /bitbucket/home.  You can of course set it outside in the command terminal; that will also work.
#

if [ "x${BITBUCKET_HOME}" = "x" ]; then
    export BITBUCKET_HOME=/var/atlassian/application-data/bitbucket
fi

# When upgrading from the packaged distribution BITBUCKET_HOME may not be set. Fallback to legacy STASH_HOME
# and output a message for the user recommending that they update their environment
if [ "x${BITBUCKET_HOME}" = "x" ]; then
    if [ ! "x${STASH_HOME}" = "x" ]; then
        BITBUCKET_HOME=${STASH_HOME}
        echo ""
        echo "--------------------------------------------------------------------------------------"
        echo "  WARNING: STASH_HOME has been deprecated and replaced with BITBUCKET_HOME."
        echo "  We recommend you set BITBUCKET_HOME instead of STASH_HOME."
        echo "  Future versions of Bitbucket may not support the STASH_HOME variable."
        echo "--------------------------------------------------------------------------------------"
    fi
fi

echo $BITBUCKET_HOME | grep -q " "
if [ $? -eq 0 ]; then
    echo ""
    echo "-------------------------------------------------------------------------------"
    echo "  BITBUCKET_HOME \"$BITBUCKET_HOME\" contains spaces."
    echo "  Using a directory with spaces is likely to cause unexpected behaviour and is"
    echo "  not supported. Please use a directory which does not contain spaces."
    echo "-------------------------------------------------------------------------------"
    exit 1
fi

echo "BITBUCKET_HOME set to $BITBUCKET_HOME"