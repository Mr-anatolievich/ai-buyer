# ML Packages Status - AI-Buyer

## ✅ Працюючі ML Пакети

Наступні ML бібліотеки успішно встановлені та протестовані:

### Основні ML Framework
- **pandas** 2.3.2 - Обробка та аналіз даних
- **numpy** 2.3.3 - Численні обчислення
- **scikit-learn** 1.7.2 - Машинне навчання
- **mlflow** 3.3.2 - Управління ML моделями

### Gradient Boosting
- **xgboost** 3.0.5 - Екстремальний градієнтний бустінг
- **lightgbm** 4.6.0 - Швидкий градієнтний бустінг

### Часові ряди та статистика
- **prophet** 1.1.7 - Прогнозування часових рядів
- **statsmodels** 0.14.5 - Статистичні моделі

### Візуалізація
- **plotly** 6.3.0 - Інтерактивні графіки

### Інфраструктура
- **redis** 6.4.0 - In-memory база даних
- **pymongo** 4.15.0 - MongoDB драйвер
- **clickhouse-driver** 0.2.9 - ClickHouse драйвер
- **celery** 5.5.3 - Асинхронні завдання

## ❌ Проблемні пакети

### TensorFlow
- **Статус**: Встановлено, але не працює на macOS ARM
- **Помилка**: `mutex lock failed: Invalid argument`
- **Рішення**: Використовувати scikit-learn для ML завдань

### DeepCTR
- **Статус**: Не встановлено через конфлікти версій h5py
- **Рішення**: Використовувати XGBoost/LightGBM для рекомендаційних систем

## 🛠 Встановлення

### Автоматичне
```bash
./start-local.sh
```

### Ручне
```bash
# Створення віртуального середовища
python3 -m venv venv
source venv/bin/activate

# Встановлення OpenMP (macOS)
brew install libomp

# Встановлення робочих пакетів
pip install pandas numpy scikit-learn mlflow
pip install xgboost lightgbm prophet statsmodels
pip install redis pymongo clickhouse-driver celery plotly
```

## 🔧 Конфігурація

Після встановлення OpenMP через Homebrew, XGBoost та LightGBM працюють коректно.

Для роботи з ML моделями використовуйте:
- **scikit-learn** для базового ML
- **XGBoost/LightGBM** для градієнтного бустінгу
- **Prophet** для прогнозування часових рядів
- **MLflow** для управління моделями

## 📊 Використання

Основні ML можливості доступні через:
- `/api/v1/models/` - Управління моделями
- `/api/v1/predictions/` - Прогнозування
- `/api/v1/analytics/` - Аналітика

Дата оновлення: 13 вересня 2025