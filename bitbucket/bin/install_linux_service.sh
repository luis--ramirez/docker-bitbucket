#!/usr/bin/env bash

. `dirname $0`/set-bitbucket-user.sh #readin the username

bitbucket_account=

if [ -z "$BITBUCKET_USER" ]; then
        bitbucket_account="bitbucket"
else
        bitbucket_account=$BITBUCKET_USER
fi

bitbucket_service_name=$bitbucket_account
search_service_name="${bitbucket_account}_search"

function remove_service {
    if [[ -x $(which update-rc.d) ]]; then
        update-rc.d -f $1 remove
        rm -f /etc/init.d/$1
    else
        rm -f /etc/init.d/$1 /etc/rc1.d/{S,K}95$1
        for (( i=1; i<=5; i++ )); do
            rm -f /etc/rc$i.d/{S,K}95$1
        done
    fi
}

function install_service {
    if [[ -x $(which update-rc.d) ]]; then
        update-rc.d -f $1 defaults
    else
        ln -s /etc/init.d/$1 /etc/rc2.d/K95$1
        ln -s /etc/init.d/$1 /etc/rc3.d/S95$1
        ln -s /etc/init.d/$1 /etc/rc4.d/K95$1
        ln -s /etc/init.d/$1 /etc/rc5.d/S95$1
    fi
}

#######################################
# Writes init service script into init.d
# Globals:
#   BITBUCKET_BIN
# Arguments:
#   Service name
#   Service display name
#   PID file location relative to BITBUCKET_BIN
#   Start script name
#   Stop script name
# Returns:
#   None
#######################################
function create_service_script {
    cat >/etc/init.d/$1 <<EOF
#!/usr/bin/env bash
### BEGIN INIT INFO
# Provides:          $2
# Required-Start:
# Required-Stop:
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Start $2 daemon at boot time
# Description:       Start $2 daemon at boot time
### END INIT INFO

# THIS SCRIPT HAS BEEN CONFIGURED TO RUN AS PART OF RUN LEVELS 2 TO 5
# IF YOU WISH TO CHANGE THIS CONFIGURATION YOU WILL HAVE TO DO IT MANUALLY

PIDFILE=$BITBUCKET_BIN/$3

start() {
    ./$4
}

stop() {
    ./$5
}

status() {
    if [ -f \$PIDFILE ]
    then
        PID=\$(<\$PIDFILE)
        if kill -0 \$PID &>1 > /dev/null
        then
            echo "$2 is running"
            exit 0
        fi
    fi

    echo "$2 is not running"
}

# Bitbucket Linux service controller script
cd $BITBUCKET_BIN

case "\$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    status)
        status
        ;;
    restart)
        stop
        start
        ;;
    *)
        echo "Usage: \$0 {start|stop|status}"
        exit 1
        ;;
esac
EOF
    chmod +x /etc/init.d/$1
}

if [[ $1 == "-u" ]]; then
    echo uninstalling Bitbucket as a service
    remove_service $bitbucket_service_name
    remove_service $search_service_name
else
    if [[ -d /etc/init.d ]]; then
        echo installing Bitbucket as a service
        BITBUCKET_BIN=`dirname $0`

        create_service_script $bitbucket_service_name "Bitbucket" ../work/catalina.pid start-webapp.sh stop-webapp.sh
        install_service $bitbucket_service_name

        if [[ $1 != "--no-elasticsearch" ]]; then
            create_service_script $search_service_name "Bitbucket-Search" elasticsearch.pid start-search.sh stop-search.sh
            install_service $search_service_name
        fi
    fi
fi
