import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Create client with service role key for bypassing RLS
function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Create client with user session for auth check
async function createAuthClient() {
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
 * DELETE /api/slots/[id]
 * Delete a slot (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authClient = await createAuthClient();
    const serviceClient = createServiceClient();
    const { id } = await params;

    // Get current user using auth client
    const {
      data: { user },
      error: authError
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin using service client (bypasses RLS)
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'teacher') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if slot is booked using service client
    const { data: slot, error: slotError } = await serviceClient
      .from('slots')
      .select('is_booked, student_id')
      .eq('id', id)
      .single();

    if (slotError || !slot) {
      console.error('Slot fetch error:', slotError);
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    if (slot.is_booked && slot.student_id) {
      // Return lesson to student before deleting
      const { data: studentProfile } = await serviceClient
        .from('profiles')
        .select('lessons_remaining')
        .eq('id', slot.student_id)
        .single();

      if (studentProfile) {
        await serviceClient
          .from('profiles')
          .update({ lessons_remaining: studentProfile.lessons_remaining + 1 })
          .eq('id', slot.student_id);
      }
    }

    // Delete the slot using service client (bypasses RLS)
    const { error: deleteError } = await serviceClient.from('slots').delete().eq('id', id);

    if (deleteError) {
      console.error('Error deleting slot:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete slot: ' + deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: slot.is_booked ? 'Slot deleted. Lesson returned to student.' : 'Slot deleted.'
    });
  } catch (error) {
    console.error('Delete slot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
