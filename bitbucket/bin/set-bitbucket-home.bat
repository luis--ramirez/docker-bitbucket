rem
rem One way to set the BITBUCKET_HOME path is here via this variable.  Simply uncomment it and set a valid path like
rem C:\bitbucket\home. You can of course set it outside in the command terminal; that will also work.
rem
rem WARNING: DO NOT wrap the BITBUCKET_HOME value in quotes when setting it here, even if it contains spaces.
rem
rem set BITBUCKET_HOME=

rem When upgrading from the packaged distribution BITBUCKET_HOME may not be set. Fallback to legacy STASH_HOME
rem and output a message for the user recommending that they update their environment
if NOT "x%BITBUCKET_HOME%x" == "xx" goto CHECKSPACES
if "x%STASH_HOME%x" == "xx" goto CHECKSPACES
set BITBUCKET_HOME=%STASH_HOME%
echo.
echo -------------------------------------------------------------------------------------
echo   WARNING: STASH_HOME has been deprecated and replaced with BITBUCKET_HOME.
echo   We recommend you set BITBUCKET_HOME instead of STASH_HOME.
echo   Future versions of Bitbucket may not support the STASH_HOME variable.
echo -------------------------------------------------------------------------------------

:CHECKSPACES
set _marker="x%BITBUCKET_HOME%"
set _marker=%_marker: =%
if %_marker% == "x%BITBUCKET_HOME%" goto END

echo -------------------------------------------------------------------------------
echo   BITBUCKET_HOME "%BITBUCKET_HOME%" contains spaces.
echo   Please change to a location without spaces if this causes problems.
echo -------------------------------------------------------------------------------

:END
echo "BITBUCKET_HOME set to %BITBUCKET_HOME%"