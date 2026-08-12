@echo off
setlocal
rem Wrapper for setup-pages.ps1.
rem
rem Windows PowerShell 5.1 ships with execution policy "Restricted", so
rem running the .ps1 directly fails with "running scripts is disabled on this
rem system". Execution policy does not apply to .cmd files, and the -File call
rem below carries its own policy, so this always works and changes no
rem machine-wide setting.
rem
rem Prefers PowerShell 7 (pwsh) and falls back to Windows PowerShell.

where /q pwsh
if %errorlevel%==0 (
  pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-pages.ps1" %*
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-pages.ps1" %*
)

exit /b %errorlevel%
