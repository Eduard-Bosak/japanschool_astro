/* =============================
   Backend Server for Japan School
   EN: Express server for handling form submissions
   RU: Express сервер для обработки отправки форм
   ============================= */

/* eslint-disable no-console */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createSubmissionAppender, readSubmissionsSafe } from './utils/storage.js';

/** @typedef {import('express').Request} Request */
/** @typedef {import('express').Response} Response */
/** @typedef {import('express').RequestHandler} RequestHandler */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set working directory to server folder
process.chdir(__dirname);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

/* ===== Middleware ===== */
app.use(cors()); // Allow cross-origin requests / Разрешить кросс-доменные запросы
app.use(express.json()); // Parse JSON bodies / Парсить JSON тела запросов
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies / Парсить URL-encoded тела

/* ===== Email Configuration ===== */
// Configure your email service here / Настройте ваш email сервис здесь
const EMAIL_TRANSPORT = process.env.EMAIL_TRANSPORT || 'smtp';

const MAX_MESSAGE_LENGTH = Number(process.env.MAX_MESSAGE_LENGTH) || 1000;
const submissionsFile = join(__dirname, 'submissions.json');
const appendSubmission = createSubmissionAppender(submissionsFile);

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function containsHtml(value) {
  return typeof value === 'string' && /[<>]/.test(value);
}

function createEmailTransporter() {
  if (EMAIL_TRANSPORT === 'json') {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  /** @type {import('nodemailer').TransportOptions & {
    host: string;
    port: number;
    secure: boolean;
    auth: { user: string; pass: string };
  }} */
  const smtpOptions = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  };

  return nodemailer.createTransport(smtpOptions);
}

const transporter = createEmailTransporter();

const formLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  max: Number(process.env.RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Слишком много запросов. Попробуйте позже.'
  }
});

/* ===== Validate email format ===== */
/**
 * @param {string} email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/* ===== Validate phone format (Russian) ===== */
/**
 * @param {string} phone
 */
function isValidPhone(phone) {
  // Accepts formats: +7XXXXXXXXXX, 8XXXXXXXXXX, 7XXXXXXXXXX
  const phoneRegex = /^(\+?7|8)?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/;
  return phoneRegex.test(phone);
}

/* ===== Sanitize input to prevent XSS ===== */
/**
 * @template T
 * @param {T} input
 * @returns {T | string}
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/* ===== Health check endpoint ===== */
app.get('/health', (/** @type {Request} */ req, /** @type {Response} */ res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ===== Form submission endpoint ===== */
app.post(
  '/api/submit-form',
  formLimiter,
  async (/** @type {Request} */ req, /** @type {Response} */ res) => {
    try {
      const { name, email, phone, level, message, formType } = req.body;

      /* ===== Validation ===== */
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Имя должно содержать минимум 2 символа'
        });
      }

      if (!email || !isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          error: 'Некорректный email адрес'
        });
      }

      if (!phone || !isValidPhone(phone)) {
        return res.status(400).json({
          success: false,
          error: 'Некорректный номер телефона'
        });
      }

      if (containsHtml(name)) {
        return res.status(400).json({
          success: false,
          error: 'Имя содержит недопустимые символы'
        });
      }

      if (message && message.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({
          success: false,
          error: `Сообщение не должно превышать ${MAX_MESSAGE_LENGTH} символов`
        });
      }

      /* ===== Sanitize inputs ===== */
      const sanitizedData = {
        name: sanitizeInput(name.trim()),
        email: sanitizeInput(email.trim()),
        phone: sanitizeInput(phone.trim()),
        level: sanitizeInput(level || 'Не указан'),
        message: sanitizeInput(message || ''),
        formType: formType || 'general',
        timestamp: new Date().toISOString()
      };

      await appendSubmission(sanitizedData);

      const messageBlock = sanitizedData.message
        ? `
        <div style="margin-top: 20px; padding: 20px; background: #f5f7fa; border-radius: 8px; border-left: 4px solid #f06b93;">
          <h3 style="margin: 0 0 10px 0; color: #333;">💬 Сообщение:</h3>
          <p style="margin: 0; color: #555; line-height: 1.6;">${sanitizedData.message}</p>
        </div>
      `
        : '';

      /* ===== Send email notification ===== */
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@japanschool.com',
        to: process.env.ADMIN_EMAIL || 'admin@japanschool.com',
        subject: `🎌 Новая заявка: ${sanitizedData.name}`,
        html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f7fa; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #f06b93, #ffc107); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 28px;">🎌 Новая заявка</h1>
          </div>

          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #f06b93; margin-top: 0;">Контактная информация</h2>

            <div style="margin: 20px 0;">
              <p style="margin: 8px 0; color: #333;">
                <strong>👤 Имя:</strong> ${sanitizedData.name}
              </p>
              <p style="margin: 8px 0; color: #333;">
                <strong>📧 Email:</strong> <a href="mailto:${sanitizedData.email}" style="color: #f06b93;">${sanitizedData.email}</a>
              </p>
              <p style="margin: 8px 0; color: #333;">
                <strong>📱 Телефон:</strong> <a href="tel:${sanitizedData.phone}" style="color: #f06b93;">${sanitizedData.phone}</a>
              </p>
              <p style="margin: 8px 0; color: #333;">
                <strong>📚 Уровень:</strong> ${sanitizedData.level}
              </p>
                <p style="margin: 8px 0; color: #333;">
                  <strong>📝 Тип формы:</strong> ${sanitizedData.formType === 'hero' ? 'Главная (Hero)' : 'Контакты'}
                </p>
              </div>

              ${messageBlock}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px;">
              <p style="margin: 0;">📅 Дата: ${new Date(sanitizedData.timestamp).toLocaleString('ru-RU')}</p>
            </div>
          </div>
        </div>
      `
      };

      // Send email to admin / Отправить email администратору
      await transporter.sendMail(mailOptions);

      /* ===== Send auto-reply to user ===== */
      const userMailOptions = {
        from: process.env.EMAIL_USER || 'noreply@japanschool.com',
        to: sanitizedData.email,
        subject: '🎌 Спасибо за вашу заявку!',
        html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f06b93, #ffc107); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 28px;">🎌 Спасибо, ${sanitizedData.name}!</h1>
          </div>

          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Мы получили вашу заявку и свяжемся с вами в ближайшее время!
            </p>

            <div style="margin: 30px 0; padding: 20px; background: #f5f7fa; border-radius: 8px; border-left: 4px solid #f06b93;">
              <h3 style="margin: 0 0 10px 0; color: #f06b93;">Ваши данные:</h3>
              <p style="margin: 5px 0; color: #555;"><strong>Email:</strong> ${sanitizedData.email}</p>
              <p style="margin: 5px 0; color: #555;"><strong>Телефон:</strong> ${sanitizedData.phone}</p>
              <p style="margin: 5px 0; color: #555;"><strong>Уровень:</strong> ${sanitizedData.level}</p>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              С уважением,<br>
              <strong style="color: #f06b93;">Школа японского языка</strong>
            </p>
          </div>
        </div>
      `
      };

      // Send auto-reply to user / Отправить авто-ответ пользователю
      await transporter.sendMail(userMailOptions);

      /* ===== Success response ===== */
      res.json({
        success: true,
        message: 'Заявка успешно отправлена!',
        data: {
          name: sanitizedData.name,
          timestamp: sanitizedData.timestamp
        }
      });

      console.log(`✅ New submission from ${sanitizedData.name} (${sanitizedData.email})`);
    } catch (error) {
      console.error('❌ Error processing form:', error);
      res.status(500).json({
        success: false,
        error: 'Произошла ошибка при отправке заявки. Попробуйте позже.'
      });
    }
  }
);

/* ===== Get all submissions (admin endpoint) ===== */
app.get('/api/submissions', async (/** @type {Request} */ req, /** @type {Response} */ res) => {
  try {
    const submissions = await readSubmissionsSafe(submissionsFile);

    res.json({
      success: true,
      count: submissions.length,
      data: submissions // Changed from 'submissions' to 'data'
    });
  } catch (error) {
    res.json({
      success: true,
      count: 0,
      data: [] // Changed from 'submissions' to 'data'
    });
  }
});

/* ===== Serve admin panel ===== */
app.get('/admin', (/** @type {Request} */ req, /** @type {Response} */ res) => {
  res.sendFile(join(__dirname, 'admin.html'));
});

/* ===== 404 handler ===== */
app.use((/** @type {Request} */ req, /** @type {Response} */ res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

/* ===== Start server ===== */
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════╗
║  🎌 Japan School Backend Server           ║
║  🚀 Running on http://localhost:${PORT}     ║
║  📝 Endpoints:                             ║
║     POST /api/submit-form                  ║
║     GET  /api/submissions                  ║
║     GET  /health                           ║
╚════════════════════════════════════════════╝
  `);
});

server.on('error', (/** @type {NodeJS.ErrnoException} */ err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});
