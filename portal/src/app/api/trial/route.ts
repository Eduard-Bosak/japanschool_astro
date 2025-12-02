import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side operations
// Uses service role key for bypassing RLS on insert
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TrialRequestBody {
  name: string;
  email: string;
  goal?: string;
  level?: string;
  message?: string;
  phone?: string;
  utm?: string;
  page?: string;
  timestamp?: string;
  source?: string;
}

// CORS headers for cross-origin requests from landing page
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// Rate limiting map (in production use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // max requests
const RATE_WINDOW = 60 * 1000; // per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }

  if (record.count >= RATE_LIMIT) {
    return true;
  }

  record.count++;
  return false;
}

function parseUTMParams(utmString?: string): Record<string, string> {
  if (!utmString) return {};

  const params = new URLSearchParams(utmString);
  return {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || ''
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Rate limiting check
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: corsHeaders }
      );
    }

    // Parse request body
    const body: TrialRequestBody = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name is required (min 2 characters)' },
        { status: 400, headers: corsHeaders }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!body.email || !emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Parse UTM parameters
    const utmParams = parseUTMParams(body.utm);

    // Determine source
    const source = body.source || (body.page?.includes('/blog') ? 'blog' : 'landing');

    // Insert into database
    const { data, error } = await supabase
      .from('trial_requests')
      .insert([
        {
          name: body.name.trim(),
          email: body.email.trim().toLowerCase(),
          goal: body.goal?.trim() || null,
          level: body.level?.trim() || null,
          message: body.message?.trim() || null,
          phone: body.phone?.trim() || null,
          utm_source: utmParams.utm_source || source,
          utm_medium: utmParams.utm_medium || null,
          utm_campaign: utmParams.utm_campaign || null,
          referrer: body.page || null,
          ip_address: ip !== 'unknown' ? ip : null
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error('[Trial API] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to submit request. Please try again.' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        message: 'Trial lesson request submitted successfully',
        id: data?.id
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (err) {
    console.error('[Trial API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// CORS preflight handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  });
}
