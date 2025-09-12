#!/bin/bash

echo "🔍 Перевіряємо Docker установку..."

# Перевірка Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker встановлено: $(docker --version)"
else
    echo "❌ Docker не знайдено"
    echo "📥 Встановіть Docker Desktop з: https://docs.docker.com/desktop/mac/install/"
    exit 1
fi

# Перевірка Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose встановлено: $(docker-compose --version)"
elif docker compose version &> /dev/null; then
    echo "✅ Docker Compose (новий) встановлено: $(docker compose version)"
else
    echo "❌ Docker Compose не знайдено"
    exit 1
fi

# Перевірка чи працює Docker daemon
if docker info &> /dev/null; then
    echo "✅ Docker daemon працює"
else
    echo "❌ Docker daemon не працює"
    echo "🔄 Запустіть Docker Desktop та дочекайтесь завантаження"
    exit 1
fi

echo ""
echo "🎉 Docker готовий до використання!"
echo "🚀 Тепер можете запустити: ./start.sh"