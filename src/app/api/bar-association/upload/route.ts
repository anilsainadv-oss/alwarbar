import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCurrentUser } from '@/lib/auth/guards';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'bar-members');

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'public_admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized: Only Bar Association Administrators can upload photos.' 
      }, { status: 403 });
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const contentType = req.headers.get('content-type') || '';

    // Handle Multipart Form Data
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file uploaded.' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || '.jpg';
      const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
      const filename = `advocate_${Date.now()}_${cleanName}${ext}`;
      const filePath = path.join(UPLOAD_DIR, filename);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/bar-members/${filename}`;
      return NextResponse.json({ 
        success: true, 
        url: publicUrl,
        filename 
      });
    }

    // Handle Base64 JSON Payload
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { base64Data, filename: originalName } = body;

      if (!base64Data) {
        return NextResponse.json({ success: false, error: 'base64Data is required.' }, { status: 400 });
      }

      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = '.jpg';

      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        if (mimeType.includes('png')) ext = '.png';
        else if (mimeType.includes('webp')) ext = '.webp';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(base64Data, 'base64');
      }

      const filename = `advocate_${Date.now()}${ext}`;
      const filePath = path.join(UPLOAD_DIR, filename);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/bar-members/${filename}`;
      return NextResponse.json({ 
        success: true, 
        url: publicUrl,
        filename 
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported Content-Type' }, { status: 400 });

  } catch (err: any) {
    console.error('Photo Upload Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
