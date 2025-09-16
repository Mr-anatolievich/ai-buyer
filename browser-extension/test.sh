#!/bin/bash

# Тестовий скрипт для швидкої перевірки розширення

echo "🧪 Швидкий тест браузерного розширення"
echo "======================================"

echo ""
echo "📁 Перевірка файлів розширення:"

# Перевірка основних файлів
files=("manifest.json" "popup.html" "popup.js" "content.js" "background.js")
for file in "${files[@]}"; do
    if [ -f "/Users/yaroslavsaienko/ai-buyer/browser-extension/$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - НЕ ЗНАЙДЕНО!"
    fi
done

echo ""
echo "🔍 Перевірка структури manifest.json:"

# Перевірка ключових елементів manifest
manifest="/Users/yaroslavsaienko/ai-buyer/browser-extension/manifest.json"
if grep -q '"scripting"' "$manifest"; then
    echo "✅ Дозвіл 'scripting' присутній"
else
    echo "❌ Дозвіл 'scripting' відсутній"
fi

if grep -q '"content_scripts"' "$manifest"; then
    echo "✅ Content scripts налаштовані"
else
    echo "❌ Content scripts не налаштовані"
fi

if grep -q '"background"' "$manifest"; then
    echo "✅ Background script налаштований"
else
    echo "❌ Background script не налаштований"
fi

echo ""
echo "📊 Розмір файлів:"
ls -lh /Users/yaroslavsaienko/ai-buyer/browser-extension/*.js | awk '{print $9 " - " $5}'

echo ""
echo "📦 Архів розширення:"
if [ -f "/Users/yaroslavsaienko/ai-buyer/browser-extension.zip" ]; then
    echo "✅ browser-extension.zip створений"
    echo "📏 Розмір: $(ls -lh /Users/yaroslavsaienko/ai-buyer/browser-extension.zip | awk '{print $5}')"
else
    echo "❌ browser-extension.zip не знайдений"
fi

echo ""
echo "🎯 Наступні кроки:"
echo "1. Відкрийте chrome://extensions/"
echo "2. Натисніть кнопку оновлення (🔄) для 'AI-Buyer Facebook Token Extractor'"
echo "3. Відкрийте https://business.facebook.com/adsmanager/"
echo "4. Натисніть на іконку розширення"
echo "5. Перевірте консоль браузера (F12) для логів"

echo ""
echo "🐛 При виникненні проблем:"
echo "1. Перевірте консоль на наявність помилок"
echo "2. Переконайтеся, що ви авторизовані на Facebook"
echo "3. Спробуйте оновити сторінку Facebook"
echo "4. Перевстановіть розширення повністю"

echo ""
echo "✅ Тест завершено!"