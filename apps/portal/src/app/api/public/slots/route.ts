import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Public endpoint - no auth required
// Returns available (not booked) slots for the next 14 days

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get slots for the next 14 days that are not booked
    const now = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

    const { data: slots, error } = await supabase
      .from('slots')
      .select('id, start_time, end_time')
      .eq('is_booked', false)
      .gte('start_time', now.toISOString())
      .lte('start_time', twoWeeksLater.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching slots:', error);
      return NextResponse.json(
        { error: 'Failed to fetch slots' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Format slots for the frontend
    const formattedSlots = (slots || []).map(slot => {
      const date = new Date(slot.start_time);
      const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

      return {
        id: slot.id,
        datetime: slot.start_time,
        label: `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]} — ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      };
    });

    return NextResponse.json(
      {
        slots: formattedSlots,
        count: formattedSlots.length
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Public slots API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
