# 🚨 Критические исправления перед продакшеном

## ⏱️ Время: 20 минут

---

## 1️⃣ Обновить nodemailer (5 минут)

### Проблема:

```
nodemailer <7.0.7
Severity: moderate
CVE: GHSA-mm7p-fcc7-pg87
```

### Решение:

```bash
cd server
npm install nodemailer@latest
npm audit
```

**Ожидаемый результат:** `found 0 vulnerabilities`

---

## 2️⃣ Настроить Gmail App Password (5 минут)

### Проблема:

Email отправка не работает, нужен App Password вместо обычного пароля.

### Решение:

1. **Включить 2FA в Google Account**
   - Перейти: https://myaccount.google.com/security
   - Включить "2-Step Verification"

2. **Создать App Password**
   - Перейти: https://myaccount.google.com/apppasswords
   - Выбрать: App = "Mail", Device = "Windows Computer"
   - Скопировать сгенерированный пароль (16 символов)

3. **Обновить server/.env**

   ```env
   EMAIL_USER=eduardbosak@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx  # 16-значный App Password
   ```

4. **Перезапустить backend**
   ```bash
   cd server
   node index.js
   ```

**Тест:**

```bash
# Отправить тестовую заявку через форму
# Проверить inbox: eduardbosak@gmail.com
```

---

## 3️⃣ Убрать hardcoded password (10 минут)

### Проблема:

```javascript
const ADMIN_PASSWORD = 'admin123'; // В admin.html строка 1082
```

### Решение:

#### Вариант A: Быстрый (Environment Variable)

**1. Создать `server/.env`:**

```env
ADMIN_PASSWORD=YourStrongPassword123!
```

**2. Обновить `server/index.js`:**

```javascript
import dotenv from 'dotenv';
dotenv.config();

// Добавить endpoint для проверки пароля
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;

  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true, token: 'simple-token' });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});
```

**3. Обновить `server/admin.html` (строка 1084-1110):**

```javascript
async function handleLogin(event) {
  event.preventDefault();

  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await response.json();

    if (data.success) {
      sessionStorage.setItem('adminAuthenticated', 'true');
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('adminPanel').classList.add('authenticated');
      loadSubmissions();
    } else {
      errorMessage.classList.add('show');
      document.getElementById('password').value = '';
      setTimeout(() => errorMessage.classList.remove('show'), 3000);
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.textContent = 'Ошибка сервера';
    errorMessage.classList.add('show');
  }
}
```

**4. Удалить строку 1082 в admin.html:**

```javascript
// УДАЛИТЬ: const ADMIN_PASSWORD = 'admin123';
```

**5. Удалить hint в admin.html (строка 736-738):**

```html
<!-- УДАЛИТЬ:
<div style="margin-top: 20px;">
  <p>💡 Подсказка: пароль по умолчанию <code>admin123</code></p>
</div>
-->
```

---

#### Вариант B: Безопасный (Bcrypt + JWT) - Рекомендуется

**1. Установить зависимости:**

```bash
cd server
npm install bcrypt jsonwebtoken
```

**2. Сгенерировать hash пароля:**

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourStrongPassword123!', 10, (err, hash) => console.log(hash));"
```

Скопировать вывод (например: `$2b$10$abcdef...`)

**3. Создать `server/.env`:**

```env
ADMIN_PASSWORD_HASH=$2b$10$abcdef...  # Ваш hash
JWT_SECRET=your-random-secret-key-here-min-32-chars
```

**4. Обновить `server/index.js`:**

```javascript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Login endpoint
app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body;

  try {
    const isValid = await bcrypt.compare(
      password,
      process.env.ADMIN_PASSWORD_HASH
    );

    if (isValid) {
      const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, {
        expiresIn: '1h'
      });

      res.json({ success: true, token });
    } else {
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Middleware для защиты /api/submissions
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.admin = decoded;
    next();
  });
}

// Защитить endpoint
app.get('/api/submissions', verifyToken, async (req, res) => {
  // ... существующий код
});
```

**5. Обновить `server/admin.html`:**

```javascript
async function handleLogin(event) {
  event.preventDefault();

  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await response.json();

    if (data.success) {
      // Сохранить JWT token
      sessionStorage.setItem('adminToken', data.token);
      sessionStorage.setItem('adminAuthenticated', 'true');

      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('adminPanel').classList.add('authenticated');
      loadSubmissions();
    } else {
      errorMessage.classList.add('show');
      document.getElementById('password').value = '';
      setTimeout(() => errorMessage.classList.remove('show'), 3000);
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.textContent = 'Ошибка сервера';
    errorMessage.classList.add('show');
  }
}

async function loadSubmissions() {
  const token = sessionStorage.getItem('adminToken');

  try {
    const response = await fetch('/api/submissions', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 401 || response.status === 403) {
      // Token expired, logout
      handleLogout();
      return;
    }

    const result = await response.json();
    // ... rest of code
  } catch (error) {
    // ... error handling
  }
}
```

---

## 4️⃣ Добавить rate limiting на login (опционально, 5 минут)

### Решение:

**1. Установить:**

```bash
cd server
npm install express-rate-limit
```

**2. Добавить в `server/index.js`:**

```javascript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // 5 попыток
  message: 'Слишком много попыток входа. Попробуйте через 15 минут.',
  standardHeaders: true,
  legacyHeaders: false
});

app.post('/api/admin/login', loginLimiter, async (req, res) => {
  // ... existing code
});
```

---

## 5️⃣ Убрать console.log из production (5 минут)

### Проблема:

```javascript
// server/index.js:224
console.log(`✅ New submission from ${sanitizedData.name}`);

// src/scripts/components/enhanced-animations.ts:297
console.log('✨ Enhanced animations initialized');
```

### Решение:

**Вариант A: Обернуть в условие**

```javascript
if (process.env.NODE_ENV !== 'production') {
  console.log('✅ New submission from', sanitizedData.name);
}
```

**Вариант B: Использовать logger**

```bash
npm install winston
```

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'error' : 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Использование:
logger.info('New submission from', sanitizedData.name);
```

**Вариант C: Удалить (самый простой)**

```javascript
// Просто удалить строки с console.log
```

---

## ✅ Проверка после исправлений

### Тест 1: Backend запускается

```bash
cd server
node index.js
```

**Ожидаемый вывод:**

```
✅ Server running on http://localhost:3000
✅ Admin panel available at http://localhost:3000/admin
```

### Тест 2: Admin login работает

1. Открыть http://localhost:3000/admin
2. Ввести новый пароль
3. Проверить, что dashboard открывается

### Тест 3: Email отправка работает

1. Открыть frontend http://localhost:5173
2. Заполнить форму контакта
3. Отправить
4. Проверить email: eduardbosak@gmail.com

### Тест 4: npm audit чистый

```bash
cd server
npm audit
```

**Ожидаемый вывод:** `found 0 vulnerabilities`

---

## 📋 Чеклист

- [ ] nodemailer обновлен до latest
- [ ] Gmail App Password настроен
- [ ] Hardcoded password удален
- [ ] Login endpoint создан
- [ ] JWT token реализован (опционально)
- [ ] Rate limiting добавлен (опционально)
- [ ] console.log удалены/обернуты
- [ ] npm audit показывает 0 vulnerabilities
- [ ] Все тесты пройдены

---

## 🚀 После исправлений

Проект будет **95% готов к продакшену**!

Остальные 5% - это:

- Unit tests
- E2E tests
- Monitoring setup
- CI/CD pipeline

Но для запуска и использования это не критично.

---

**Good luck! 🎉**
