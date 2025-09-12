#!/bin/bash

# AI-Buyer Local Development Stop Script

echo "🛑 Зупинка AI-Buyer локальних сервісів..."

# Зупинка за PID файлами
if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "✅ Frontend зупинено (PID: $FRONTEND_PID)"
    fi
    rm logs/frontend.pid
fi

if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "✅ Backend зупинено (PID: $BACKEND_PID)"
    fi
    rm logs/backend.pid
fi

# Додаткова зупинка за портами
echo "🔍 Пошук процесів на портах..."

# Frontend (порт 8080 або 3000)
FRONTEND_PROC=$(lsof -ti:8080,3000 2>/dev/null)
if [ ! -z "$FRONTEND_PROC" ]; then
    kill $FRONTEND_PROC
    echo "✅ Frontend процеси на портах 8080/3000 зупинено"
fi

# Backend (порт 8000)
BACKEND_PROC=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$BACKEND_PROC" ]; then
    kill $BACKEND_PROC
    echo "✅ Backend процеси на порту 8000 зупинено"
fi

echo ""
echo "🎉 Всі локальні сервіси зупинено!"
echo "🚀 Для повторного запуску: ./start-local.sh"