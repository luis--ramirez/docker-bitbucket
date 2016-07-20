rem
rem Note: If running Atlassian Bitbucket as a Service, settings in this file have no
rem effect. See http://confluence.atlassian.com/display/STASH/Increasing+STASH+memory
rem

set _PRG_DIR=%~dp0
call "%_PRG_DIR%\set-bitbucket-home.bat"

rem
rem The Microsoft SQL Server JDBC driver includes native DLLs that can be used to enable integrated authentication,
rem allowing the system to authenticate with the database using the credentials of the user running it. To use this
rem integrated authentication, rename the architecture-appropriate "sqljdbc_auth-(x86|x64).dll" file in lib\native
rem to "sqljdbc_auth.dll". Additional native DLLs such as the Tomcat native library can also be placed here for use
rem by Bitbucket.
rem
rem Alternatively, native DLLs can also be placed in %BITBUCKET_HOME%\lib\native, where they will also be included in the
rem library path used by the JVM. By placing DLLs in %BITBUCKET_HOME%, they can be preserved across Bitbucket upgrades.
rem
rem NOTE: You must choose the DLL architecture, x86 or x64, based on the JVM you'll be running, _not_ based on Windows.
rem
set JVM_LIBRARY_PATH=%CATALINA_HOME%\lib\native;%BITBUCKET_HOME%\lib\native

rem
rem Occasionally Atlassian Support may recommend that you set some specific JVM arguments.  You can use this variable
rem below to do that.
rem
set JVM_SUPPORT_RECOMMENDED_ARGS=

rem
rem The following 2 settings control the minimum and maximum given to the Atlassian Bitbucket Java virtual machine.
rem In larger Bitbucket instances, the maximum amount will need to be increased.
rem
set JVM_MINIMUM_MEMORY=512m
set JVM_MAXIMUM_MEMORY=768m

rem
rem File encoding passed into the Atlassian Bitbucket Java virtual machine
rem
set JVM_FILE_ENCODING=UTF-8

rem
rem The following are the required arguments needed for Atlassian Bitbucket.
rem
set JVM_REQUIRED_ARGS=-Djava.awt.headless=true -Dfile.encoding=%JVM_FILE_ENCODING% -Datlassian.standalone=BITBUCKET -Dorg.apache.jasper.runtime.BodyContentImpl.LIMIT_BUFFER=true -Dmail.mime.decodeparameters=true -Dorg.apache.catalina.connector.Response.ENFORCE_ENCODING_IN_GET_WRITER=false

rem -----------------------------------------------------------------------------------
rem  JMX
rem 
rem  JMX is enabled by selecting an authentication method value for JMX_REMOTE_AUTH and then configuring related the
rem  variables.
rem 
rem  See http://docs.oracle.com/javase/7/docs/technotes/guides/management/agent.html for more information on JMX
rem  configuration in general.
rem -----------------------------------------------------------------------------------

rem 
rem  Set the authentication to use for remote JMX access. Anything other than "password" or "ssl" will cause remote JMX
rem  access to be disabled.
rem 
set JMX_REMOTE_AUTH=

rem 
rem  The port for remote JMX support if enabled
rem 
set JMX_REMOTE_PORT=3333

rem 
rem  If `hostname -i` returns a local address then JMX-RMI communication may fail because the address returned by JMX for
rem  the RMI-JMX stub will not resolve for non-local clients. To fix this you will need to explicitly specify the
rem  IP address / host name of this server that is reachable / resolvable by JMX clients. e.g.
rem  RMI_SERVER_HOSTNAME=-Djava.rmi.server.hostname=non.local.name.of.my.bitbucket.server
rem 
rem set RMI_SERVER_HOSTNAME=-Djava.rmi.server.hostname=

rem -----------------------------------------------------------------------------------
rem  JMX username/password support
rem -----------------------------------------------------------------------------------

rem 
rem  The full path to the JMX username/password file used to authenticate remote JMX clients
rem 
rem set JMX_PASSWORD_FILE=

rem -----------------------------------------------------------------------------------
rem  JMX SSL support
rem -----------------------------------------------------------------------------------

rem 
rem  The full path to the Java keystore which must contain Bitbucket's key pair used for SSL authentication for JMX
rem 
rem set JAVA_KEYSTORE=

rem 
rem  The password for JAVA_KEYSTORE
rem 
rem set JAVA_KEYSTORE_PASSWORD=

rem 
rem  The full path to the Java truststore which must contain the client certificates accepted by Bitbucket for SSL authentication
rem  of JMX
rem 
rem set JAVA_TRUSTSTORE=

rem 
rem  The password for JAVA_TRUSTSTORE
rem 
rem set JAVA_TRUSTSTORE_PASSWORD=

rem --------------------------------------------------------------------------
rem
rem In general don't make changes below here
rem
rem --------------------------------------------------------------------------

set _PRG_DIR=%~dp0

rem Checks if the program directory has a space in it (will cause issues)
set _marker="x%_PRG_DIR%"
set _marker=%_marker: =%
if %_marker% == "x%_PRG_DIR%" goto BITBUCKETHOMECHECK
echo.
echo -------------------------------------------------------------------------------
echo   Bitbucket directory "%_PRG_DIR%" contains spaces.
echo   Please change to a location without spaces and try again.
echo -------------------------------------------------------------------------------

:BITBUCKETHOMECHECK
set BITBUCKET_HOME_MINUSD=
if "x%BITBUCKET_HOME%x" == "xx" goto NOBITBUCKETHOME

rem Remove any trailing backslash in BITBUCKET_HOME
if %BITBUCKET_HOME%:~-1==\ SET BITBUCKET_HOME=%BITBUCKET_HOME:~0,-1%

:BITBUCKETHOME
set BITBUCKET_HOME_MINUSD=-Dbitbucket.home="%BITBUCKET_HOME%"
goto :CONFIGURE_JAVA_OPTS

:NOBITBUCKETHOME
echo.
echo -------------------------------------------------------------------------------------
echo   Bitbucket doesn't know where to store its data. Please configure the BITBUCKET_HOME
echo   environment variable with the directory where Bitbucket should store its data.
echo   Ensure that the path to BITBUCKET_HOME does not contain spaces. BITBUCKET_HOME may
echo   be configured in set-bitbucket-home.bat, if preferred, rather than exporting it as an
echo   environment variable.
echo -------------------------------------------------------------------------------------
pause
exit /b 1

:CONFIGURE_JAVA_OPTS
if "x%JVM_LIBRARY_PATH%x" == "xx" goto SET_JMX_OPTS
rem If a native library path has been specified, add it to the required arguments
set JVM_LIBRARY_PATH_MINUSD=-Djava.library.path="%JVM_LIBRARY_PATH%"
set JVM_REQUIRED_ARGS=%JVM_REQUIRED_ARGS% %JVM_LIBRARY_PATH_MINUSD%

:SET_JMX_OPTS
if "%JMX_REMOTE_AUTH%" == "password" goto JMXPASSWORDAUTH
if "%JMX_REMOTE_AUTH%" == "ssl" goto JMXSSLAUTH
goto :SET_JAVA_OPTS

:JMXPASSWORDAUTH
set JMX_OPTS=-Dcom.sun.management.jmxremote.port=%JMX_REMOTE_PORT% %RMI_SERVER_HOSTNAME% -Dcom.sun.management.jmxremote.ssl=false -Dcom.sun.management.jmxremote.password.file=%JMX_PASSWORD_FILE%
goto :SET_JAVA_OPTS

:JMXSSLAUTH
set JMX_OPTS=-Dcom.sun.management.jmxremote.port=%JMX_REMOTE_PORT% %RMI_SERVER_HOSTNAME% -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.ssl.need.client.auth=true -Djavax.net.ssl.keyStore=%JAVA_KEYSTORE% -Djavax.net.ssl.keyStorePassword=%JAVA_KEYSTORE_PASSWORD% -Djavax.net.ssl.trustStore=%JAVA_TRUSTSTORE% -Djavax.net.ssl.trustStorePassword=%JAVA_TRUSTSTORE_PASSWORD%
goto :SET_JAVA_OPTS

:SET_JAVA_OPTS
set JAVA_OPTS=-Xms%JVM_MINIMUM_MEMORY% -Xmx%JVM_MAXIMUM_MEMORY% %JAVA_OPTS% %JVM_REQUIRED_ARGS% %JVM_SUPPORT_RECOMMENDED_ARGS% %BITBUCKET_HOME_MINUSD%
set CATALINA_OPTS=%JMX_OPTS% %CATALINA_OPTS%

rem Checks if the JAVA_HOME has a space in it (can cause issues)
set _marker="x%JAVA_HOME%"
set _marker=%_marker: =%
if %_marker% == "x%JAVA_HOME%" goto RUN_JAVA
echo.
echo -------------------------------------------------------------------------------
echo   JAVA_HOME "%JAVA_HOME%" contains spaces.
echo   Please change to a location without spaces if this causes problems.
echo -------------------------------------------------------------------------------

:RUN_JAVA
rem Check that JAVA_HOME is valid
if exist "%JAVA_HOME%\bin\java.exe" goto CHECK_JAVA_VERSION
echo.
echo -------------------------------------------------------------------------------
echo   JAVA_HOME "%JAVA_HOME%" does not point to a valid Java home directory.
echo -------------------------------------------------------------------------------
goto DONE

:CHECK_JAVA_VERSION
set JAVA_BINARY="%JAVA_HOME:"=%\bin\java.exe"
for /f "tokens=3" %%g in ('%%JAVA_BINARY%% -version 2^>^&1 ^| findstr /i "version"') do set JAVA_VERSION=%%g
if %JAVA_VERSION% GEQ "1.8" goto DONE
echo.
echo -------------------------------------------------------------------------------
echo   Atlassian Bitbucket does not support Java %JAVA_VERSION:"=%.
echo   Please start the product with Java 8 or greater.
echo -------------------------------------------------------------------------------
pause
exit /b 1

:DONE
echo.
echo Using BITBUCKET_HOME:      "%BITBUCKET_HOME%"
:END
