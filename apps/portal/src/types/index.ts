// ============================================
// Database Entity Types
// ============================================

/**
 * Tariff plan for students
 */
export type TariffPlan = {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  lessons_per_month: number;
  description: string | null;
  features: string[];
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

/**
 * User profile from profiles table
 */
export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  role: 'student' | 'admin';
  balance: number;
  tariff_id: string | null;
  tariff_expires_at: string | null;
  lessons_remaining: number;
  created_at: string;
  updated_at?: string;
};

/**
 * Student type (Profile with booking count and tariff)
 */
export type Student = Profile & {
  booking_count: number;
  tariff?: TariffPlan | null;
};

/**
 * Payment transaction
 */
export type Payment = {
  id: string;
  student_id: string | null;
  tariff_id: string | null;
  amount: number;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  payment_method: string | null;
  description: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  // Joined data
  student_email?: string;
  tariff_name?: string;
};

/**
 * Lesson slot from slots table
 */
export type Slot = {
  id: string;
  start_time: string;
  end_time?: string;
  is_booked: boolean;
  student_id: string | null;
  status?: SlotStatus;
  created_at: string;
  // Joined student profile (optional)
  student?: {
    email: string;
    display_name: string | null;
  } | null;
};

export type SlotStatus =
  | 'scheduled'
  | 'completed'
  | 'missed'
  | 'canceled_student'
  | 'canceled_teacher';

/**
 * Study material for students
 */
export type Material = {
  id: string;
  student_id: string;
  title: string;
  url: string;
  type: 'link' | 'file' | 'video';
  created_at: string;
};

/**
 * Activity log entry
 */
export type ActivityLog = {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

/**
 * Notification settings
 */
export type NotificationSettings = {
  user_id: string;
  email_booking_created: boolean;
  email_booking_cancelled: boolean;
  email_daily_digest: boolean;
  email_weekly_digest: boolean;
  email_slot_reminder: boolean;
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
  updated_at?: string;
};

/**
 * System settings
 */
export type SystemSetting = {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at?: string;
};

// ============================================
// Component Props Types
// ============================================

/**
 * Dashboard statistics
 */
export type DashboardStats = {
  totalStudents: number;
  activeSlots: number;
  totalBookings: number;
  completedLessons: number;
  missedLessons: number;
};

/**
 * Chart data for booking statistics
 */
export type BookingChartData = {
  date: string;
  total: number;
  booked: number;
  free: number;
};

/**
 * Popular time chart data
 */
export type PopularTimeData = {
  hour: string;
  count: number;
};

/**
 * Recent booking display type
 */
export type RecentBooking = {
  id: string;
  start_time: string;
  student_email: string | null;
  created_at: string;
};

/**
 * Booking history entry
 */
export type BookingHistory = {
  id: string;
  start_time: string;
  created_at: string;
  status?: SlotStatus;
};

// ============================================
// API Response Types
// ============================================

export type ApiResponse<T> = {
  data: T | null;
  error: Error | null;
};
