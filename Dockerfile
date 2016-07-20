FROM ubuntu:16.04

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get autoclean && \
    apt-get clean && \
    apt-get autoremove -y

RUN apt-get install -y git

COPY ./bitbucket /opt/atlassian/bitbucket/4.8.1
COPY ./data /var/atlassian/application-data/bitbucket

EXPOSE 7990 8006 7992 7993

VOLUME ["/opt/atlassian/bitbucket/4.8.1", "/var/atlassian/application-data/bitbucket"]

RUN groupadd bitbucket && \
    useradd -g bitbucket bitbucket

CMD chown -R bitbucket:bitbucket /opt/atlassian/bitbucket/4.8.1 /var/atlassian/application-data/bitbucket && \
    ./opt/atlassian/bitbucket/4.8.1/bin/start-bitbucket.sh -fg
