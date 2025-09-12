# AI-Buyer: Machine Learning Powered Facebook Advertising Platform

AI-Buyer - це повнофункціональна платформа для оптимізації Facebook реклами з використанням машинного навчання. Платформа надає прогнозування CTR, оптимізацію бюджету, виявлення аномалій та real-time аналітику.

## 🚀 Основні можливості

### Machine Learning

- **CTR Prediction**: Прогнозування Click-Through Rate використовуючи DeepCTR
- **Budget Optimization**: Оптимізація розподілу бюджету з Prophet для прогнозування часових рядів
- **Anomaly Detection**: Автоматичне виявлення аномалій у рекламних кампаніях
- **Real-time Predictions**: Миттєві прогнози через ML API

### Архітектура

- **FastAPI Backend**: Асинхронний Python бекенд з ML моделями
- **React TypeScript Frontend**: Сучасний користувацький інтерфейс
- **ClickHouse Database**: Високопродуктивна аналітична база даних
- **Kafka Streaming**: Real-time обробка даних
- **MLflow**: Управління версіями ML моделей
- **Celery + Redis**: Асинхронні задачі та кешування

### DevOps та Моніторинг

- **Docker Compose**: Повне контейнеризоване середовище
- **Prometheus + Grafana**: Моніторинг та візуалізація метрик
- **Nginx**: Reverse proxy та load balancing
- **Automated Tasks**: Періодичне перенавчання моделей

## 📋 Передумови

### Системні вимоги

- Docker 20.0+
- Docker Compose 2.0+
- Python 3.11+ (для локальної розробки)
- Node.js 18+ (для локальної розробки)
- 8GB+ RAM (рекомендовано)
- 50GB+ вільного місця

### Facebook API

- Facebook Developer Account
- Facebook App ID та App Secret
- Доступ до Facebook Marketing API

## 🛠 Налаштування та запуск

### 1. Клонування репозиторію

```bash
git clone <repository-url>
cd ai-buyer
```

### 2. Налаштування середовища

```bash
# Копіюйте приклад конфігурації
cp .env.development .env.local

# Відредагуйте .env.local з вашими налаштуваннями
nano .env.local
```

### 3. Налаштування Facebook API

Додайте ваші дані Facebook API у `.env.local`:

```bash
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
```

### 4. Запуск через Docker Compose

```bash
# Збірка та запуск всіх сервісів
docker-compose up -d

# Перегляд логів
docker-compose logs -f

# Зупинка сервісів
docker-compose down
```

### 5. Ініціалізація бази даних

```bash
# Запуск міграцій ClickHouse
docker-compose exec backend python -m alembic upgrade head

# Або вручну
docker-compose exec clickhouse clickhouse-client < backend/migrations/001_clickhouse_schema.sql
```

## 🌐 Доступ до сервісів

### Основні сервіси

- **Frontend**: <http://localhost:3000>
- **Backend API**: <http://localhost:8000>
- **API Documentation**: <http://localhost:8000/docs>

### Моніторинг та адміністрування

- **ClickHouse**: <http://localhost:8123>
- **Kafka UI**: <http://localhost:8080>
- **MLflow**: <http://localhost:5000>
- **MinIO**: <http://localhost:9001>
- **Prometheus**: <http://localhost:9090>
- **Grafana**: <http://localhost:3001> (admin/admin)

### Development Tools

- **Redis**: localhost:6379
- **Kafka**: localhost:9092

## 🔧 Локальна розробка

### Backend розробка

```bash
cd backend

# Створіть віртуальне середовище
python -m venv venv
source venv/bin/activate  # Linux/Mac
# або
venv\\Scripts\\activate  # Windows

# Встановіть залежності
pip install -r requirements.txt

# Запустіть сервер розробки
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend розробка

```bash
cd frontend

# Встановіть залежності
npm install

# Запустіть сервер розробки
npm run dev
```

### Celery Worker (для ML задач)

```bash
cd backend

# Запустіть Celery worker
celery -A backend.tasks.celery_app worker --loglevel=info --concurrency=4

# Запустіть Celery beat (для планувальника)
celery -A backend.tasks.celery_app beat --loglevel=info
```

## 📊 Використання ML функцій

### CTR Prediction

```python
from backend.ml.models.ctr_predictor import CTRPredictor

predictor = CTRPredictor()
features = {
    'age_range': '25-34',
    'gender': 'all',
    'device_platform': 'mobile',
    'bid_amount': 1.50,
    'ad_relevance_score': 8
}

prediction = predictor.predict(features)
print(f"Predicted CTR: {prediction['ctr_prediction']:.4f}")
```

### Budget Optimization

```python
from backend.ml.models.budget_optimizer import BudgetOptimizer

optimizer = BudgetOptimizer()
campaigns = [
    {'campaign_id': 'camp1', 'current_budget': 100},
    {'campaign_id': 'camp2', 'current_budget': 200}
]

recommendations = optimizer.optimize_budget_allocation(campaigns)
print(f"Optimization complete: {len(recommendations)} recommendations")
```

### Real-time Streaming

```python
from backend.services.streaming_service import get_streaming_service

# Відправка даних кампанії
service = get_streaming_service()
await service.stream_campaign_data(
    user_id="user123",
    campaigns_data=[campaign_metrics]
)
```

## 🔍 Моніторинг та логи

### Перегляд логів

```bash
# Всі сервіси
docker-compose logs -f

# Конкретний сервіс
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f celery-worker
```

### Метрики продуктивності

- **Grafana Dashboard**: <http://localhost:3001>
- **Prometheus Metrics**: <http://localhost:9090>
- **ML Model Metrics**: <http://localhost:5000> (MLflow)

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# ML models status
curl http://localhost:8000/api/v1/ml/health

# Database status
curl http://localhost:8123/ping
```

## 🧪 Тестування

### Backend тести

```bash
cd backend
pytest tests/ -v --cov=backend
```

### Frontend тести

```bash
cd frontend
npm run test
npm run test:coverage
```

### Integration тести

```bash
# Запустіть повний тестовий стек
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📖 API Документація

### ML API Endpoints

- `POST /api/v1/ml/predict/ctr` - CTR прогнозування
- `POST /api/v1/ml/optimize/budget` - Оптимізація бюджету
- `GET /api/v1/ml/detect/anomalies` - Виявлення аномалій
- `GET /api/v1/ml/models` - Список ML моделей

### Campaign API Endpoints

- `GET /api/v1/campaigns` - Список кампаній
- `POST /api/v1/campaigns` - Створення кампанії
- `PUT /api/v1/campaigns/{id}` - Оновлення кампанії
- `GET /api/v1/campaigns/{id}/metrics` - Метрики кампанії

### Analytics API Endpoints

- `GET /api/v1/analytics/dashboard` - Dashboard дані
- `GET /api/v1/analytics/performance` - Аналіз продуктивності
- `GET /api/v1/analytics/trends` - Аналіз трендів

## 🚀 Продакшн деплой

### AWS/GCP/Azure

```bash
# Налаштуйте змінні середовища для продакшну
export ENVIRONMENT=production
export CLICKHOUSE_HOST=your-clickhouse-host
export KAFKA_BOOTSTRAP_SERVERS=your-kafka-cluster
export MLFLOW_TRACKING_URI=your-mlflow-server

# Деплой з Docker
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes

```bash
# Застосуйте Kubernetes конфігурації
kubectl apply -f k8s/

# Перевірте статус
kubectl get pods -n ai-buyer
```

## 🛡 Безпека

### Рекомендації

- Змініть всі паролі за замовчуванням
- Використовуйте HTTPS у продакшні
- Налаштуйте брандмауер для обмеження доступу
- Регулярно оновлюйте залежності
- Увімкніть аудит API запитів

### Аутентифікація

```bash
# Генерація JWT секретного ключа
openssl rand -base64 32

# Додайте до .env.local
JWT_SECRET=your-generated-secret
```

## 📈 Масштабування

### Horizontal Scaling

- Додайте більше Celery workers для ML задач
- Масштабуйте Kafka partitions для більшого throughput
- Використовуйте ClickHouse кластер для великих обсягів даних

### Performance Optimization

- Налаштуйте connection pooling
- Увімкніть кешування Redis
- Оптимізуйте ClickHouse запити
- Використовуйте CDN для статичних файлів

## 🤝 Контрибюція

1. Fork репозиторій
2. Створіть feature branch (`git checkout -b feature/amazing-feature`)
3. Commit зміни (`git commit -m 'Add amazing feature'`)
4. Push до branch (`git push origin feature/amazing-feature`)
5. Відкрийте Pull Request

## 📄 Ліцензія

Цей проект ліцензовано під MIT License - дивіться [LICENSE](LICENSE) файл для деталей.

## 📞 Підтримка

- 📧 Email: <support@ai-buyer.com>
- 💬 Discord: [AI-Buyer Community](https://discord.gg/ai-buyer)
- 📖 Documentation: [docs.ai-buyer.com](https://docs.ai-buyer.com)
- 🐛 Issues: [GitHub Issues](https://github.com/ai-buyer/ai-buyer/issues)

## 🙏 Подяки

- [DeepCTR](https://github.com/shenweichen/DeepCTR) - За CTR prediction моделі
- [Prophet](https://facebook.github.io/prophet/) - За time series forecasting
- [FastAPI](https://fastapi.tiangolo.com/) - За чудовий API framework
- [ClickHouse](https://clickhouse.com/) - За високопродуктивну аналітичну БД
