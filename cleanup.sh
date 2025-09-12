#!/bin/bash

# AI-Buyer Cleanup Script
# Цей скрипт зупиняє всі сервіси та очищує дані (якщо потрібно)

echo "🛑 AI-Buyer Cleanup"
echo "==================="

# Функція для підтвердження
confirm() {
    while true; do
        read -p "$1 (y/n): " yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Будь ласка, відповідайте y або n.";;
        esac
    done
}

# Зупинка контейнерів
echo "🔌 Зупинка всіх сервісів..."
docker-compose down

# Видалення контейнерів
if confirm "Видалити всі контейнери?"; then
    echo "🗑️  Видалення контейнерів..."
    docker-compose down --remove-orphans --volumes
fi

# Видалення образів
if confirm "Видалити Docker образи AI-Buyer?"; then
    echo "📦 Видалення образів..."
    docker images | grep ai-buyer | awk '{print $3}' | xargs -r docker rmi -f
fi

# Очищення volume даних
if confirm "Видалити всі дані (volumes)?"; then
    echo "💾 Видалення volumes..."
    docker volume ls | grep ai-buyer | awk '{print $2}' | xargs -r docker volume rm
fi

# Очищення локальних даних
if confirm "Видалити локальні дані (logs, data)?"; then
    echo "📂 Видалення локальних даних..."
    rm -rf logs data
fi

# Видалення тимчасових файлів
echo "🧹 Видалення тимчасових файлів..."
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".pytest_cache" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true

# Очищення невикористовуваних Docker ресурсів
if confirm "Очистити всі невикористовувані Docker ресурси?"; then
    echo "🧼 Очищення Docker system..."
    docker system prune -a -f
fi

echo ""
echo "✅ Очищення завершено!"
echo "🔄 Для повторного запуску використовуйте: ./start.sh"