@echo off
set _PRG_DIR=%~dp0

echo -------------------------------------------------------------------------------
echo Stopping Atlassian Bitbucket and bundled Elasticsearch
echo -------------------------------------------------------------------------------

call "%_PRG_DIR%\stop-webapp.bat" %1 %2 %3 %4 %5 %6 %7 %8 %9
call "%_PRG_DIR%\stop-search.bat" %1 %2 %3 %4 %5 %6 %7 %8 %9