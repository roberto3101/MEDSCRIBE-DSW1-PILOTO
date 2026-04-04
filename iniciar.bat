@echo off
setlocal enabledelayedexpansion
title MedScribe AI - Sistema de Documentacion Medica
color 0A

echo =========================================
echo   MedScribe AI - Iniciando servicios
echo =========================================
echo.

REM ========== Matar procesos anteriores ==========
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| find ":5000" ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| find ":8000" ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| find ":3000" ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>&1

REM ========== Levantar todo en paralelo ==========
echo [1/3] Iniciando Servicio IA (Python :8000)...
pushd "%~dp0servicio-ia"
start "" /b cmd /c "uvicorn principal:app --host 0.0.0.0 --port 8000 --reload 2>&1"
popd

echo [2/3] Iniciando Gateway .NET Core (:5000)...
pushd "%~dp0gateway-dotnet\src\MedScribe.API"
start "" /b cmd /c "dotnet run --urls http://localhost:5000 2>&1"
popd

if exist "%~dp0cliente-web\package.json" (
    echo [3/3] Iniciando Frontend React (:3000^)...
    pushd "%~dp0cliente-web"
    start "" /b cmd /c "npm run dev 2>&1"
    popd
) else (
    echo [3/3] Frontend no encontrado, omitiendo.
)

echo.
echo Esperando que los servicios levanten...
timeout /t 15 >nul

REM ========== Verificacion concurrente ==========
start "" /b cmd /c "curl -s -o nul -w %%{http_code} http://localhost:8000/ > "%TEMP%\ms_t01.tmp" 2>nul"
start "" /b cmd /c "curl -s -o nul -w %%{http_code} http://localhost:5000/api/pacientes > "%TEMP%\ms_t02.tmp" 2>nul"
start "" /b cmd /c "curl -s -o nul -w %%{http_code} http://localhost:5000/api/pacientes/1 > "%TEMP%\ms_t04.tmp" 2>nul"
start "" /b cmd /c "curl -s -o nul -w %%{http_code} http://localhost:5000/api/pacientes/documento/72345678 > "%TEMP%\ms_t05.tmp" 2>nul"
start "" /b cmd /c "curl -s -o nul -w %%{http_code} http://localhost:5000/api/consultas/medico/1 > "%TEMP%\ms_t06.tmp" 2>nul"
start "" /b cmd /c "curl -s -o nul -w %%{http_code} http://localhost:5000/api/documentos/medico/1 > "%TEMP%\ms_t07.tmp" 2>nul"
start "" /b cmd /c "curl -s -o nul -w %%{http_code} -X POST http://localhost:8000/api/ia/generar-pdf -H "Content-Type: application/json" --data-raw "{\"nota_clinica\":\"# Test\n## Plan\nParacetamol 500mg\",\"tipo_documento\":\"SOAP\"}" > "%TEMP%\ms_t08.tmp" 2>nul"

timeout /t 3 >nul

echo.
echo =========================================
echo   SERVICIOS PRINCIPALES
echo =========================================

set /p R01=<"%TEMP%\ms_t01.tmp" 2>nul
if "!R01!"=="200" (echo   [OK] Servicio IA  http://localhost:8000/) else (echo   [!!] Servicio IA  http://localhost:8000/ [!R01!])

set /p R02=<"%TEMP%\ms_t02.tmp" 2>nul
if "!R02!"=="200" (echo   [OK] Gateway      http://localhost:5000/api/pacientes) else (echo   [!!] Gateway      http://localhost:5000/api/pacientes [!R02!])

if exist "%~dp0cliente-web\package.json" (
    echo   [--] Frontend     http://localhost:3000/
) else (
    echo   [--] Frontend     No instalado
)

echo   [--] SQL Server   DESKTOP-V3DNB2R\SQLEXPRESS

echo.
echo =========================================
echo   PRUEBAS DE ENDPOINTS
echo =========================================

echo.
echo   --- Pacientes ---

set /p R04=<"%TEMP%\ms_t04.tmp" 2>nul
if "!R04!"=="200" (echo   [OK] GET  http://localhost:5000/api/pacientes/1) else (echo   [!!] GET  http://localhost:5000/api/pacientes/1 [!R04!])

set /p R05=<"%TEMP%\ms_t05.tmp" 2>nul
if "!R05!"=="200" (echo   [OK] GET  http://localhost:5000/api/pacientes/documento/72345678) else (echo   [!!] GET  http://localhost:5000/api/pacientes/documento/72345678 [!R05!])

echo.
echo   --- Consultas ---

set /p R06=<"%TEMP%\ms_t06.tmp" 2>nul
if "!R06!"=="200" (echo   [OK] GET  http://localhost:5000/api/consultas/medico/1) else (echo   [!!] GET  http://localhost:5000/api/consultas/medico/1 [!R06!])

echo.
echo   --- Documentos ---

set /p R07=<"%TEMP%\ms_t07.tmp" 2>nul
if "!R07!"=="200" (echo   [OK] GET  http://localhost:5000/api/documentos/medico/1) else (echo   [!!] GET  http://localhost:5000/api/documentos/medico/1 [!R07!])

echo.
echo   --- Servicio IA ---

set /p R08=<"%TEMP%\ms_t08.tmp" 2>nul
if "!R08!"=="200" (echo   [OK] POST http://localhost:8000/api/ia/generar-pdf) else (echo   [!!] POST http://localhost:8000/api/ia/generar-pdf [!R08!])

echo   [--] POST http://localhost:8000/api/ia/generar-word
echo   [--] POST http://localhost:8000/api/ia/procesar
echo   [--] POST http://localhost:8000/api/ia/transcribir [requiere audio]

del "%TEMP%\ms_t*.tmp" >nul 2>&1

echo.
echo =========================================
echo   MAPA DE ENDPOINTS (Ctrl+Click para abrir)
echo =========================================
echo.
echo   GATEWAY :5000
echo.
echo   Autenticacion (POST - probar en Postman)
echo   http://localhost:5000/api/autenticacion/iniciar-sesion
echo   http://localhost:5000/api/autenticacion/registro
echo.
echo   Pacientes
echo   http://localhost:5000/api/pacientes
echo   http://localhost:5000/api/pacientes/1
echo   http://localhost:5000/api/pacientes/2
echo   http://localhost:5000/api/pacientes/documento/72345678
echo   http://localhost:5000/api/pacientes/documento/45678901
echo.
echo   Consultas
echo   http://localhost:5000/api/consultas/medico/1
echo   http://localhost:5000/api/consultas/1
echo.
echo   Documentos
echo   http://localhost:5000/api/documentos/medico/1
echo   http://localhost:5000/api/documentos/1
echo   http://localhost:5000/api/documentos/consulta/1
echo.
echo   SERVICIO IA :8000
echo.
echo   http://localhost:8000/
echo   http://localhost:8000/docs
echo.
echo =========================================
echo   Presiona cualquier tecla para detener.
echo =========================================

pause >nul

echo.
echo Deteniendo servicios...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| find ":5000" ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| find ":8000" ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| find ":3000" ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>&1
echo [OK] Todos los servicios detenidos.
endlocal
