import { NextResponse } from 'next/server';
import { getCurrentUser, assertPublicAdmin } from '@/lib/auth/guards';
import {
  getR2Status,
  testR2Connection,
  generateSignedDownloadUrl,
  deletePdfFromR2,
  isR2Configured
} from '@/lib/storage/r2-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const status = await getR2Status();

    return NextResponse.json({
      success: true,
      status,
      setupInstructions: !status.configured
        ? {
            title: 'Cloudflare R2 Configuration Pending',
            steps: [
              'Log into the Cloudflare Dashboard (dash.cloudflare.com).',
              'Navigate to R2 Object Storage and create a private bucket (e.g., "alwar-court-judgments").',
              'Go to "Manage R2 API Tokens" and create an API token with "Object Read & Write" permissions.',
              'Add the following 4 environment variables to your .env.local file or production environment:',
              '  CLOUDFLARE_ACCOUNT_ID="your-32-character-account-id"',
              '  CLOUDFLARE_R2_ACCESS_KEY_ID="your-r2-access-key-id"',
              '  CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"',
              '  CLOUDFLARE_R2_BUCKET_NAME="alwar-court-judgments"',
              'Restart the application and click "Test Connection" in the Admin Dashboard.'
            ]
          }
        : null
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized';
    const statusCode = message.includes('Unauthorized') || message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    assertPublicAdmin(user);

    const body = await req.json();
    const action = body.action;

    if (action === 'test_connection') {
      const testResult = await testR2Connection();
      return NextResponse.json(testResult);
    }

    if (action === 'get_signed_url') {
      const key = body.key;
      if (!key) {
        return NextResponse.json({ error: 'Storage key is required' }, { status: 400 });
      }

      if (!isR2Configured()) {
        return NextResponse.json(
          { error: 'R2 Configuration Pending: Cannot generate signed URL without R2 credentials.' },
          { status: 503 }
        );
      }

      const signedUrl = await generateSignedDownloadUrl(key, 3600);
      return NextResponse.json({ success: true, signedUrl, key });
    }

    if (action === 'delete_pdf') {
      const key = body.key;
      if (!key) {
        return NextResponse.json({ error: 'Storage key is required' }, { status: 400 });
      }

      await deletePdfFromR2(key);
      return NextResponse.json({ success: true, message: `PDF at ${key} deleted from R2.` });
    }

    return NextResponse.json({ error: 'Unknown action specified' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to execute R2 operation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
