#!/bin/bash

# AI-Buyer Quick Start Script
# Цей скрипт автоматично налаштовує та запускає всю ML платформу

echo "🚀 AI-Buyer Quick Start"
echo "========================"

# Перевірка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не встановлено. Будь ласка, встановіть Docker та Docker Compose"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не встановлено"
    exit 1
fi

echo "✅ Docker та Docker Compose знайдено"

# Створення .env файлу якщо його немає
if [ ! -f .env.local ]; then
    echo "📝 Створення .env.local файлу..."
    cp .env.development .env.local
    echo "⚠️  Будь ласка, відредагуйте .env.local з вашими налаштуваннями Facebook API"
fi

# Створення директорій для volume mounts
echo "📁 Створення необхідних директорій..."
mkdir -p logs/backend
mkdir -p logs/frontend
mkdir -p logs/celery
mkdir -p data/clickhouse
mkdir -p data/kafka
mkdir -p data/redis
mkdir -p data/mlflow
mkdir -p data/minio
mkdir -p data/prometheus
mkdir -p data/grafana

# Встановлення прав доступу
echo "🔐 Налаштування прав доступу..."
chmod -R 755 logs data

# Збірка та запуск контейнерів
echo "🏗️  Збірка та запуск сервісів..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Очікування запуску сервісів
echo "⏳ Очікування запуску сервісів..."
sleep 30

# Перевірка health checks
echo "🔍 Перевірка стану сервісів..."

services=(
    "backend:8000/health"
    "frontend:3000"
    "clickhouse:8123/ping"
    "kafka:9092"
    "redis:6379"
    "mlflow:5000"
)

all_healthy=true

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    url=$(echo $service | cut -d: -f2-)
    
    if [ "$name" = "kafka" ] || [ "$name" = "redis" ]; then
        if docker-compose ps $name | grep -q "Up"; then
            echo "✅ $name: Working"
        else
            echo "❌ $name: Not running"
            all_healthy=false
        fi
    else
        if curl -s -f http://localhost:$url > /dev/null 2>&1; then
            echo "✅ $name: http://localhost:$url"
        else
            echo "❌ $name: http://localhost:$url (not responding)"
            all_healthy=false
        fi
    fi
done

echo ""
echo "========================"

if [ "$all_healthy" = true ]; then
    echo "🎉 Всі сервіси успішно запущено!"
    echo ""
    echo "🌐 Доступні сервіси:"
    echo "   Frontend:        http://localhost:3000"
    echo "   Backend API:     http://localhost:8000"
    echo "   API Docs:        http://localhost:8000/docs"
    echo "   ClickHouse:      http://localhost:8123"
    echo "   MLflow:          http://localhost:5000"
    echo "   Kafka UI:        http://localhost:8080"
    echo "   MinIO:           http://localhost:9001"
    echo "   Grafana:         http://localhost:3001 (admin/admin)"
    echo "   Prometheus:      http://localhost:9090"
    echo ""
    echo "📝 Для перегляду логів: docker-compose logs -f [service_name]"
    echo "🛑 Для зупинки: docker-compose down"
else
    echo "⚠️  Деякі сервіси не запустилися правильно"
    echo "📝 Перевірте логи: docker-compose logs"
fi

echo ""
echo "📖 Детальну документацію дивіться у README.md"