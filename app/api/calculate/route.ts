import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Direct settlement calculation is disabled. Use /api/estimate/preview and complete verification to unlock exact estimates.'
    },
    { status: 410 }
  );
}
