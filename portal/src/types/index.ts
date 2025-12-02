// ============================================
// Database Entity Types
// ============================================

/**
 * User profile from profiles table
 */
export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  role: 'student' | 'admin';
  balance: number;
  created_at: string;
  updated_at?: string;
};

/**
 * Student type (Profile with booking count)
 */
export type Student = Profile & {
  booking_count: number;
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
