@echo off
echo 🚀 Desplegando Eco Tag a producción...
echo.

echo 📦 Comprimiendo archivos...
tar -czf eco-tag-prod-$(date +%Y%m%d).tar.gz ./*

echo ✅ Compresión completada
echo 📁 Archivo creado: eco-tag-prod-$(date +%Y%m%d).tar.gz
echo.
echo 📋 Archivos incluidos:
dir /b

echo.
echo 🎯 Listo para producción!
pause