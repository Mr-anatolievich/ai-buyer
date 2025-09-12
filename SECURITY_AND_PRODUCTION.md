# 🔐 Безпека та Production Налаштування

## Критичні питання безпеки для виправлення

### 1. 🚨 Секретні ключі та паролі

**Проблема:** В `.env.development` є placeholder значення для секретних ключів
```env
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
```

**Рішення:**
```bash
# Генерація безпечних ключів
openssl rand -base64 32  # Для SECRET_KEY
openssl rand -base64 64  # Для JWT_SECRET

# Додати до .env.local:
SECRET_KEY=hGf8K9mN2pQ7rT3vX6zA8bE5cH9jM4nP7sV1wY4uI8oL2kS6fG3hJ9mQ2pT5x
JWT_SECRET=aB4fG8hK2mN5pQ9rT7vW1zA4bE6cH8jL3nP6sU9xY2zA5dF8gK1mP4qT7uX0y
```

### 2. 🗄️ Паролі баз даних

**Проблема:** Weak passwords в docker-compose.yml
```yaml
POSTGRES_PASSWORD=postgres
CLICKHOUSE_PASSWORD=clickhouse
REDIS_PASSWORD=redis123
```

**Рішення:**
```yaml
# Сильні паролі (приклад)
POSTGRES_PASSWORD=P@ssw0rd_P0stgr3s_2024!
CLICKHOUSE_PASSWORD=Ch_S3cur3_2024_@dm1n!
REDIS_PASSWORD=R3d1s_$ecur3_K3y_2024
```

### 3. 🌐 HTTPS та SSL

**Проблема:** HTTP у production
**Рішення:**
```nginx
# nginx.conf для HTTPS
server {
    listen 443 ssl;
    ssl_certificate /etc/ssl/certs/ai-buyer.crt;
    ssl_certificate_key /etc/ssl/private/ai-buyer.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256;
}
```

### 4. 🔑 Facebook API безпека

**Критично:** Ніколи не зберігайте токени в коді!
```typescript
// ❌ НЕПРАВИЛЬНО
const accessToken = "EAAK6iOQnyksBP...";

// ✅ ПРАВИЛЬНО
const accessToken = process.env.VITE_FACEBOOK_ACCESS_TOKEN;
```

## Production-ready налаштування

### 1. 📋 Environment Variables

**Production .env файл:**
```env
# Application
NODE_ENV=production
ENVIRONMENT=production
DEBUG=false

# Database
DATABASE_URL=postgresql://user:password@clickhouse:5432/ai_buyer
CLICKHOUSE_URL=http://clickhouse:8123
REDIS_URL=redis://redis:6379

# API Keys (використовуйте AWS Secrets Manager)
FACEBOOK_APP_ID=${AWS_SECRET:facebook_app_id}
FACEBOOK_APP_SECRET=${AWS_SECRET:facebook_app_secret}

# ML Models
MLFLOW_TRACKING_URI=http://mlflow:5000
MODEL_STORAGE_PATH=/app/models

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
PROMETHEUS_METRICS=true
```

### 2. 🐳 Production Docker Configuration

**docker-compose.prod.yml:**
```yaml
version: '3.8'
services:
  backend:
    image: ai-buyer/backend:latest
    restart: unless-stopped
    environment:
      - ENVIRONMENT=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    
  frontend:
    image: ai-buyer/frontend:latest
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
```

### 3. 🔒 Authentication & Authorization

**JWT Middleware:**
```python
# backend/middleware/auth.py
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(
            credentials.credentials, 
            SECRET_KEY, 
            algorithms=["HS256"]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### 4. 📊 Logging & Monitoring

**Structured Logging:**
```python
# backend/utils/logging.py
import structlog
import logging

def setup_logging():
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )
    
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
```

### 5. 🛡️ Security Headers

**Nginx security headers:**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## Checklist перед Production

- [ ] **Secrets Management**: Всі паролі в AWS Secrets Manager або аналогічному сервісі
- [ ] **SSL Certificates**: HTTPS налаштовано з валідними сертифікатами
- [ ] **Backup Strategy**: Автоматичні backups ClickHouse і PostgreSQL
- [ ] **Monitoring**: Prometheus + Grafana + AlertManager налаштовані
- [ ] **Error Tracking**: Sentry або аналогічний сервіс
- [ ] **Load Testing**: Навантажувальне тестування виконано
- [ ] **Security Scan**: Сканування на вразливості (npm audit, safety для Python)
- [ ] **GDPR Compliance**: Обробка персональних даних відповідає вимогам
- [ ] **Rate Limiting**: API rate limiting налаштовано
- [ ] **Firewall Rules**: Мережеві правила безпеки

## Emergency Response

### 🚨 Security Incident Response

1. **Виявлення**: Monitoring + alerting
2. **Ізоляція**: Негайне відключення скомпрометованих сервісів
3. **Оцінка**: Аналіз масштабу проблеми
4. **Відновлення**: Rollback до стабільної версії
5. **Документування**: Post-mortem аналіз

### 📞 Emergency Contacts

```yaml
# emergency.yml
contacts:
  security_team: security@ai-buyer.com
  devops_lead: devops@ai-buyer.com
  cto: cto@ai-buyer.com
  
runbooks:
  database_failure: https://wiki.ai-buyer.com/runbooks/db-failure
  security_breach: https://wiki.ai-buyer.com/runbooks/security
  high_load: https://wiki.ai-buyer.com/runbooks/scaling
```

## Compliance

### GDPR Requirements
- **Data Encryption**: All PII encrypted at rest and in transit
- **Right to Delete**: User data deletion implemented
- **Data Export**: User data export functionality
- **Consent Management**: Explicit consent for data processing
- **Data Processing Logs**: Audit trail for all data operations

### Financial Data Security
- **PCI DSS**: If processing payments
- **Data Retention**: Automated data purging
- **Access Control**: Role-based access to sensitive data