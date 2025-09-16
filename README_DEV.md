# 🚀 AI-Buyer Development Guide

## 📁 Структура проекту

```
ai-buyer/
├── frontend/           # React + Vite фронтенд
├── backend/           # Python FastAPI бекенд  
├── browser-extension/ # Chrome/Firefox розширення
├── docs/             # Документація
└── venv/             # Python віртуальне середовище
```

## 🛠 Швидкий старт

### 1. Запуск фронтенду
```bash
# З кореня проекту
npm run dev

# Або безпосередньо з frontend/
cd frontend && npm run dev
```

### 2. Запуск бекенду
```bash
# Активувати Python середовище
source venv/bin/activate

# Запустити FastAPI сервер
cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Запуск всього стеку одночасно
```bash
npm run start
```

## 🌐 URL адреси

- **Frontend**: http://localhost:8081/
- **Backend API**: http://localhost:8000/
- **API Documentation**: http://localhost:8000/docs

## 🔧 Корисні команди

### Frontend
```bash
npm run dev          # Запуск dev сервера
npm run build        # Збірка для продакшн
npm run lint         # Лінтинг коду
npm run preview      # Попередній перегляд збірки
```

### Backend
```bash
python -m uvicorn main:app --reload  # Dev сервер з автоперезагрузкою
python -m pytest                    # Запуск тестів
python -m pytest --cov              # Тести з покриттям
```

### Browser Extension
```bash
# Встановлення в Chrome
1. Відкрийте chrome://extensions/
2. Увімкніть "Developer mode"
3. "Load unpacked" → виберіть папку browser-extension/
```

## 📦 Встановлення залежностей

### Перший раз
```bash
# Frontend залежності
cd frontend && npm install

# Backend залежності
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

## 🎯 VS Code Tasks

Відкрийте **ai-buyer.code-workspace** у VS Code для автоматичних tasks:

- `Ctrl+Shift+P` → "Tasks: Run Task"
- Виберіть "Start Full Stack" для запуску фронт+бек одночасно

## 📋 Troubleshooting

### Помилка "vite: command not found"
```bash
# Перейдіть у папку frontend
cd frontend && npm run dev
```

### Помилка Python
```bash
# Перевірте активацію віртуального середовища
source venv/bin/activate
python --version
```

### Порт зайнятий
```bash
# Знайти процес на порту
lsof -i :8081

# Зупинити процес
pkill -f "vite"
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Деплой dist/ папки
```

### Backend (Docker)
```bash
cd backend
docker build -t ai-buyer-backend .
docker run -p 8000:8000 ai-buyer-backend
```

## 📚 Документація

- [Multitoken Implementation](docs/FACEBOOK_MULTITOKEN_APPROACH.md)
- [Implementation Report](docs/MULTITOKEN_IMPLEMENTATION_REPORT.md)
- [Privacy Policy](docs/PRIVACY_POLICY.md)
- [Quick Start](QUICK_START.md)

Happy coding! 🎉