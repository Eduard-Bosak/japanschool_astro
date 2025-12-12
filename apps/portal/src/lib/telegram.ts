/**
 * Telegram notification utility
 * Sends notifications to configured Telegram chat when bookings/events occur
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface TelegramMessage {
  type: 'booking_created' | 'booking_cancelled' | 'lesson_completed' | 'lesson_missed';
  studentEmail: string;
  studentName?: string;
  date: string;
  time: string;
}

/**
 * Get Telegram settings from database
 */
async function getTelegramSettings() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only for this operation
        }
      }
    }
  );

  // Get admin user's notification settings
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .single();

  if (!adminProfile) return null;

  const { data: settings } = await supabase
    .from('notification_settings')
    .select('telegram_bot_token, telegram_chat_id')
    .eq('user_id', adminProfile.id)
    .single();

  return settings;
}

/**
 * Format message for Telegram
 */
function formatMessage(msg: TelegramMessage): string {
  const emoji = {
    booking_created: '📅',
    booking_cancelled: '❌',
    lesson_completed: '✅',
    lesson_missed: '⚠️'
  };

  const titles = {
    booking_created: 'Новая запись!',
    booking_cancelled: 'Отмена записи',
    lesson_completed: 'Урок проведён',
    lesson_missed: 'Урок пропущен'
  };

  const studentDisplay = msg.studentName || msg.studentEmail;

  return `${emoji[msg.type]} *${titles[msg.type]}*

👤 ${studentDisplay}
📧 \`${msg.studentEmail}\`
📆 ${msg.date}
🕐 ${msg.time}`;
}

/**
 * Send Telegram notification
 */
export async function sendTelegramNotification(message: TelegramMessage): Promise<boolean> {
  try {
    const settings = await getTelegramSettings();

    if (!settings?.telegram_bot_token || !settings?.telegram_chat_id) {
      // Telegram not configured, silently skip
      return false;
    }

    const url = `https://api.telegram.org/bot${settings.telegram_bot_token}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: settings.telegram_chat_id,
        text: formatMessage(message),
        parse_mode: 'Markdown'
      })
    });

    if (!response.ok) {
      console.error('Telegram API error:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}
