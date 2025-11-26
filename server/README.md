# 🎌 Japan School Backend Server

**Backend API для обработки заявок с формы лендинга школы японского языка**

---

## 📋 Содержание

- [Установка](#установка)
- [Конфигурация](#конфигурация)
- [Запуск](#запуск)
- [API Endpoints](#api-endpoints)
- [Email настройка](#email-настройка)
- [Хранение данных](#хранение-данных)

---

## 🚀 Установка

```bash
cd server
npm install
```

---

## ⚙️ Конфигурация

1. Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

2. Отредактируйте `.env` с вашими настройками:

```env
PORT=3000

# Gmail Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-digit-app-password

ADMIN_EMAIL=admin@japanschool.com
FRONTEND_URL=http://localhost:5173
```

---

## 🏃 Запуск

### Development режим (с авто-перезагрузкой):

```bash
npm run dev
```

### Production режим:

```bash
npm start
```

Сервер запустится на `http://localhost:3000`

---

## 📡 API Endpoints

### 1. POST `/api/submit-form`

**Описание:** Отправка заявки с формы

**Body (JSON):**

```json
{
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "phone": "+79991234567",
  "level": "N5",
  "message": "Хочу записаться на курс",
  "formType": "hero"
}
```

**Response Success (200):**

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

**Response Error (400):**

```json
{
  "success": false,
  "error": "Некорректный email адрес"
}
```

---

### 2. GET `/api/submissions`

**Описание:** Получить все заявки (админ панель)

**Response:**

```json
{
  "success": true,
  "count": 5,
  "submissions": [
    {
      "name": "Иван Иванов",
      "email": "ivan@example.com",
      "phone": "+79991234567",
      "level": "N5",
      "message": "Хочу записаться",
      "formType": "hero",
      "timestamp": "2025-10-16T12:00:00.000Z"
    }
  ]
}
```

---

### 3. GET `/health`

**Описание:** Проверка работоспособности сервера

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-16T12:00:00.000Z"
}
```

---

## 📧 Email настройка

### Gmail

1. Включите двухфакторную аутентификацию
2. Создайте App Password:
   - Перейдите: https://myaccount.google.com/apppasswords
   - Выберите "Mail" и "Other (Custom name)"
   - Назовите "Japan School Backend"
   - Скопируйте 16-значный пароль
3. Используйте этот пароль в `.env` как `EMAIL_PASS`

### Другие провайдеры

Настройте SMTP параметры в `.env`:

**Yandex:**

```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
```

**Mail.ru:**

```env
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
```

---

## 💾 Хранение данных

Заявки сохраняются в `server/submissions.json`

**Формат:**

```json
[
  {
    "name": "Иван Иванов",
    "email": "ivan@example.com",
    "phone": "+79991234567",
    "level": "N5",
    "message": "Сообщение",
    "formType": "hero",
    "timestamp": "2025-10-16T12:00:00.000Z"
  }
]
```

### Миграция на БД (опционально)

Для production рекомендуется использовать:

- **PostgreSQL** - для реляционных данных
- **MongoDB** - для документо-ориентированных данных
- **SQLite** - для простых проектов

---

## 🔒 Безопасность

✅ **Реализовано:**

- CORS protection
- Input sanitization (XSS protection)
- Email validation
- Phone validation
- Rate limiting (рекомендуется добавить)

⚠️ **TODO для production:**

- Добавить rate limiting (express-rate-limit)
- HTTPS сертификат
- Helmet.js для security headers
- CAPTCHA защита
- JWT authentication для admin endpoints

---

## 🧪 Тестирование

### curl

```bash
# Test health
curl http://localhost:3000/health

# Submit form
curl -X POST http://localhost:3000/api/submit-form \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Тест",
    "email": "test@example.com",
    "phone": "+79991234567",
    "level": "N5",
    "message": "Тестовое сообщение"
  }'

# Get submissions
curl http://localhost:3000/api/submissions
```

### Postman

Импортируйте коллекцию:

1. POST `http://localhost:3000/api/submit-form`
2. GET `http://localhost:3000/api/submissions`
3. GET `http://localhost:3000/health`

---

## 🚀 Деплой

### Heroku

```bash
heroku create japanschool-backend
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASS=your-app-password
git push heroku main
```

### Railway

```bash
railway init
railway up
```

### Vercel (Serverless)

Требуется адаптация под serverless функции.

---

## 📝 Логи

Сервер выводит логи в консоль:

```
✅ New submission from Иван Иванов (ivan@example.com)
❌ Error processing form: ValidationError
```

Для production рекомендуется:

- Winston logger
- Логирование в файл
- Мониторинг (Sentry, LogRocket)

---

## 🔧 Разработка

### Структура проекта

```
server/
├── index.js           # Главный файл сервера
├── package.json       # Зависимости
├── .env              # Конфигурация (не коммитится)
├── .env.example      # Пример конфигурации
├── submissions.json  # Хранилище заявок (автосоздаётся)
└── README.md         # Документация
```

### Добавление новых endpoint'ов

```javascript
app.post('/api/new-endpoint', async (req, res) => {
  try {
    // Your logic here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## 📚 Зависимости

- **express** - Web framework
- **cors** - CORS middleware
- **nodemailer** - Email отправка
- **dotenv** - Environment variables

---

## 🐛 Troubleshooting

### Ошибка: EADDRINUSE

**Проблема:** Порт 3000 уже занят

**Решение:**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Ошибка: Email не отправляется

**Проблема:** Неверные SMTP настройки

**Решение:**

1. Проверьте `.env` файл
2. Убедитесь что используете App Password (не обычный пароль)
3. Раскомментируйте строки с `transporter.sendMail()` в `index.js`

### Ошибка: CORS blocked

**Проблема:** Frontend не может отправить запрос

**Решение:** Убедитесь что `FRONTEND_URL` в `.env` совпадает с URL вашего
фронтенда

---

## 📞 Поддержка

Вопросы и баг-репорты:
[GitHub Issues](https://github.com/Eduard-Bosak/japanschool/issues)

---

**Last Updated:** 2025-10-16 **Version:** 1.0.0 **Maintainer:** Eduard Bosak
