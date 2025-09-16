#!/bin/bash

# Скрипт для перебудови браузерного розширення AI-Buyer

echo "🔧 Перебудова браузерного розширення AI-Buyer..."

cd "$(dirname "$0")"

# Перевірка, чи існують всі необхідні файли
REQUIRED_FILES=("manifest.json" "popup.html" "popup.js" "content.js" "background.js")

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Файл $file не знайдено!"
        exit 1
    fi
done

echo "✅ Всі необхідні файли знайдено"

# Перевірка структури іконок
if [ ! -d "icons" ]; then
    echo "⚠️ Папка icons не знайдена, створюємо..."
    mkdir -p icons
fi

# Створення архіву розширення
echo "📦 Створення архіву розширення..."

# Видаляємо старий архів
rm -f ../browser-extension.zip

# Створюємо новий архів
zip -r ../browser-extension.zip . -x "*.DS_Store" "*.git*" "rebuild.sh" "README.md" "UPDATE_INSTRUCTIONS.md"

echo "✅ Архів browser-extension.zip створено успішно!"

echo ""
echo "📋 Інструкції по установці:"
echo "1. Відкрийте Chrome://extensions/"
echo "2. Увімкніть режим розробника"
echo "3. Натисніть 'Завантажити розпаковане розширення'"
echo "4. Виберіть папку browser-extension"
echo "5. Або використайте архів browser-extension.zip"
echo ""
echo "🔧 Для оновлення існуючого розширення:"
echo "1. Відкрийте Chrome://extensions/"
echo "2. Знайдіть 'AI-Buyer Facebook Token Extractor'"
echo "3. Натисніть кнопку оновлення (🔄)"
echo ""
echo "🎯 Використання:"
echo "1. Відкрийте facebook.com/adsmanager"
echo "2. Авторизуйтеся у вашому акаунті"
echo "3. Натисніть на іконку розширення"
echo "4. Натисніть 'Витягти дані'"
echo ""

# Показуємо версію
VERSION=$(grep '"version"' manifest.json | cut -d'"' -f4)
echo "📌 Версія розширення: $VERSION"

echo "🚀 Готово!"