import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramNotification } from '@/lib/telegram';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Helper to create supabase client for API routes
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

/**
 * POST /api/bookings
 * Book a slot - freezes a lesson from student's balance
 * Body: { slotId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slotId } = await request.json();

    if (!slotId) {
      return NextResponse.json({ error: 'slotId is required' }, { status: 400 });
    }

    // Get student profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance, display_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if student has lessons
    if (profile.balance <= 0) {
      return NextResponse.json(
        { error: 'No lessons remaining. Please purchase more lessons.' },
        { status: 400 }
      );
    }

    // Check if slot exists and is available
    const { data: slot, error: slotError } = await supabase
      .from('slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (slot.is_booked) {
      return NextResponse.json({ error: 'Slot is already booked' }, { status: 400 });
    }

    // Book the slot (transaction: update slot + decrement lessons)
    const { error: bookError } = await supabase
      .from('slots')
      .update({
        is_booked: true,
        student_id: user.id,
        status: 'scheduled'
      })
      .eq('id', slotId);

    if (bookError) {
      return NextResponse.json({ error: 'Failed to book slot' }, { status: 500 });
    }

    // Decrement balance (freeze lesson)
    const { error: decrementError } = await supabase
      .from('profiles')
      .update({ balance: profile.balance - 1 })
      .eq('id', user.id);

    if (decrementError) {
      // Rollback slot booking
      await supabase
        .from('slots')
        .update({ is_booked: false, student_id: null, status: null })
        .eq('id', slotId);

      return NextResponse.json({ error: 'Failed to update lesson balance' }, { status: 500 });
    }

    // Send Telegram notification (async, don't wait)
    const slotDate = new Date(slot.start_time);
    sendTelegramNotification({
      type: 'booking_created',
      studentEmail: user.email || 'unknown',
      studentName: profile.display_name || undefined,
      date: format(slotDate, 'd MMMM yyyy', { locale: ru }),
      time: format(slotDate, 'HH:mm')
    }).catch((err) => console.error('Telegram notification failed:', err));

    return NextResponse.json({
      success: true,
      message: 'Slot booked successfully',
      lessonsRemaining: profile.balance - 1
    });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/bookings
 * Cancel a booking - returns lesson if more than 24h before start
 * Body: { slotId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slotId } = await request.json();

    if (!slotId) {
      return NextResponse.json({ error: 'slotId is required' }, { status: 400 });
    }

    // Get the slot
    const { data: slot, error: slotError } = await supabase
      .from('slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Check if user owns this booking
    if (slot.student_id !== user.id) {
      return NextResponse.json({ error: 'Not your booking' }, { status: 403 });
    }

    // Check if more than 24 hours before lesson
    const slotTime = new Date(slot.start_time);
    const now = new Date();
    const hoursUntilLesson = (slotTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Cancel the booking
    const { error: cancelError } = await supabase
      .from('slots')
      .update({
        is_booked: false,
        student_id: null,
        status: 'canceled_student'
      })
      .eq('id', slotId);

    if (cancelError) {
      return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
    }

    // Return lesson only if cancelled more than 24h before
    let lessonReturned = false;
    if (hoursUntilLesson >= 24) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ balance: profile.balance + 1 })
          .eq('id', user.id);
        lessonReturned = true;
      }
    }

    return NextResponse.json({
      success: true,
      message: lessonReturned
        ? 'Booking cancelled. Lesson returned to your balance.'
        : 'Booking cancelled. Lesson not returned (cancelled less than 24h before).',
      lessonReturned
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/bookings
 * Get student's bookings
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: bookings, error } = await supabase
      .from('slots')
      .select('*')
      .eq('student_id', user.id)
      .order('start_time', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
