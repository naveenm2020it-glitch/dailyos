@rem Gradle startup script for Windows
@if "%DEBUG%" == "" @echo off
set APP_HOME=%~dp0
set CLASSPATH=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar
java.exe -Xmx2048m -Dorg.gradle.appname="gradlew" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*
