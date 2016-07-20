@echo off
set _PRG_DIR=%~dp0

echo -------------------------------------------------------------------------------
echo Starting Atlassian Bitbucket and bundled Elasticsearch
echo To start Atlassian Bitbucket on its own, run start-webapp.bat instead
echo -------------------------------------------------------------------------------

call "%_PRG_DIR%\start-search.bat" %1 %2 %3 %4 %5 %6 %7 %8 %9
call "%_PRG_DIR%\start-webapp.bat" %1 %2 %3 %4 %5 %6 %7 %8 %9