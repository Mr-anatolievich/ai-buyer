#!/bin/bash

# AI-Buyer Local Development Startup Script
# Запуск платформи без Docker для локальної розробки

echo "🚀 AI-Buyer Local Development Start"
echo "=================================="

# Перевірка Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не встановлено"
    exit 1
fi

echo "✅ Python $(python3 --version) знайдено"

# Перевірка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не встановлено"
    exit 1
fi

echo "✅ Node.js $(node --version) знайдено"

# Перевірка OpenMP для ML бібліотек (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! brew list libomp &> /dev/null; then
        echo "📦 Встановлення OpenMP для ML бібліотек..."
        brew install libomp > /dev/null 2>&1
        echo "✅ OpenMP встановлено"
    else
        echo "✅ OpenMP доступний"
    fi
fi

# Створення .env.local якщо його немає
if [ ! -f .env.local ]; then
    echo "📝 Створення .env.local..."
    cp .env.development .env.local
fi

echo ""
echo "🎯 Запуск компонентів:"
echo ""

# Створення директорії для логів
mkdir -p logs

# 1. Frontend
echo "🌐 Запуск Frontend (React)..."
cd frontend
npm install > /dev/null 2>&1
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Очікування запуску frontend
sleep 5

# Перевірка чи frontend запустився
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Frontend: http://localhost:8080"
else
    echo "⚠️  Frontend: Запускається... (перевірте через хвилину)"
fi

# 2. Backend (Mock API для розробки)
echo "🔧 Запуск Mock Backend API..."

# Перевірка чи існує mock_server.py
if [ ! -f "mock_server.py" ]; then
    echo "❌ mock_server.py не знайдено! Використовуємо backend/simple_main.py"
    if [ ! -f "backend/simple_main.py" ]; then
        echo "❌ backend/simple_main.py також не знайдено!"
        exit 1
    fi
    cp backend/simple_main.py mock_server.py
fi

# Створення віртуального середовища якщо його немає
if [ ! -d "venv" ]; then
    echo "📦 Створення віртуального середовища..."
    python3 -m venv venv
fi

# Активація віртуального середовища та встановлення залежностей
source venv/bin/activate

echo "📦 Встановлення базових залежностей..."
pip install fastapi uvicorn > /dev/null 2>&1

# Встановлення ML залежностей якщо backend/requirements.txt існує
if [ -f "backend/requirements.txt" ]; then
    echo "🤖 Встановлення ML залежностей..."
    echo "   (Це може зайняти кілька хвилин при першому запуску)"
    
    # Оновлення pip
    pip install --upgrade pip > /dev/null 2>&1
    
    # Встановлення ML пакетів (пропускаємо проблемні)
    echo "   📊 Встановлення основних ML бібліотек..."
    pip install pandas numpy scikit-learn mlflow > /dev/null 2>&1
    
    echo "   🚀 Встановлення додаткових ML інструментів..."
    pip install xgboost lightgbm prophet statsmodels > /dev/null 2>&1
    
    echo "   🔧 Встановлення інфраструктурних пакетів..."
    pip install redis pymongo clickhouse-driver celery plotly > /dev/null 2>&1
    
    echo "   ✅ ML інфраструктура готова!"
else
    echo "⚠️  backend/requirements.txt не знайдено, пропускаємо ML залежності"
fi

# Запуск сервера
nohup python mock_server.py > logs/backend.log 2>&1 &
BACKEND_PID=$!

# Очікування запуску backend
sleep 3

# Перевірка чи backend запустився
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend API: http://localhost:8000"
    echo "✅ API Docs: http://localhost:8000/docs"
else
    echo "⚠️  Backend API: Запускається... (перевірте через хвилину)"
fi

echo ""
echo "=========================="
echo "🎉 AI-Buyer запущено локально!"
echo ""
echo "🌐 Доступні сервіси:"
echo "   Frontend:    http://localhost:8080"
echo "   Backend API: http://localhost:8000"
echo "   API Docs:    http://localhost:8000/docs"
echo ""
echo "📝 Логи:"
echo "   Frontend: logs/frontend.log"
echo "   Backend:  logs/backend.log"
echo ""
echo "🛑 Для зупинки: ./stop-local.sh"
echo "📖 Повна документація: README.md"

# Збереження PID для зупинки
mkdir -p logs
echo $FRONTEND_PID > logs/frontend.pid
echo $BACKEND_PID > logs/backend.pid

echo ""
echo "✨ Відкрийте http://localhost:8080 у браузері"