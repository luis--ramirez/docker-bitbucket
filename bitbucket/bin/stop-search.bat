@echo off
set _PRG_DIR=%~dp0
call "%_PRG_DIR%\set-bitbucket-home.bat"

if "x%BITBUCKET_HOME%x" == "xx" goto NOBITBUCKETHOME

rem Remove any trailing backslash in BITBUCKET_HOME
if %BITBUCKET_HOME%:~-1==\ SET BITBUCKET_HOME=%BITBUCKET_HOME:~0,-1%
goto :END

:NOBITBUCKETHOME
echo.
echo -------------------------------------------------------------------------------------
echo BITBUCKET_HOME is not set. Elasticsearch bundled with Atlassian Bitbucket cannot be stopped.
echo -------------------------------------------------------------------------------------
pause
exit /b 1

:END
rem Killing elasticsearch directly without /f (force) isn't possible. To cleanly shut down, we kill its parent cmd.exe.
for /f %%a in (%BITBUCKET_HOME%\shared\search\elasticsearch.pid) do set ES_PID=%%a
for /f "usebackq tokens=2 delims==" %%a in (`wmic process where ^(processid^=%ES_PID%^) get parentprocessid /value`) do (
    set ES_PARENT_PID=%%a
)
if not "%ES_PARENT_PID%"=="" taskkill /pid %ES_PARENT_PID%

echo Stopped Elasticsearch bundled with Atlassian Bitbucket