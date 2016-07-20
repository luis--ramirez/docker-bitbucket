@echo off
set _PRG_DIR=%~dp0

:CHECK_BITBUCKET_HOME
call "%_PRG_DIR%\setenv.bat"
if NOT "x%BITBUCKET_HOME%x" == "xx" goto SETARGS
echo -------------------------------------------------------------------------------------
echo BITBUCKET_HOME is not set. Elasticsearch bundled with Atlassian Bitbucket cannot start.
echo -------------------------------------------------------------------------------------
exit /b 1

:SETARGS
set _ES_CONFIG_PATH=%BITBUCKET_HOME%\shared\search
set _ES_LOG_PATH=%BITBUCKET_HOME%\log\search
set _ES_DATA_PATH=%BITBUCKET_HOME%\shared\search\data
set _ES_DEFAULT_ARGS=-Dpath.conf=%_ES_CONFIG_PATH% -Dpath.logs=%_ES_LOG_PATH% -Dpath.data=%_ES_DATA_PATH%

rem If config files are not in their appropriate location, copy them over from the templates in our distribution
rem This copying over also happens in the installer script, modifications here should go to the installer as well
if not exist %_ES_CONFIG_PATH% (goto COPYESCONFIG) else (goto CREATEESDIRS)

:COPYESCONFIG
md %_ES_CONFIG_PATH%
robocopy %_PRG_DIR%\..\elasticsearch\config-template\ %_ES_CONFIG_PATH% /S /NFL /NDL /NJH /NJS /NC /NS /NP

:CREATEESDIRS
if not exist %_ES_LOG_PATH% md %_ES_LOG_PATH%
if not exist %_ES_DATA_PATH% md %_ES_DATA_PATH%

:RUNMODE
set _PRGRUNMODE=false
if "%1" == "/fg" set _PRGRUNMODE=true
if "%1" == "run" set _PRGRUNMODE=true

if "%_PRGRUNMODE%" == "true" (goto EXECRUNMODE) else (goto EXECSTART)

:EXECSTART
    start "Elasticsearch" %_PRG_DIR%\..\elasticsearch\bin\elasticsearch.bat -Des.pidfile=%BITBUCKET_HOME%\shared\search\elasticsearch.pid %_ES_DEFAULT_ARGS%
    goto END

:EXECRUNMODE
    start "Elasticsearch" /b %_PRG_DIR%\..\elasticsearch\bin\elasticsearch.bat %_ES_DEFAULT_ARGS%
    rem elasticsearch.bat sets a title. If we wait a bit, we can override it.
    timeout /t 5 >NUL
    title Atlassian Bitbucket Elasticsearch
    goto END

:END
