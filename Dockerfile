FROM debian:8.5

RUN apt-get update && apt-get install -y git

COPY ./bitbucket /opt/atlassian/bitbucket/4.8.1

COPY ./data /var/atlassian/application-data/bitbucket

RUN groupadd bitbucket && \
    useradd -g bitbucket bitbucket && \
    chown -R bitbucket:bitbucket /opt/atlassian/bitbucket/4.8.1 /var/atlassian/application-data/bitbucket

VOLUME ["/opt/atlassian/bitbucket/4.8.1", "/var/atlassian/application-data/bitbucket"]

EXPOSE 7990 8006 7992 7993

USER bitbucket

CMD ./opt/atlassian/bitbucket/4.8.1/bin/start-bitbucket.sh -fg
