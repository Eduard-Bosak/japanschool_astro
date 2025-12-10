import { supabase } from './supabase';

export async function logActivity(
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_email: user.email,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || {}
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
