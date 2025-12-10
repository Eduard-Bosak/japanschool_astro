import { NextResponse } from 'next/server';

// Process start time for uptime calculation
const startTime = Date.now();

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export async function GET() {
  return NextResponse.json({
    nodeVersion: process.version,
    nextVersion: '15.x',
    environment: process.env.NODE_ENV || 'development',
    uptime: formatUptime(Date.now() - startTime),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  });
}
