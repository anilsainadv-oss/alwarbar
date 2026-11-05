import { NextResponse } from 'next/server';
import { localDb } from '@/lib/db';

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    localDb.incrementFormDownload(id);
  }
  return NextResponse.json({ success: true });
}
