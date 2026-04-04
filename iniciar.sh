#!/bin/bash
echo "========================================="
echo "  MedScribe AI - Iniciando servicios"
echo "========================================="

echo "[1/3] Iniciando servicio IA (Python)..."
cd servicio-ia
pip install -r requirements.txt -q
uvicorn principal:app --host 0.0.0.0 --port 8000 &
cd ..

echo "[2/3] Iniciando gateway (C# .NET Core)..."
cd gateway-dotnet/src/MedScribe.API
dotnet run --urls http://localhost:5000 &
cd ../../..

echo ""
echo "========================================="
echo "  MedScribe AI - Servicios activos"
echo "========================================="
echo "  Gateway:     http://localhost:5000"
echo "  Servicio IA: http://localhost:8000"
echo "  SQL Server:  localhost:1433"
echo "========================================="

wait
