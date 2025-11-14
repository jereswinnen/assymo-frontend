import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ||
             req.headers.get('cf-connecting-ip') ||
             'unknown';

  return NextResponse.json({ ip });
}
