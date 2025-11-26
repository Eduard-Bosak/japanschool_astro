# 🧪 Quick Test Guide

## Backend Server Status

### ✅ Start Backend

```powershell
cd q:\japanschool\server
npm start
```

**Expected Output:**

```
╔════════════════════════════════════════════╗
║  🎌 Japan School Backend Server           ║
║  🚀 Running on http://localhost:3000     ║
╚════════════════════════════════════════════╝
```

---

### 🧪 Test API Endpoints

#### 1. Health Check

```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/health"

# Or open in browser
http://localhost:3000/health
```

**Expected:**

```json
{ "status": "ok", "message": "Server is running" }
```

---

#### 2. Get Submissions

```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/submissions"

# Or curl
curl http://localhost:3000/api/submissions
```

**Expected (empty database):**

```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

---

#### 3. Submit Form (POST)

```powershell
# PowerShell
$body = @{
    name = "Test User"
    email = "test@example.com"
    phone = "+79991234567"
    level = "N5"
    message = "Test submission"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/submit-form" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Expected:**

```json
{
  "success": true,
  "message": "Form submitted successfully"
}
```

---

#### 4. Check Submissions Again

После отправки формы, повторите запрос #2:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/submissions"
```

**Expected (with data):**

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "+79991234567",
      "level": "N5",
      "message": "Test submission",
      "timestamp": "2025-10-16T..."
    }
  ]
}
```

---

### 🌐 Test Admin Panel

1. **Open:** http://localhost:3000/admin
2. **Password:** `admin123`
3. **Expected:**
   - Login screen appears
   - Enter password
   - Dashboard loads with statistics
   - Table shows submissions (if any)

---

### 🚀 Frontend Server

```powershell
cd q:\japanschool
npm run dev
```

**Expected:**

```
🔄 Live Reload enabled on ws://localhost:35729
🚀 Starting server on http://localhost:5173
```

**Test:**

- Open: http://localhost:5173
- Check console for errors (F12)
- Verify animations work
- Submit contact form
- Check admin panel for new submission

---

## 🐛 Troubleshooting

### Backend не запускается

```powershell
# Kill all node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait 2 seconds
Start-Sleep -Seconds 2

# Start fresh
cd q:\japanschool\server
npm start
```

### Port 3000 занят

```powershell
# Check what's using port 3000
netstat -ano | findstr ":3000"

# Kill specific process (replace PID)
taskkill /F /PID <PID>
```

### Admin показывает "Ошибка подключения"

1. Убедитесь что backend запущен (http://localhost:3000/health)
2. Проверьте `server/submissions.json` существует
3. Hard reload admin (Ctrl+F5)
4. Check browser console (F12)

---

## ✅ Current Status (as of last check)

- ✅ `server/submissions.json` created (empty array)
- ✅ `server/index.js` fixed (returns `data` instead of `submissions`)
- ✅ `server/admin.html` fixed (removed duplicate DOMContentLoaded)
- ✅ Backend code ready
- ✅ Frontend code ready

**Servers:**

- Backend: http://localhost:3000 (needs manual start)
- Frontend: http://localhost:5173 (needs manual start)
- Admin: http://localhost:3000/admin

---

## 📝 Next Steps

1. **Start both servers:**

   ```powershell
   # Terminal 1: Backend
   cd q:\japanschool\server
   npm start

   # Terminal 2: Frontend
   cd q:\japanschool
   npm run dev
   ```

2. **Test admin login:**
   - Open http://localhost:3000/admin
   - Password: `admin123`
   - Should show empty dashboard

3. **Submit test form:**
   - Use PowerShell POST request above
   - Or fill form on frontend (http://localhost:5173)

4. **Verify in admin:**
   - Refresh admin panel
   - Should see 1 submission
   - Click "Подробнее" to view modal

---

**Last Updated:** 2025-10-16 **Status:** ✅ Ready to test
