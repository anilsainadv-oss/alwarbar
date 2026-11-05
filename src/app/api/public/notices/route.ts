import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';

export async function GET() {
  const notices = localDb.getNotices();
  return NextResponse.json({ notices });
}
