@ECHO off
REM Query for the service to check for existence

SET service=

if [%1]==[] goto usage 1

:CHECKFORSWITCHES
IF '%1'=='-h' goto usage 0
IF '%1'=='-s' goto setservice
goto execute

:setservice
SET service=%2
SHIFT
SHIFT
goto CHECKFORSWITCHES

:execute

IF "%service%" == "" (
    goto usage 1
)

sc query %service%

IF ERRORLEVEL 1060 exit /b 1
goto eof

:usage
echo usage: %0 options
echo.
echo Queries for a service ID and returns 0 if the service was found
echo.
echo OPTIONS:
echo -h             Show this message
echo -s service     A windows service id.
exit /b %1

:eof

