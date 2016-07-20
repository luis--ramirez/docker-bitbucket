@echo off
set _PRG_DIR=%~dp0

echo Stopping Atlassian Bitbucket
echo .
call "%_PRG_DIR%\shutdown.bat" %1 %2 %3 %4 %5 %6 %7 %8 %9
echo .
set BITBUCKET_CONTEXT=
set BITBUCKET_HTTPPORT=

FOR /F "eol=# tokens=1,2 delims==" %%a in (%_PRG_DIR%..\conf\scripts.cfg) DO (
    if %%a==bitbucket_context set BITBUCKET_CONTEXT=%%b
    if %%a==bitbucket_httpport set BITBUCKET_HTTPPORT=%%b
)
echo Stopped Atlassian Bitbucket at http://localhost:%BITBUCKET_HTTPPORT%/%BITBUCKET_CONTEXT%