@echo off
rem Abre o Anakin no Windows: instala o que falta na primeira vez, inicia e abre no navegador.
cd /d "%~dp0"
where node >nul 2>nul || (echo Instale o Node.js LTS em https://nodejs.org e abra de novo. & start https://nodejs.org & pause & exit /b 1)
if not exist node_modules (echo Primeira vez: instalando... & call npm install)
if not exist dist\index.html call npm run build
start "" cmd /c "timeout /t 4 >nul & start http://localhost:3001"
echo Anakin aberto em http://localhost:3001 - deixe esta janela aberta enquanto usa.
set NODE_ENV=production
call npx tsx server/index.ts
