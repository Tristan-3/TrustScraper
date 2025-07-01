@echo off
echo Instalando dependencias de Node.js...
call npm install express node-fetch@2

echo Instalando dependencias de Python...
pip install requests beautifulsoup4

echo Instalación completa.
