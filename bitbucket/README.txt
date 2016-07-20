Atlassian Bitbucket
======================

About
----------------------

Git Repository Management for Enterprise Teams

Behind the firewall Git management for your source. Create and manage
repositories, set up fine-grained permissions, and collaborate
on code - secure, fast and enterprise-grade.


Quick Installation
----------------------

Requirements:
* Git 1.8.0+
* JRE 1.8+ (Java)

If your system does not meet the above requirements, please read the
installation documentation: http://confluence.atlassian.com/display/BitbucketServer


### Linux and Mac

1. Edit `<Bitbucket installation directory>/bin/set-bitbucket-home.sh`

2. Set `BITBUCKET_HOME` by uncommenting the `BITBUCKET_HOME` line and adding the
   absolute path to the directory where you want Bitbucket Server to store your data.
   This path MUST NOT be in the Bitbucket Server application directory.

3. In a terminal, run:
    `<Bitbucket installation directory>/bin/start-bitbucket.sh`

4. In your browser go to:
    `http://localhost:7990`


### Windows

1. Edit `<Bitbucket installation directory>\bin\set-bitbucket-home.bat`

2. Set `BITBUCKET_HOME` by uncommenting the `BITBUCKET_HOME` line and adding the
   absolute path to the directory where you want Bitbucket to store your data.
   This path MUST NOT be in the Bitbucket Server application directory.

3. In a terminal, run:
    `<Bitbucket installation directory>\bin\start-bitbucket.bat`

4. In your browser go to:
    `http://localhost:7990`


Upgrade
----------------------

See the documentation at: https://confluence.atlassian.com/display/BitbucketServer/Bitbucket+Server+upgrade+guide

Briefly:
1. Stop Bitbucket Server using the old version's installation directory

2. Backup your Bitbucket Server Data in the `BITBUCKET_HOME` directory.
   If you are using an external database, back up this database. Follow the
   directions provided by the database vendor to do this.

3. In the new installation directory, configure and start Bitbucket Server
   as per the `Quick Installation` above.


Documentation
----------------------

Get started with Bitbucket Server in 3 minutes:
http://confluence.atlassian.com/display/BitbucketServer/Getting+started

Install and use Bitbucket Server:
http://confluence.atlassian.com/display/BitbucketServer

Upgrade Bitbucket Server:
https://confluence.atlassian.com/display/BitbucketServer/Bitbucket+Server+upgrade+guide

Supported Platforms:
http://confluence.atlassian.com/display/BitbucketServer/Supported+platforms


Licensing
----------------------

See https://www.atlassian.com/end-user-agreement/
