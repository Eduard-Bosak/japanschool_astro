import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { SlotStatus } from '@/types';

async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        }
      }
    }
  );
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/slots/[id]/status
 * Update slot status (admin only)
 * Body: { status: 'completed' | 'missed' | 'canceled_teacher' }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get current user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { status } = (await request.json()) as { status: SlotStatus };

    if (!status || !['completed', 'missed', 'canceled_teacher'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: completed, missed, or canceled_teacher' },
        { status: 400 }
      );
    }

    // Get the slot
    const { data: slot, error: slotError } = await supabase
      .from('slots')
      .select('*')
      .eq('id', id)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Update slot status
    const { error: updateError } = await supabase.from('slots').update({ status }).eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update slot status' }, { status: 500 });
    }

    // If teacher cancels, return lesson to student
    if (status === 'canceled_teacher' && slot.student_id) {
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('lessons_remaining')
        .eq('id', slot.student_id)
        .single();

      if (studentProfile) {
        await supabase
          .from('profiles')
          .update({ lessons_remaining: studentProfile.lessons_remaining + 1 })
          .eq('id', slot.student_id);

        // Also clear the booking
        await supabase.from('slots').update({ is_booked: false, student_id: null }).eq('id', id);

        return NextResponse.json({
          success: true,
          message: 'Slot cancelled by teacher. Lesson returned to student.'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Slot status updated to: ${status}`,
      status
    });
  } catch (error) {
    console.error('Update slot status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
