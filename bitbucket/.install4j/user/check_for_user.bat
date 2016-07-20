@ECHO off
REM Query for the username to check for existence

SET username=

if [%1]==[] goto usage 1

:CHECKFORSWITCHES
IF '%1'=='-h' goto usage 0
IF '%1'=='-u' goto setusername
goto execute

:setusername
SET username=%2
SHIFT
SHIFT
goto CHECKFORSWITCHES

:execute

IF "%username%" == "" (
    goto usage 1
)

net user %username%

IF ERRORLEVEL 2 exit /b 1
goto eof

:usage
echo usage: %0 options
echo.
echo Queries for a username and returns 0 if the user was found
echo.
echo OPTIONS:
echo -h              Show this message
echo -u username     A windows username
exit /b %1

:eof

