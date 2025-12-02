import { NextResponse } from 'next/server';

/**
 * API endpoint for Web Vitals data
 * In production, this would fetch from Vercel Speed Insights API
 * For now, it returns simulated good values based on our optimizations
 */
export async function GET() {
  // Simulated Web Vitals based on our optimization work
  // In production, you could integrate with Vercel Speed Insights API
  const vitals = {
    LCP: 1.2 + Math.random() * 0.3,  // ~1.2-1.5s (good < 2.5s)
    FID: 8 + Math.random() * 5,       // ~8-13ms (good < 100ms)
    CLS: 0.02 + Math.random() * 0.03, // ~0.02-0.05 (good < 0.1)
    FCP: 0.8 + Math.random() * 0.2,   // ~0.8-1.0s (good < 1.8s)
    TTFB: 80 + Math.random() * 40,    // ~80-120ms (good < 200ms)
    INP: 40 + Math.random() * 20,     // ~40-60ms (good < 200ms)
  };

  // Calculate performance score (simplified)
  const scores = {
    LCP: vitals.LCP <= 2.5 ? 100 : vitals.LCP <= 4 ? 50 : 0,
    FID: vitals.FID <= 100 ? 100 : vitals.FID <= 300 ? 50 : 0,
    CLS: vitals.CLS <= 0.1 ? 100 : vitals.CLS <= 0.25 ? 50 : 0,
    FCP: vitals.FCP <= 1.8 ? 100 : vitals.FCP <= 3 ? 50 : 0,
    TTFB: vitals.TTFB <= 200 ? 100 : vitals.TTFB <= 500 ? 50 : 0,
    INP: vitals.INP <= 200 ? 100 : vitals.INP <= 500 ? 50 : 0,
  };

  const avgScore = Math.round(
    (scores.LCP * 0.25 + scores.FID * 0.15 + scores.CLS * 0.15 + 
     scores.FCP * 0.15 + scores.TTFB * 0.15 + scores.INP * 0.15)
  );

  return NextResponse.json({
    vitals: {
      LCP: Math.round(vitals.LCP * 100) / 100,
      FID: Math.round(vitals.FID),
      CLS: Math.round(vitals.CLS * 1000) / 1000,
      FCP: Math.round(vitals.FCP * 100) / 100,
      TTFB: Math.round(vitals.TTFB),
      INP: Math.round(vitals.INP),
    },
    score: avgScore,
    source: 'simulated', // In production: 'vercel-speed-insights'
    timestamp: new Date().toISOString(),
  });
}
