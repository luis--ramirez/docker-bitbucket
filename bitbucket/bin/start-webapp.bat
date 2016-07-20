@echo off
set _PRG_DIR=%~dp0

rem Checks if the program directory has a space in it (will cause issues)
set _marker="x%_PRG_DIR%"
set _marker=%_marker: =%
if %_marker% == "x%_PRG_DIR%" goto NOSPACES
echo.
echo -------------------------------------------------------------------------------
echo   Bitbucket directory "%_PRG_DIR%" contains spaces.
echo   Please change to a location without spaces and try again.
echo -------------------------------------------------------------------------------

:NOSPACES
set _PRGRUNMODE=false
if "%1" == "/fg" set _PRGRUNMODE=true
if "%1" == "run" set _PRGRUNMODE=true

if "%_PRGRUNMODE%" == "true" (goto EXECRUNMODE) else (goto EXECSTART)

:EXECSTART
    echo.
    echo To run Bitbucket in the foreground, start the server with start-bitbucket.bat /fg
    echo.
    call "%_PRG_DIR%\startup.bat"  %1 %2 %3 %4 %5 %6 %7 %8 %9
    goto END
:EXECRUNMODE
    echo.
    echo If you do not see a 'Server startup' message within 3 minutes, please see the troubleshooting guide at:
    echo.
    echo https://confluence.atlassian.com/display/BitbucketServerKB/Troubleshooting+Installation
    echo.
    call "%_PRG_DIR%\catalina.bat" run %1 %2 %3 %4 %5 %6 %7 %8 %9
    goto END

:END
rem Exit if there was a problem above
if ERRORLEVEL 1 exit /b 1

echo .
set BITBUCKET_CONTEXT=
set BITBUCKET_HTTPPORT=

FOR /F "usebackq eol=# tokens=1,2 delims==" %%a in (%_PRG_DIR%..\conf\scripts.cfg) DO (
    if %%a==bitbucket_context set BITBUCKET_CONTEXT=%%b
    if %%a==bitbucket_httpport set BITBUCKET_HTTPPORT=%%b
)
echo.
echo Started Atlassian Bitbucket at:
echo http://localhost:%BITBUCKET_HTTPPORT%/%BITBUCKET_CONTEXT%
echo.
echo If you cannot access Bitbucket at the above location within 3 minutes, or encounter any other issues starting or stopping Atlassian Bitbucket, please see the troubleshooting guide at:
echo.
echo https://confluence.atlassian.com/display/BitbucketServerKB/Troubleshooting+Installation