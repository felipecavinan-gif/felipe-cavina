@echo off
rem Instala o painel Anakin no Premiere Pro (Windows).
set "DEST=%APPDATA%\Adobe\CEP\extensions\Anakin"
if exist "%DEST%" rmdir /s /q "%DEST%"
xcopy /e /i /y "%~dp0premiere-extension\Anakin" "%DEST%" >nul
for %%v in (9 10 11 12 13) do reg add "HKCU\Software\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul
echo Extensao Anakin instalada.
echo 1. Abra o Anakin (Abrir Anakin.bat)  2. Reinicie o Premiere  3. Janela ^> Extensoes ^> Anakin
pause
