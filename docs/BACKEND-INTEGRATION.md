# 🔌 Backend Integration Guide

**Руководство по интеграции бэкенда для обработки форм**

---

## 📋 Быстрый старт

### 1. Установите зависимости backend

```bash
cd server
npm install
```

### 2. Настройте окружение

```bash
cp .env.example .env
# Отредактируйте .env с вашими настройками
```

### 3. Запустите backend сервер

```bash
# Development режим
npm run dev

# Production режим
npm start
```

Сервер запустится на `http://localhost:3000`

### 4. Запустите frontend

```bash
# В корне проекта
npm run dev:stable
```

Frontend запустится на `http://localhost:5173`

---

## 🔄 Как это работает

### Frontend → Backend Flow

```
1. Пользователь заполняет форму
2. Клик на кнопку "Отправить"
3. JavaScript валидирует данные
4. Отправка POST запроса на http://localhost:3000/api/submit-form
5. Backend:
   - Валидирует данные
   - Сохраняет в submissions.json
   - Отправляет email уведомление администратору
   - Отправляет авто-ответ пользователю
6. Backend возвращает JSON response
7. Frontend показывает сообщение успеха/ошибки
```

---

## 📡 API Эндпоинты

### POST `/api/submit-form`

**Отправка заявки с формы**

**Request:**

```javascript
fetch('http://localhost:3000/api/submit-form', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Иван Иванов',
    email: 'ivan@example.com',
    phone: '+79991234567',
    level: 'N5',
    message: 'Хочу записаться на курс',
    formType: 'hero' // или 'contact'
  })
});
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Заявка успешно отправлена!",
  "data": {
    "name": "Иван Иванов",
    "timestamp": "2025-10-16T12:00:00.000Z"
  }
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "Некорректный email адрес"
}
```

---

## 🛠️ Настройка Email

### Gmail (рекомендуется для разработки)

1. **Включите двухфакторную аутентификацию:**
   - https://myaccount.google.com/security

2. **Создайте App Password:**
   - https://myaccount.google.com/apppasswords
   - Выберите "Mail" и "Other (Custom name)"
   - Назовите "Japan School Backend"
   - Скопируйте 16-значный пароль

3. **Обновите `.env`:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd-efgh-ijkl-mnop  # 16-значный App Password
ADMIN_EMAIL=admin@japanschool.com
```

4. **Раскомментируйте код отправки email** в `server/index.js`:

Найдите строки:

```javascript
// await transporter.sendMail(mailOptions);
// await transporter.sendMail(userMailOptions);
```

Раскомментируйте:

```javascript
await transporter.sendMail(mailOptions);
await transporter.sendMail(userMailOptions);
```

### Yandex Mail

```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
EMAIL_USER=your-email@yandex.ru
EMAIL_PASS=your-password
```

### Mail.ru

```env
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
EMAIL_USER=your-email@mail.ru
EMAIL_PASS=your-password
```

---

## 🧪 Тестирование

### 1. Проверка здоровья сервера

```bash
curl http://localhost:3000/health
```

Ожидаемый ответ:

```json
{
  "status": "ok",
  "timestamp": "2025-10-16T12:00:00.000Z"
}
```

### 2. Тест отправки формы

```bash
curl -X POST http://localhost:3000/api/submit-form \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Тестовый пользователь",
    "email": "test@example.com",
    "phone": "+79991234567",
    "level": "N5",
    "message": "Тестовое сообщение",
    "formType": "hero"
  }'
```

### 3. Просмотр всех заявок

```bash
curl http://localhost:3000/api/submissions
```

### 4. Тест через браузер

Откройте `http://localhost:5173` и заполните форму в Hero секции или в разделе
Контакты.

---

## 💾 Хранение данных

### Текущее решение: JSON файл

Заявки сохраняются в `server/submissions.json`

**Преимущества:**

- Быстрая настройка
- Не требует БД
- Легко просматривать

**Недостатки:**

- Не масштабируется
- Нет транзакций
- Риск потери данных

### Миграция на БД (рекомендуется для production)

#### PostgreSQL

```bash
npm install pg
```

```javascript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Создание таблицы
await pool.query(`
  CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    level VARCHAR(50),
    message TEXT,
    form_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Вставка данных
await pool.query(
  'INSERT INTO submissions (name, email, phone, level, message, form_type) VALUES ($1, $2, $3, $4, $5, $6)',
  [name, email, phone, level, message, formType]
);
```

#### MongoDB

```bash
npm install mongodb
```

```javascript
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db('japanschool');
const submissions = db.collection('submissions');

// Вставка данных
await submissions.insertOne({
  name,
  email,
  phone,
  level,
  message,
  formType,
  createdAt: new Date()
});
```

---

## 🚀 Деплой

### Heroku

```bash
# Установите Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Войдите
heroku login

# Создайте приложение
heroku create japanschool-backend

# Установите переменные окружения
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASS=your-app-password
heroku config:set ADMIN_EMAIL=admin@japanschool.com

# Деплой
cd server
git init
git add .
git commit -m "Initial backend"
heroku git:remote -a japanschool-backend
git push heroku main
```

### Railway.app

```bash
# Установите Railway CLI
npm i -g @railway/cli

# Войдите
railway login

# Инициализируйте проект
cd server
railway init

# Установите переменные
railway variables set EMAIL_USER=your-email@gmail.com
railway variables set EMAIL_PASS=your-app-password

# Деплой
railway up
```

### Render.com

1. Зарегистрируйтесь на https://render.com
2. New → Web Service
3. Connect репозиторий
4. Root Directory: `server`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Добавьте Environment Variables

---

## 🔒 Безопасность

### ⚠️ TODO для Production

1. **Rate Limiting**

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // 5 запросов на IP
  message: 'Слишком много заявок. Попробуйте позже.'
});

app.post('/api/submit-form', limiter, async (req, res) => {
  // ...
});
```

2. **Helmet.js**

```bash
npm install helmet
```

```javascript
import helmet from 'helmet';
app.use(helmet());
```

3. **CAPTCHA**

```bash
npm install express-recaptcha
```

4. **HTTPS**

Используйте Let's Encrypt или сертификат от хостинга

5. **Environment Variables**

Никогда не коммитьте `.env` файл!

Добавьте в `.gitignore`:

```
server/.env
server/submissions.json
```

---

## 📊 Мониторинг

### Логирование

```bash
npm install winston
```

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

logger.info('New submission', { name, email });
```

### Мониторинг ошибок

- **Sentry**: https://sentry.io
- **LogRocket**: https://logrocket.com
- **Datadog**: https://www.datadoghq.com

---

## 🐛 Troubleshooting

### Backend не запускается

**Ошибка:** `EADDRINUSE: address already in use`

**Решение:**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### CORS ошибка

**Ошибка:**
`Access to fetch at 'http://localhost:3000/api/submit-form' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Решение:** Убедитесь что backend использует `cors()` middleware

### Email не отправляется

**Проблема 1:** Неверный App Password

**Решение:** Пересоздайте App Password в Gmail

**Проблема 2:** SMTP порт заблокирован

**Решение:** Используйте порт 587 вместо 465

**Проблема 3:** Код закомментирован

**Решение:** Раскомментируйте `await transporter.sendMail()`

### Форма не отправляется

**Проблема:** Backend не запущен

**Решение:**

```bash
cd server
npm run dev
```

**Проблема:** Неверный API endpoint

**Решение:** Проверьте `src/scripts/config/api.config.js`

---

## 📝 Roadmap

- [ ] Rate limiting
- [ ] CAPTCHA защита
- [ ] JWT authentication для admin панели
- [ ] Admin dashboard для просмотра заявок
- [ ] Email шаблоны (Handlebars/Pug)
- [ ] Webhooks интеграция (Telegram, Slack)
- [ ] SMS уведомления (Twilio)
- [ ] CRM интеграция (AmoCRM, Bitrix24)
- [ ] Миграция на TypeScript
- [ ] Unit и интеграционные тесты

---

## 📞 Поддержка

**Вопросы?** Откройте
[Issue на GitHub](https://github.com/Eduard-Bosak/japanschool/issues)

---

**Last Updated:** 2025-10-16 **Version:** 1.0.0
